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
    let refParam = authInfo ? authInfo.ref : null;

    // Auth 토큰이 없을 경우 로컬스토리지에서 백업 토큰을 탐색합니다.
    if (!authHeader) {
        let fallbackAuth = null;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.includes('sb-') && key.includes('-auth-token')) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    if (data && data.access_token) { fallbackAuth = `Bearer ${data.access_token}`; break; }
                } catch (e) { }
            }
        }
        if (!fallbackAuth) {
            throw new Error("🚨 인증 토큰을 찾을 수 없습니다. 에디터 내 파일을 한 번 클릭하여 권한을 활성화한 후 다시 시도해주세요.");
        }
    }

    const headers = { 'Authorization': authHeader, 'Accept': 'application/json' };
    let filePaths = [];

    console.log("[Lovable Downloader] 1단계: API 트리를 통해 전체 파일 목록을 조회합니다.");

    try {
        // refParam 이 없어도 프로젝트 전체 트리를 가져올 수 있는 경우가 있습니다.
        const treeUrl = `https://api.lovable.dev/projects/${projectId}/git/tree?recursive=1${refParam ? '&ref=' + refParam : ''}`;
        const treeRes = await fetch(treeUrl, { headers });

        if (treeRes.ok) {
            const treeData = await treeRes.json();
            if (treeData && treeData.tree) {
                filePaths = treeData.tree.filter(item => item.type === 'blob').map(item => item.path);
                console.log(`[Lovable Downloader] API 조회 성공! ${filePaths.length}개의 파일을 찾았습니다.`);
            }
        } else if (treeRes.status === 404 && refParam) {
            // refParam이 잘못되어 404가 뜨는 경우, ref 없이 재시도합니다.
            console.log("[Lovable Downloader] ref 없이 트리 조회를 재시도합니다.");
            const fallbackTreeUrl = `https://api.lovable.dev/projects/${projectId}/git/tree?recursive=1`;
            const fallbackRes = await fetch(fallbackTreeUrl, { headers });
            if (fallbackRes.ok) {
                const fbData = await fallbackRes.json();
                if (fbData && fbData.tree) {
                    filePaths = fbData.tree.filter(item => item.type === 'blob').map(item => item.path);
                    refParam = null; // ref 없이 성공했으므로 앞으로도 ref를 쓰지 않습니다.
                }
            }
        }
    } catch (e) {
        console.error("API Tree fetch error:", e);
    }

    // API 트리가 제한적일 경우를 대비한 딥스캔 패턴 폴백
    if (filePaths.length <= 10) {
        console.log("[Lovable Downloader] API 트리 조회가 제한적입니다. 딥스캔 스레시홀드로 전환하여 파일을 검색합니다.");
        let paths = new Set(filePaths);

        const baseFiles = [
            'package.json', 'index.html', 'src/App.tsx', 'src/main.tsx', 'src/index.css',
            'vite.config.ts', 'tsconfig.json', 'tsconfig.app.json', 'components.json',
            'postcss.config.js', 'tailwind.config.ts', 'bun.lock', '.gitignore',
            'src/App.css', 'src/vite-env.d.ts', 'vitest.config.ts', 'eslint.config.js',
            'tsconfig.node.json', 'README.md', 'public/favicon.ico', 'public/placeholder.svg', 'public/robots.txt'
        ];
        baseFiles.forEach(p => paths.add(p));

        const visibleFiles = [
            'accordion.tsx', 'alert-dialog.tsx', 'alert.tsx', 'aspect-ratio.tsx', 'avatar.tsx',
            'badge.tsx', 'breadcrumb.tsx', 'button.tsx', 'calendar.tsx', 'card.tsx', 'carousel.tsx',
            'chart.tsx', 'checkbox.tsx', 'collapsible.tsx', 'command.tsx', 'context-menu.tsx',
            'dialog.tsx', 'drawer.tsx', 'dropdown-menu.tsx', 'form.tsx', 'hover-card.tsx',
            'input-otp.tsx', 'input.tsx', 'label.tsx', 'menubar.tsx', 'navigation-menu.tsx',
            'pagination.tsx', 'popover.tsx', 'progress.tsx', 'radio-group.tsx', 'scroll-area.tsx',
            'select.tsx', 'separator.tsx', 'sheet.tsx', 'skeleton.tsx', 'slider.tsx', 'sonner.tsx',
            'switch.tsx', 'table.tsx', 'tabs.tsx', 'textarea.tsx', 'toast.tsx', 'toaster.tsx',
            'toggle-group.tsx', 'toggle.tsx', 'tooltip.tsx'
        ];

        const otherVisibleFiles = [
            'Navbar.tsx', 'HeroSection.tsx', 'IdentitySection.tsx', 'ProjectsSection.tsx', 'ContactSection.tsx',
            'LangContext.tsx', 'use-mobile.tsx', 'use-toast.ts', 'utils.ts', 'Index.tsx', 'NotFound.tsx',
            'example.test.ts', 'setup.ts'
        ];

        visibleFiles.forEach(f => paths.add(`src/components/ui/${f}`));
        otherVisibleFiles.forEach(f => {
            paths.add(`src/components/${f}`);
            paths.add(`src/contexts/${f}`);
            paths.add(`src/hooks/${f}`);
            paths.add(`src/lib/${f}`);
            paths.add(`src/pages/${f}`);
            paths.add(`src/test/${f}`);
            paths.add(`src/${f}`); // 혹시 모르니 src 직하단도 스캔
        });

        filePaths = Array.from(paths);
    }

    const files = [];
    console.log(`[Lovable Downloader] 총 ${filePaths.length}개 파일 다운로드 스캔 진입... (ref: ${refParam || '없음'})`);

    // 2단계: 수집된 파일 경로를 순회하며 코드 추출 진행
    const batchSize = 15;
    for (let i = 0; i < filePaths.length; i += batchSize) {
        const batch = filePaths.slice(i, i + batchSize);
        const promises = batch.map(async (path) => {
            try {
                // 다운로드 시 ref 파라미터가 유효하지 않을 수 있으므로 폴백 처리
                let fileUrl = `https://api.lovable.dev/projects/${projectId}/git/file?path=${encodeURIComponent(path)}${refParam ? '&ref=' + refParam : ''}`;
                let res = await fetch(fileUrl, { headers });

                if (!res.ok && refParam) {
                    fileUrl = `https://api.lovable.dev/projects/${projectId}/git/file?path=${encodeURIComponent(path)}`;
                    res = await fetch(fileUrl, { headers });
                }

                if (res.ok) {
                    const content = await res.text();
                    // 중복 및 비어있는 파일 제외
                    if (!files.find(f => f.path === path) && content.length > 0) {
                        files.push({ path, content });
                    }
                }
            } catch (e) { }
        });
        await Promise.all(promises);
    }

    if (files.length <= 3) {
        throw new Error("🚨 파일 다운로드 대상이 없습니다(권한/네트워크 오류). 페이지를 새로고침(F5)하고 다시 시도해 주세요.");
    }

    return files;
}
