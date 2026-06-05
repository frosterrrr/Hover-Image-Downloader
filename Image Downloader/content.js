const STATE_KEY = "enabled";
const MIN_IMAGE_SIZE = 24;

let enabled = true;
let activeImage = null;
let hideTimer = 0;

const button = document.createElement("button");
button.className = "hid-download-button";
button.type = "button";
button.title = "Download image";
button.setAttribute("aria-label", "Download image");
button.textContent = "\u2b07";
document.documentElement.appendChild(button);

chrome.storage.sync.get({ [STATE_KEY]: true }, (items) => {
  enabled = Boolean(items[STATE_KEY]);
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "sync" || !changes[STATE_KEY]) {
    return;
  }

  enabled = Boolean(changes[STATE_KEY].newValue);
  if (!enabled) {
    hideButton();
  }
});

document.addEventListener(
  "mouseover",
  (event) => {
    if (!enabled) {
      return;
    }

    const image = findImage(event.target);
    if (!image || !isDownloadableImage(image)) {
      return;
    }

    activeImage = image;
    positionButton(image);
    showButton();
  },
  true
);

document.addEventListener(
  "mouseout",
  (event) => {
    const image = findImage(event.target);
    if (!image || image !== activeImage) {
      return;
    }

    const related = event.relatedTarget;
    if (related === button || button.contains(related)) {
      return;
    }

    scheduleHide();
  },
  true
);

document.addEventListener(
  "scroll",
  () => {
    if (activeImage && button.style.display === "flex") {
      positionButton(activeImage);
    }
  },
  true
);

window.addEventListener("resize", () => {
  if (activeImage && button.style.display === "flex") {
    positionButton(activeImage);
  }
});

button.addEventListener("mouseenter", () => {
  clearTimeout(hideTimer);
});

button.addEventListener("mouseleave", scheduleHide);

button.addEventListener("click", async (event) => {
  event.preventDefault();
  event.stopPropagation();

  if (!activeImage) {
    return;
  }

  const url = getImageUrl(activeImage);
  if (!url) {
    return;
  }

  button.disabled = true;
  chrome.runtime.sendMessage(
    {
      type: "download-image",
      url,
      filename: buildFilename(url)
    },
    () => {
      button.disabled = false;
    }
  );
});

function findImage(target) {
  if (!(target instanceof Element)) {
    return null;
  }

  return target.closest("img");
}

function isDownloadableImage(image) {
  const rect = image.getBoundingClientRect();
  return rect.width >= MIN_IMAGE_SIZE && rect.height >= MIN_IMAGE_SIZE && Boolean(getImageUrl(image));
}

function getImageUrl(image) {
  const url = image.currentSrc || image.src;
  if (!url || url.startsWith("data:") || url.startsWith("blob:")) {
    return "";
  }

  return url;
}

function positionButton(image) {
  const rect = image.getBoundingClientRect();
  const margin = 8;
  const size = 34;
  const left = Math.min(window.innerWidth - size - margin, Math.max(margin, rect.right - size - margin));
  const top = Math.min(window.innerHeight - size - margin, Math.max(margin, rect.top + margin));

  button.style.left = `${left}px`;
  button.style.top = `${top}px`;
}

function showButton() {
  clearTimeout(hideTimer);
  button.style.display = "flex";
}

function scheduleHide() {
  clearTimeout(hideTimer);
  hideTimer = window.setTimeout(hideButton, 140);
}

function hideButton() {
  clearTimeout(hideTimer);
  activeImage = null;
  button.style.display = "none";
  button.disabled = false;
}

function buildFilename(url) {
  try {
    const parsed = new URL(url);
    const pathname = decodeURIComponent(parsed.pathname);
    const name = pathname.split("/").filter(Boolean).pop();

    if (name && /\.[a-z0-9]{2,5}$/i.test(name)) {
      return `hover-image-downloader/${sanitizeFilename(name)}`;
    }
  } catch {
    // Fall back to a timestamped name below.
  }

  return `hover-image-downloader/image-${Date.now()}.jpg`;
}

function sanitizeFilename(filename) {
  return filename.replace(/[\\/:*?"<>|]+/g, "_").slice(0, 160);
}
