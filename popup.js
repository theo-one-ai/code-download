document.addEventListener("DOMContentLoaded", () => {
    lucide.createIcons();

    const projectIdText = document.getElementById("project-id-text");
    const statusMessage = document.getElementById("status-message");
    const downloadBtn = document.getElementById("download-btn");
    const projectInfo = document.getElementById("project-info");
    const progressSection = document.getElementById("progress-section");
    const progressText = document.getElementById("progress-text");

    let currentProjectId = null;

    // 활성 탭 쿼리
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];

        if (activeTab.url && activeTab.url.includes("lovable.dev/projects/")) {
            // 프로젝트 ID 파싱
            const urlParts = new URL(activeTab.url).pathname.split("/");
            currentProjectId = urlParts[2]; // /projects/UUID

            if (currentProjectId) {
                projectInfo.classList.remove("hidden");
                projectIdText.textContent = `Project: ${currentProjectId.slice(0, 8)}...`;
                statusMessage.textContent = "Lovable 프로젝트가 감지되었습니다.";
                statusMessage.className = "status-message status-success";
                downloadBtn.disabled = false;
            } else {
                statusMessage.textContent = "프로젝트 ID를 찾을 수 없습니다.";
                statusMessage.className = "status-message status-error";
            }
        } else {
            statusMessage.textContent = "Lovable 에디터 페이지에서 실행해주세요.";
            statusMessage.className = "status-message status-error";
        }
    });

    downloadBtn.addEventListener("click", () => {
        downloadBtn.disabled = true;
        progressSection.classList.remove("hidden");
        statusMessage.textContent = "초고속으로 코드를 추출하고 있습니다...";
        statusMessage.className = "status-message";

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            // Content script 로 메시지 전송
            chrome.tabs.sendMessage(
                tabs[0].id,
                { action: "EXTRACT_AND_DOWNLOAD", projectId: currentProjectId },
                (response) => {
                    progressSection.classList.add("hidden");

                    if (chrome.runtime.lastError) {
                        statusMessage.textContent = "오류: 새로고침 후 다시 시도해주세요.";
                        statusMessage.className = "status-message status-error";
                        downloadBtn.disabled = false;
                        return;
                    }

                    if (response && response.success) {
                        statusMessage.textContent = "가져온 코드들을 압축 중입니다!";
                        statusMessage.className = "status-message status-success";

                        // Background script 를 통해 ZIP 다운로드 실행
                        chrome.runtime.sendMessage({
                            action: "PROCESS_ZIP_DOWNLOAD",
                            projectId: currentProjectId,
                            files: response.files
                        });
                    } else {
                        statusMessage.textContent = response?.error || "코드 추출에 실패했습니다.";
                        statusMessage.className = "status-message status-error";
                        downloadBtn.disabled = false;
                    }
                }
            );
        });
    });
});
