javascript: (async () => {
    const loadJSZip = () => new Promise(r => {
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        s.onload = r; document.head.appendChild(s);
    });

    if (window._lv_token) { return startDownload(window._lv_token); }

    let token = null;
    const originalFetch = window.fetch;

    // 미니멀 토스트 UI
    const toast = document.createElement('div');
    toast.id = 'dl-toast';
    toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#0f172a,#1e293b);padding:16px 28px;border-radius:12px;z-index:999999;color:#e2e8f0;font-family:system-ui,sans-serif;font-size:14px;box-shadow:0 8px 32px rgba(0,0,0,0.4);border:1px solid #334155;display:flex;align-items:center;gap:12px;';
    toast.innerHTML = '<span style="font-size:20px;">🔑</span><span>에디터 상단의 아무 버튼(Code/Preview 등)을 한번 눌러주세요</span><button id="dl-cancel" style="margin-left:12px;background:none;border:1px solid #475569;color:#94a3b8;padding:4px 12px;border-radius:6px;cursor:pointer;font-size:12px;">취소</button>';
    document.body.appendChild(toast);

    const cleanup = () => {
        window.fetch = originalFetch;
        const el = document.getElementById('dl-toast');
        if (el) el.remove();
    };
    document.getElementById('dl-cancel').onclick = cleanup;

    // fetch 가로채기: API 호출 시 토큰 탈취
    window.fetch = async (...args) => {
        const url = args[0]?.toString() || '';
        const opts = args[1] || {};
        const auth = opts.headers?.Authorization || opts.headers?.authorization;
        if (url.includes('api.lovable.dev') && auth) {
            token = auth.replace('Bearer ', '').trim();
            window._lv_token = token;
            cleanup();
            startDownload(token);
            return Promise.reject(new Error('token captured'));
        }
        return originalFetch(...args);
    };

    async function startDownload(tk) {
        await loadJSZip();
        const zip = new JSZip();
        const pid = window.location.pathname.split('/')[2];
        const api = 'https://api.lovable.dev/projects/' + pid + '/files/raw?path=';

        // 상단 프로그레스 바
        const bar = document.createElement('div');
        bar.id = 'dl-bar';
        bar.style.cssText = 'position:fixed;top:0;left:0;width:0%;height:3px;background:linear-gradient(90deg,#3b82f6,#8b5cf6);z-index:999999;transition:width 0.2s;';
        document.body.appendChild(bar);

        const status = document.createElement('div');
        status.id = 'dl-status';
        status.style.cssText = 'position:fixed;top:8px;right:16px;background:#0f172a;color:#e2e8f0;padding:8px 16px;border-radius:8px;z-index:999999;font-family:system-ui,sans-serif;font-size:13px;border:1px solid #334155;';
        status.textContent = '📂 폴더 스캔중...';
        document.body.appendChild(status);

        // 닫힌 폴더 동시 클릭으로 전개
        let lc = 20;
        while (lc-- > 0) {
            const closed = Array.from(document.querySelectorAll('.overflow-x-auto .group')).filter(r => {
                const s = r.querySelector('svg.transition-transform');
                return s && !s.classList.contains('rotate-90');
            });
            if (!closed.length) break;
            closed.forEach(f => f.click());
            await new Promise(r => setTimeout(r, 80));
        }

        // DOM에서 파일 경로 추출
        const rows = document.querySelectorAll('.overflow-x-auto .group');
        let stack = [], files = [];
        for (const r of rows) {
            const n = r.querySelector('[title]')?.getAttribute('title');
            if (!n) continue;
            const d = parseInt(r.querySelector('[style*="margin-left"]')?.style.marginLeft || 0) / 16;
            stack = stack.slice(0, d);
            if (r.querySelector('svg.transition-transform') || !n.includes('.')) {
                stack.push(n);
            } else {
                files.push(stack.length ? stack.join('/') + '/' + n : n);
            }
        }

        // 30개씩 병렬 다운로드
        let done = 0;
        const total = files.length;
        status.textContent = '📥 ' + done + '/' + total;

        for (let i = 0; i < files.length; i += 30) {
            const batch = files.slice(i, i + 30);
            await Promise.all(batch.map(async path => {
                for (let retry = 0; retry < 3; retry++) {
                    try {
                        const res = await fetch(api + encodeURIComponent(path), { headers: { 'Authorization': 'Bearer ' + tk } });
                        if (res.ok) { zip.file(path, await res.text()); break; }
                        if (res.status === 401) break;
                    } catch (e) { await new Promise(r => setTimeout(r, 300)); }
                }
                done++;
                status.textContent = '📥 ' + done + '/' + total;
                bar.style.width = (done / total * 100) + '%';
            }));
        }

        status.textContent = '📦 압축 중...';
        const blob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'project-' + pid + '.zip'; a.click();

        status.textContent = '✅ 완료!';
        bar.style.background = '#10b981';
        bar.style.width = '100%';
        setTimeout(() => { bar.remove(); status.remove(); }, 3000);
    }
})();
