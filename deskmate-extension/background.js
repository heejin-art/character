/* 아이콘 클릭 → 현재 탭의 펫 켜기/끄기 토글 */
chrome.action.onClicked.addListener((tab) => {
  if (!tab.id) return;
  chrome.tabs.sendMessage(tab.id, { type: "dm-toggle" }).catch(() => {
    // content script가 아직 없는 페이지(예: chrome:// )는 무시
  });
});
