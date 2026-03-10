importScripts("libs/jszip.min.js");

let lastAuthToken = null;
let lastRefParam = null;

chrome.webRequest.onSendHeaders.addListener(
    function (details) {
        if (details.requestHeaders) {
            for (let i = 0; i < details.requestHeaders.length; i++) {
                if (details.requestHeaders[i].name.toLowerCase() === 'authorization') {
                    lastAuthToken = details.requestHeaders[i].value;
                }
            }
        }
    },
    { urls: ["https://api.lovable.dev/*"] },
    ["requestHeaders"]
);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "GET_AUTH_INFO") {
        sendResponse({ auth: lastAuthToken });
        return true;
    }

    if (request.action === "PROCESS_ZIP_DOWNLOAD") {
        if (!request.files || request.files.length === 0) return true;

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
