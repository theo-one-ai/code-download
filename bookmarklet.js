(async function () {
    console.log("[Lovable Downloader] Starting bookmarklet...");
    const match = window.location.pathname.match(/\/projects\/([a-zA-Z0-9-]+)/);
    if (!match) {
        alert("Lovable 프로젝트 에디터 페이지에서 실행해주세요.");
        return;
    }
    const projectId = match[1];

    let auth = null;
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes('sb-') && key.includes('-auth-token')) {
            try {
                const data = JSON.parse(localStorage.getItem(key));
                if (data && data.access_token) { auth = `Bearer ${data.access_token}`; break; }
            } catch (e) { }
        }
    }

    if (!auth) {
        alert("인증 토큰을 찾을 수 없습니다. 에디터를 한 번 클릭한 후 다시 실행해주세요.");
        return;
    }

    const headers = { 'Authorization': auth, 'Accept': 'application/json' };
    let filePaths = [];
    alert("파일 목록을 조회합니다. 잠시만 기다려주세요...");

    try {
        const res = await fetch(`https://api.lovable.dev/projects/${projectId}/git/tree?recursive=1`, { headers });
        if (res.ok) {
            const data = await res.json();
            if (data && data.tree) filePaths = data.tree.filter(item => item.type === 'blob').map(item => item.path);
        }
    } catch (e) { console.error(e); }

    const files = [];
    const batchSize = 15;

    if (filePaths.length === 0) {
        alert("파일 목록을 가져올 수 없습니다. 권한이 없거나 지원되지 않는 저장소입니다.");
        return;
    }

    alert(`총 ${filePaths.length}개 파일 다운로드를 시작합니다...`);

    for (let i = 0; i < filePaths.length; i += batchSize) {
        const batch = filePaths.slice(i, i + batchSize);
        await Promise.all(batch.map(async (path) => {
            try {
                const res = await fetch(`https://api.lovable.dev/projects/${projectId}/git/file?path=${encodeURIComponent(path)}`, { headers });
                if (res.ok) {
                    const content = await res.text();
                    if (content.length > 0) files.push({ path, content });
                }
            } catch (e) { }
        }));
    }

    if (files.length <= 3) {
        alert("코드 추출 실패: 대상 파일이 거의 없습니다.");
        return;
    }

    try {
        if (!window.JSZip) {
            await new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
                script.onload = resolve;
                script.onerror = () => reject(new Error('JSZip 로드 실패'));
                document.head.appendChild(script);
            });
        }

        const zip = new window.JSZip();
        files.forEach(f => zip.file(f.path, f.content));

        const blob = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lovable-project-${projectId.slice(0, 8)}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        alert("다운로드가 완료되었습니다!");
    } catch (e) {
        console.error(e);
        alert(`ZIP 파일 생성 실패: ${e.message}`);
    }
})();
