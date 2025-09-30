chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "GET_HEADLINE") {
      chrome.tabs.sendMessage(sender.tab.id, message, sendResponse);
      return true;
    }
  });
  