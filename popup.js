document.addEventListener("DOMContentLoaded", () => {
    lucide.createIcons();

    const projectIdText = document.getElementById("project-id-text");
    const statusMessage = document.getElementById("status-message");
    const downloadBtn = document.getElementById("download-btn");
    const projectInfo = document.getElementById("project-info");
    const progressSection = document.getElementById("progress-section");
    const progressText = document.getElementById("progress-text");

    let currentProjectId = null;

    // 활성 탭 조회
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];

        if (activeTab.url && activeTab.url.includes("lovable.dev/projects/")) {
            // 프로젝트 ID 추출
            const urlParts = new URL(activeTab.url).pathname.split("/");
            currentProjectId = urlParts[2]; // /projects/UUID

            if (currentProjectId) {
                projectInfo.classList.remove("hidden");
                projectIdText.textContent = `Project: ${currentProjectId.slice(0, 8)}...`;
                statusMessage.textContent = "Lovable 프로젝트 감지 완료.";
                statusMessage.className = "status-message status-success";
                downloadBtn.disabled = false;
            } else {
                statusMessage.textContent = "프로젝트 ID 없음.";
                statusMessage.className = "status-message status-error";
            }
        } else {
            statusMessage.textContent = "Lovable 에디터 페이지에서 실행 필요.";
            statusMessage.className = "status-message status-error";
        }
    });

    downloadBtn.addEventListener("click", () => {
        downloadBtn.disabled = true;
        progressSection.classList.remove("hidden");
        statusMessage.textContent = "코드 추출 중...";
        statusMessage.className = "status-message";

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            // Content script에 추출 명령 전송
            chrome.tabs.sendMessage(
                tabs[0].id,
                { action: "EXTRACT_AND_DOWNLOAD", projectId: currentProjectId },
                (response) => {
                    progressSection.classList.add("hidden");

                    if (chrome.runtime.lastError) {
                        statusMessage.textContent = "오류 발생. 새로고침 후 재시도.";
                        statusMessage.className = "status-message status-error";
                        downloadBtn.disabled = false;
                        return;
                    }

                    if (response && response.success) {
                        statusMessage.textContent = "코드 압축 중!";
                        statusMessage.className = "status-message status-success";

                        // Background에 ZIP 다운로드 요청
                        chrome.runtime.sendMessage({
                            action: "PROCESS_ZIP_DOWNLOAD",
                            projectId: currentProjectId,
                            files: response.files
                        });
                    } else {
                        statusMessage.textContent = response?.error || "코드 추출 실패.";
                        statusMessage.className = "status-message status-error";
                        downloadBtn.disabled = false;
                    }
                }
            );
        });
    });
});
