const enabledInput = document.getElementById("enabled");

chrome.storage.sync.get({ enabled: true }, (items) => {
  enabledInput.checked = Boolean(items.enabled);
});

enabledInput.addEventListener("change", () => {
  chrome.storage.sync.set({ enabled: enabledInput.checked });
});
