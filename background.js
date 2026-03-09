importScripts("libs/jszip.min.js");

let lastAuthToken = null;
let lastRefParam = null;

// Lovable API로 전송되는 네트워크 요청을 감지하여 인증 헤더(Auth)와 파라미터(ref)를 수집합니다.
// 본 방식을 통해 안정적으로 토큰을 확보할 수 있습니다.
chrome.webRequest.onSendHeaders.addListener(
    function (details) {
        if (details.requestHeaders) {
            for (let i = 0; i < details.requestHeaders.length; i++) {
                if (details.requestHeaders[i].name.toLowerCase() === 'authorization') {
                    lastAuthToken = details.requestHeaders[i].value;
                }
            }
        }

        try {
            const url = new URL(details.url);
            const ref = url.searchParams.get('ref');
            if (ref) {
                lastRefParam = ref;
            }
        } catch (e) { }
    },
    { urls: ["https://api.lovable.dev/*"] },
    ["requestHeaders"]
);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // content.js가 팝업으로부터 실행 명령을 받았을 때, 백그라운드가 낚아챈 토큰을 넘겨줍니다.
    if (request.action === "GET_AUTH_INFO") {
        sendResponse({ auth: lastAuthToken, ref: lastRefParam });
        return true;
    }

    if (request.action === "PROCESS_ZIP_DOWNLOAD") {
        const zip = new JSZip();

        request.files.forEach(file => {
            zip.file(file.path, file.content);
        });

        zip.generateAsync({ type: "blob" }).then((blob) => {
            const reader = new FileReader();
            reader.onloadend = function () {
                const dataUrl = reader.result;
                chrome.downloads.download({
                    url: dataUrl,
                    filename: `lovable-project-${request.projectId || 'source'}.zip`,
                    conflictAction: "uniquify",
                    saveAs: true
                });
            };
            reader.readAsDataURL(blob);
        }).catch(error => {
            console.error("ZIP Generation failed:", error);
        });

        return true;
    }
});
