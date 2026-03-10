chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "EXTRACT_AND_DOWNLOAD") {
        chrome.runtime.sendMessage({ action: "GET_AUTH_INFO" }, (authInfo) => {
            extractFiles(request.projectId, authInfo)
                .then(files => sendResponse({ success: true, files }))
                .catch(e => sendResponse({ success: false, error: e.message }));
        });
        return true;
    }
});

async function extractFiles(projectId, authInfo) {
    const authHeader = authInfo ? authInfo.auth : null;
    let finalAuth = authHeader;

    if (!finalAuth) {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.includes('sb-') && key.includes('-auth-token')) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    if (data && data.access_token) { finalAuth = `Bearer ${data.access_token}`; break; }
                } catch (e) { }
            }
        }
        if (!finalAuth) {
            throw new Error("🚨 인증 토큰 없음. 에디터 내 파일 클릭 후 재시도 필요.");
        }
    }

    console.log("[Lovable Downloader] DOM 스크래퍼 구동: 파일 트리 자동 전개");

    // 1. 닫힌 폴더 동시 클릭으로 트리 전개 (0.1초 컷)
    const ex = async () => {
        let loopLimit = 15;
        while (loopLimit-- > 0) {
            const closedFolders = Array.from(document.querySelectorAll('.overflow-x-auto .group')).filter(r => {
                const svg = r.querySelector('svg.transition-transform');
                return svg && !svg.classList.contains('rotate-90');
            });
            if (!closedFolders.length) break;
            // 다중 동시 클릭
            closedFolders.forEach(folder => folder.click());
            // React 렌더링 대기 (50ms)
            await new Promise(r => setTimeout(r, 50));
        }
    };
    await ex();

    // 2. 전개된 파일 트리 DOM 읽기
    const rs = document.querySelectorAll('.overflow-x-auto .group');
    let st = [], filePaths = [];

    for (const r of rs) {
        const titleEl = r.querySelector('[title]');
        if (!titleEl) continue;
        const name = titleEl.getAttribute('title');

        // CSS margin-left → 트리 깊이 (16px 단위)
        const ml = r.querySelector('[style*="margin-left"]')?.style.marginLeft || "0px";
        const depth = parseInt(ml) / 16;

        st = st.slice(0, depth);

        const isFolder = r.querySelector('svg.transition-transform') || !name.includes('.');
        if (isFolder) {
            st.push(name);
        } else {
            filePaths.push(st.length ? st.join('/') + '/' + name : name);
        }
    }

    if (filePaths.length === 0) {
        throw new Error("🚨 파일 트리 읽기 실패. 좌측 사이드바 확인 필요.");
    }

    console.log(`[Lovable Downloader] 파일 ${filePaths.length}개 감지, 초고속 다운로드 시작`);

    // 3. /files/raw?path API로 병렬 다운로드 (30개씩)
    const files = [];
    const headers = { 'Authorization': finalAuth };
    const batchSize = 30;


    for (let i = 0; i < filePaths.length; i += batchSize) {
        const batch = filePaths.slice(i, i + batchSize);
        const promises = batch.map(async (path) => {
            const fileUrl = `https://api.lovable.dev/projects/${projectId}/files/raw?path=${encodeURIComponent(path)}`;
            try {
                const res = await fetch(fileUrl, { headers });
                if (res.ok) {
                    const content = await res.text();
                    files.push({ path, content });
                }
            } catch (e) { }
        });
        await Promise.all(promises);
    }

    if (files.length === 0) {
        throw new Error("🚨 파일 다운로드 0건. 권한 오류 가능성.");
    }

    return files;
}
