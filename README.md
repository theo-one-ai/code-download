# Lovable 1-Click Source Downloader

Lovable 프로젝트의 소스 코드를 **클릭 한 번**으로 ZIP 파일로 다운로드할 수 있는 크롬 확장 프로그램(Chrome Extension)입니다.

Lovable은 소스 코드를 GitHub에 연동할 수 있지만, Private 저장소의 코드를 로컬로 가져오려면 번거로운 절차가 필요합니다.
이 확장 프로그램은 Lovable 에디터 페이지에서 직접 인증 정보를 활용하여, 별도의 GitHub 토큰 없이도 전체 소스 코드를 즉시 다운로드합니다.

## ✨ 주요 기능

- **원클릭 다운로드**: Lovable 프로젝트 에디터 페이지에서 버튼 한 번으로 전체 소스 코드 ZIP 다운로드
- **자동 인증**: Lovable API의 인증 토큰을 자동으로 감지하여 별도 토큰 입력 불필요
- **전체 파일 스캔**: Git 트리 API를 통해 프로젝트의 모든 파일을 빠짐없이 수집
- **폴백 지원**: API 트리 조회가 제한적일 경우 딥스캔 패턴으로 자동 전환

## 🚀 설치 방법

이 도구는 **크롬 확장 프로그램** 또는 설치가 필요 없는 **북마클릿(Bookmarklet)** 두 가지 방식으로 사용할 수 있습니다.

### 방법 1: 북마클릿 (초간편 방식 / 웹브라우저 즐겨찾기 바 클릭)

아래의 `[Lovable Download]` 버튼(링크 형태)을 마우스로 잡고(드래그) 브라우저의 책갈피(북마크) 표시줄로 떨어뜨립니다(드롭).

<a href="javascript:(async()=>{const l=()=>new Promise(r=>{const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';s.onload=r;document.head.appendChild(s)});if(window._lv_token){return sd(window._lv_token)}let t=null;const of=window.fetch;const ts=document.createElement('div');ts.id='dl-toast';ts.style.cssText='position:fixed;bottom:24px;left:50%25;transform:translateX(-50%25);background:linear-gradient(135deg,%230f172a,%231e293b);padding:16px 28px;border-radius:12px;z-index:999999;color:%23e2e8f0;font-family:system-ui,sans-serif;font-size:14px;box-shadow:0 8px 32px rgba(0,0,0,0.4);border:1px solid %23334155;display:flex;align-items:center;gap:12px;';ts.innerHTML='<span style=font-size:20px>🔑</span><span>에디터 상단 버튼(Code/Preview 등)을 한번 눌러주세요</span><button id=dl-x style=margin-left:12px;background:none;border:1px+solid+%23475569;color:%2394a3b8;padding:4px+12px;border-radius:6px;cursor:pointer;font-size:12px>취소</button>';document.body.appendChild(ts);const cln=()=>{window.fetch=of;const el=document.getElementById('dl-toast');if(el)el.remove()};document.getElementById('dl-x').onclick=cln;window.fetch=async function(...a){const u=a[0]?.toString()||'',op=a[1]||{},au=op.headers?.Authorization||op.headers?.authorization;if(u.includes('api.lovable.dev')%26%26au){t=au.replace('Bearer ','').trim();window._lv_token=t;cln();sd(t);return Promise.reject(new Error('ok'))}return of.apply(this,a)};async function sd(tk){await l();const z=new JSZip(),pid=window.location.pathname.split('/')[2],api='https://api.lovable.dev/projects/'+pid+'/files/raw?path=';const bar=document.createElement('div');bar.id='dl-bar';bar.style.cssText='position:fixed;top:0;left:0;width:0;height:3px;background:linear-gradient(90deg,%233b82f6,%238b5cf6);z-index:999999;transition:width 0.2s';document.body.appendChild(bar);const st=document.createElement('div');st.id='dl-st';st.style.cssText='position:fixed;top:8px;right:16px;background:%230f172a;color:%23e2e8f0;padding:8px 16px;border-radius:8px;z-index:999999;font-family:system-ui,sans-serif;font-size:13px;border:1px solid %23334155';st.textContent='📂 스캔중...';document.body.appendChild(st);let lc=20;while(lc-->0){const c=Array.from(document.querySelectorAll('.overflow-x-auto .group')).filter(r=>{const s=r.querySelector('svg.transition-transform');return s%26%26!s.classList.contains('rotate-90')});if(!c.length)break;c.forEach(f=>f.click());await new Promise(r=>setTimeout(r,80))}const rs=document.querySelectorAll('.overflow-x-auto .group');let sk=[],files=[];for(const r of rs){const n=r.querySelector('[title]')?.getAttribute('title');if(!n)continue;const d=parseInt(r.querySelector('[style*=%22margin-left%22]')?.style.marginLeft||0)/16;sk=sk.slice(0,d);if(r.querySelector('svg.transition-transform')||!n.includes('.')){sk.push(n)}else{files.push(sk.length?sk.join('/')+'/'+n:n)}}let dn=0,tot=files.length;st.textContent='📥 0/'+tot;for(let i=0;i<files.length;i+=30){const b=files.slice(i,i+30);await Promise.all(b.map(async p=>{for(let r=0;r<3;r++){try{const res=await fetch(api+encodeURIComponent(p),{headers:{'Authorization':'Bearer '+tk}});if(res.ok){z.file(p,await res.text());break}if(res.status===401)break}catch(e){await new Promise(r=>setTimeout(r,300))}}dn++;st.textContent='📥 '+dn+'/'+tot;bar.style.width=(dn/tot*100)+'%25'}))}st.textContent='📦 압축중...';const b=await z.generateAsync({type:'blob'});const u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download='project-'+pid+'.zip';a.click();st.textContent='✅ 완료!';bar.style.background='%2310b981';bar.style.width='100%25';setTimeout(()=>{bar.remove();st.remove()},3000)}})();" style="display:inline-block;padding:10px 15px;background-color:#0ea5e9;color:white;border-radius:6px;text-decoration:none;font-weight:bold;">✨ Lovable Download ✨</a>

1. **(설치)** 위 버튼을 잡아서 북마크바에 놓습니다.
2. **(실행)** Lovable 에디터 접속 중일 때 등록한 북마크를 살짝 클릭합니다.
*(설치 없이 북마크바에 복사+붙여넣기로 직접 URL 입력을 하셔도 무방합니다!)*

---

### 방법 2: 크롬 확장 프로그램 (수동 설치)

1. 이 저장소를 클론하거나 ZIP으로 다운로드합니다.
   ```bash
   git clone https://github.com/theo-one-ai/code-download.git
   ```
2. 크롬 브라우저에서 `chrome://extensions/` 주소로 이동합니다.
3. 우측 상단의 **개발자 모드(Developer mode)** 토글을 활성화합니다.
4. 좌측 상단의 **압축해제된 확장 프로그램을 로드합니다(Load unpacked)** 버튼을 클릭합니다.
5. 클론된 `download_code` **폴더를 통째로** 선택합니다. (`manifest.json`이 포함된 폴더)
   > ⚠️ 폴더 안의 개별 파일이 아닌, **폴더 자체**를 선택해야 합니다.

## 📖 사용 방법

1. [lovable.dev](https://lovable.dev)에서 프로젝트를 열고 에디터 페이지에 진입합니다.
2. 크롬 상단 확장 프로그램 아이콘에서 **Lovable Downloader**를 클릭합니다.
3. 프로젝트가 자동으로 감지되면 **소스코드 다운로드** 버튼을 누릅니다.
4. 잠시 후 ZIP 파일이 자동으로 다운로드됩니다.

> **참고**: 에디터 페이지에서 파일을 한 번 클릭하여 API 인증을 활성화한 후 다운로드하면 더 안정적입니다.

## 📁 프로젝트 구조

```
├── manifest.json      # Chrome Extension Manifest V3 설정
├── background.js      # 인증 토큰 감지 및 ZIP 생성/다운로드 처리
├── content.js         # Lovable API를 통한 파일 목록 조회 및 코드 추출
├── popup.html         # 확장 프로그램 팝업 UI
├── popup.js           # 팝업 동작 로직
├── popup.css          # 팝업 스타일
└── libs/              # 외부 라이브러리
    ├── jszip.min.js   # ZIP 파일 생성
    └── lucide.min.js  # 아이콘
```

## 🛠 기술 스택

- **Extension**: Chrome Extension Manifest V3
- **Language**: Vanilla JavaScript, HTML, CSS
- **Libraries**: JSZip (ZIP 생성), Lucide (아이콘)
- **API**: Lovable Git API (파일 트리 조회 및 코드 추출)
