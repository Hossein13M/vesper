const DEFAULT_SCHEDULE = { enabled: false, start: "20:00", end: "07:00" };

const versionEl = document.getElementById("version");
const hostEl = document.getElementById("host");
const detailEl = document.getElementById("detail");
const siteRow = document.getElementById("site-row");
const siteToggle = document.getElementById("site-toggle");
const scheduleToggle = document.getElementById("schedule-toggle");
const hoursEl = document.getElementById("hours");
const startInput = document.getElementById("start");
const endInput = document.getElementById("end");
const scheduleNote = document.getElementById("schedule-note");

const manifestVersion = globalThis.chrome?.runtime?.getManifest?.().version || "1.0.0";
versionEl.textContent = manifestVersion;

function siteHost(url) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.hostname;
  } catch {
    return null;
  }
}

function normalizeSchedule(stored) {
  const schedule = { ...DEFAULT_SCHEDULE, ...(stored || {}) };
  if (!/^\d{2}:\d{2}$/.test(schedule.start)) schedule.start = DEFAULT_SCHEDULE.start;
  if (!/^\d{2}:\d{2}$/.test(schedule.end)) schedule.end = DEFAULT_SCHEDULE.end;
  schedule.enabled = Boolean(schedule.enabled);
  return schedule;
}

function setSwitch(button, on) {
  button.setAttribute("aria-checked", on ? "true" : "false");
}

function describeSite(host, enabled, schedule) {
  if (!enabled) {
    return schedule.enabled
      ? "Off for this site. The hours apply after you turn it on."
      : "Off for this site.";
  }
  if (!schedule.enabled) return "On for this site.";
  if (schedule.start === schedule.end) return "On for this site all day.";
  const active = vesperInRange(new Date(), schedule.start, schedule.end);
  return active
    ? `On now. Turns off at ${schedule.end}.`
    : `Saved for this site. Off until ${schedule.start}.`;
}

function describeSchedule(schedule) {
  if (!schedule.enabled) return "Dark theme follows the site switch all day.";
  if (schedule.start === schedule.end) return "Start and end match, so the range covers the whole day.";
  if (schedule.start > schedule.end) return "This range continues past midnight.";
  return "Dark theme runs only inside this range.";
}

async function init() {
  const hasChrome = Boolean(globalThis.chrome?.storage?.local && globalThis.chrome?.tabs);
  const preview = hasChrome
    ? null
    : {
        host: "github.com",
        enabledHosts: [],
        schedule: { ...DEFAULT_SCHEDULE },
      };

  const [tab] = hasChrome
    ? await chrome.tabs.query({ active: true, currentWindow: true })
    : [null];
  const host = preview ? preview.host : siteHost(tab?.url || "");

  if (!host) {
    hostEl.textContent = "This page can't be themed";
    detailEl.textContent = "Vesper runs on http and https sites.";
    siteRow.hidden = true;
  } else {
    hostEl.textContent = host;
  }

  const stored = hasChrome
    ? await chrome.storage.local.get(["enabledHosts", "schedule"])
    : preview;
  let enabledHosts = Array.isArray(stored.enabledHosts) ? stored.enabledHosts : [];
  let schedule = normalizeSchedule(stored.schedule);
  let enabled = host ? enabledHosts.includes(host) : false;

  function render() {
    if (host) {
      detailEl.textContent = describeSite(host, enabled, schedule);
      setSwitch(siteToggle, enabled);
    }
    setSwitch(scheduleToggle, schedule.enabled);
    startInput.value = schedule.start;
    endInput.value = schedule.end;
    startInput.disabled = !schedule.enabled;
    endInput.disabled = !schedule.enabled;
    hoursEl.classList.toggle("is-off", !schedule.enabled);
    scheduleNote.textContent = describeSchedule(schedule);
  }

  async function persist(partial) {
    if (partial.hosts) enabledHosts = partial.hosts;
    if (partial.schedule) schedule = partial.schedule;
    if (hasChrome) {
      await chrome.storage.local.set({
        enabledHosts,
        schedule,
      });
    }
    render();
  }

  siteToggle.addEventListener("click", () => {
    if (!host) return;
    const hosts = new Set(enabledHosts);
    enabled = !enabled;
    if (enabled) hosts.add(host);
    else hosts.delete(host);
    persist({ hosts: [...hosts] });
  });

  scheduleToggle.addEventListener("click", () => {
    schedule = { ...schedule, enabled: !schedule.enabled };
    persist({ schedule });
  });

  function saveHours() {
    schedule = {
      ...schedule,
      start: startInput.value || DEFAULT_SCHEDULE.start,
      end: endInput.value || DEFAULT_SCHEDULE.end,
    };
    persist({ schedule });
  }

  startInput.addEventListener("change", saveHours);
  endInput.addEventListener("change", saveHours);

  render();
}

init();
