chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "download-image" || !message.url) {
    return false;
  }

  chrome.downloads.download(
    {
      url: message.url,
      filename: message.filename,
      saveAs: false
    },
    (downloadId) => {
      const error = chrome.runtime.lastError;
      sendResponse({
        ok: !error,
        downloadId,
        error: error?.message
      });
    }
  );

  return true;
});
