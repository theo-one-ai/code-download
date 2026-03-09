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

1. 이 저장소를 클론하거나 ZIP으로 다운로드합니다.
   ```bash
   git clone https://github.com/YOUR_USERNAME/download_code.git
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
