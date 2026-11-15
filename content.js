const host = location.hostname;
let enabledHosts = [];
let schedule = { enabled: false, start: "20:00", end: "07:00" };

function siteEnabled() {
  return enabledHosts.includes(host);
}

function themeActive() {
  if (!siteEnabled()) return false;
  if (!schedule.enabled) return true;
  return vesperInRange(new Date(), schedule.start, schedule.end);
}

function apply() {
  document.documentElement.classList.toggle("vesper-dark", themeActive());
}

function readSettings(data) {
  enabledHosts = Array.isArray(data.enabledHosts) ? data.enabledHosts : [];
  const stored = data.schedule || {};
  schedule = {
    enabled: Boolean(stored.enabled),
    start: typeof stored.start === "string" ? stored.start : "20:00",
    end: typeof stored.end === "string" ? stored.end : "07:00",
  };
}

chrome.storage.local.get(["enabledHosts", "schedule"], (data) => {
  readSettings(data);
  apply();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;
  if (!changes.enabledHosts && !changes.schedule) return;
  chrome.storage.local.get(["enabledHosts", "schedule"], (data) => {
    readSettings(data);
    apply();
  });
});

setInterval(apply, 15000);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") apply();
});
