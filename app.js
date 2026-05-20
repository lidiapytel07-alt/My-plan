const storageKey = "ios-assistant-items-v1";
const notifiedKey = "ios-assistant-notified-v1";
const longNoteKey = "ios-assistant-long-note-v1";
const themeKey = "ios-assistant-theme-v1";

const typeLabels = {
  task: "Zadanie",
  commitment: "Zobowiązanie",
  goal: "Cel",
};

const priorityLabels = {
  high: "Wysoki",
  normal: "Normalny",
  low: "Niski",
};

const recurrenceLabels = {
  none: "",
  daily: "Codziennie",
  weekly: "Co tydzień",
  monthly: "Co miesiąc",
};

const dailyInspirations = [
  [
    { author: "Marie Curie", text: "Trzeba mieć wytrwałość i wiarę w siebie." },
    { author: "Seneka", text: "Nie dlatego nie działamy, że rzeczy są trudne." },
    { author: "Michael Jordan", text: "Zawsze zamieniaj negatywną sytuację w pozytywną." },
  ],
  [
    { author: "Maya Angelou", text: "Rób najlepiej, jak potrafisz, aż będziesz wiedzieć więcej." },
    { author: "Arystoteles", text: "Jesteśmy tym, co wielokrotnie robimy." },
    { author: "Oprah Winfrey", text: "Największa przygoda to życie według własnych marzeń." },
  ],
  [
    { author: "Kobe Bryant", text: "Wielkie rzeczy biorą się z małych kroków." },
    { author: "Amelia Earhart", text: "Najtrudniejsze jest podjęcie decyzji, reszta to wytrwałość." },
    { author: "Marek Aureliusz", text: "Masz władzę nad swoim umysłem, nie nad zdarzeniami." },
  ],
  [
    { author: "Nelson Mandela", text: "Zawsze wydaje się niemożliwe, dopóki nie zostanie zrobione." },
    { author: "Audrey Hepburn", text: "Nic nie jest niemożliwe." },
    { author: "Simone Biles", text: "Bądź dla siebie dobra i idź dalej." },
  ],
  [
    { author: "Thomas Edison", text: "Nie porażka, tylko kolejna próba." },
    { author: "Serena Williams", text: "Sukces zaczyna się od wiary w siebie." },
    { author: "Konfucjusz", text: "Nie zatrzymuj się, dopóki idziesz naprzód." },
  ],
];

const els = {
  form: document.querySelector("#itemForm"),
  formTitle: document.querySelector("#formTitle"),
  submitButton: document.querySelector("#submitButton"),
  cancelEditButton: document.querySelector("#cancelEditButton"),
  themeToggle: document.querySelector("#themeToggle"),
  themeLabel: document.querySelector("#themeLabel"),
  title: document.querySelector("#titleInput"),
  type: document.querySelector("#typeInput"),
  date: document.querySelector("#dateInput"),
  why: document.querySelector("#whyInput"),
  priority: document.querySelector("#priorityInput"),
  recurrence: document.querySelector("#recurrenceInput"),
  longTerm: document.querySelector("#longTermInput"),
  list: document.querySelector("#itemsList"),
  longGoalsList: document.querySelector("#longGoalsList"),
  empty: document.querySelector("#emptyState"),
  template: document.querySelector("#itemTemplate"),
  tabs: document.querySelectorAll(".tab"),
  currentDate: document.querySelector("#currentDate"),
  focusTitle: document.querySelector("#focusTitle"),
  focusMeta: document.querySelector("#focusMeta"),
  completeFocus: document.querySelector("#completeFocus"),
  dueTodayCount: document.querySelector("#dueTodayCount"),
  overdueCount: document.querySelector("#overdueCount"),
  goalsCount: document.querySelector("#goalsCount"),
  notifyButton: document.querySelector("#notifyButton"),
  quoteAuthors: document.querySelectorAll(".quote-author"),
  quoteTexts: document.querySelectorAll(".quote-text"),
  longNote: document.querySelector("#longNoteInput"),
};

applyTheme(localStorage.getItem(themeKey) ?? "light");

let state = {
  filter: "all",
  editingId: null,
  items: loadItems(),
  notified: loadNotified(),
};

els.currentDate.textContent = new Intl.DateTimeFormat("pl-PL", {
  weekday: "long",
  day: "numeric",
  month: "long",
}).format(new Date());

setDefaultDate();
renderDailyInspirations();
setupLongNote();
render();
registerServiceWorker();
setInterval(checkReminders, 60_000);
checkReminders();

els.themeToggle.addEventListener("click", () => {
  const nextTheme = document.body.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(nextTheme);
  localStorage.setItem(themeKey, nextTheme);
});

els.form.addEventListener("submit", (event) => {
  event.preventDefault();

  const itemData = {
    id: createId(),
    title: els.title.value.trim(),
    type: els.type.value,
    dueAt: els.date.value ? new Date(els.date.value).toISOString() : "",
    why: els.why.value.trim(),
    priority: els.priority.value,
    recurrence: els.recurrence.value,
    longTerm: els.longTerm.checked,
    done: false,
    createdAt: new Date().toISOString(),
  };

  if (!itemData.title) return;

  if (state.editingId) {
    state.items = state.items.map((item) =>
      item.id === state.editingId
        ? { ...item, ...itemData, id: item.id, createdAt: item.createdAt }
        : item,
    );
    state.editingId = null;
  } else {
    state.items = [itemData, ...state.items];
  }

  setFilter(itemData.type);
  saveItems();
  resetForm();
  render();
});

els.cancelEditButton.addEventListener("click", () => {
  state.editingId = null;
  resetForm();
  render();
});

els.tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    setFilter(tab.dataset.filter);
    render();
  });
});

els.completeFocus.addEventListener("click", () => {
  const focus = getFocusItem();
  if (!focus) return;
  completeItem(focus);
});

els.notifyButton.addEventListener("click", async () => {
  await requestNotifications();
});

async function requestNotifications() {
  if (!("Notification" in window)) {
    alert("Ta przeglądarka nie obsługuje powiadomień.");
    return false;
  }

  const permission = await Notification.requestPermission();
  if (permission === "granted") {
    await showNotification("Asystent jest gotowy", {
      body: "Przypomnę Ci o Twoim planie, gdy aplikacja będzie aktywna.",
      tag: "assistant-ready",
    });
    return true;
  }

  return false;
}

function createId() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `item-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function renderDailyInspirations() {
  const startOfYear = new Date(new Date().getFullYear(), 0, 0);
  const dayOfYear = Math.floor((Date.now() - startOfYear.getTime()) / 86_400_000);
  const inspirationSet = dailyInspirations[dayOfYear % dailyInspirations.length];

  inspirationSet.slice(0, els.quoteAuthors.length).forEach((quote, index) => {
    els.quoteAuthors[index].textContent = quote.author;
    els.quoteTexts[index].textContent = quote.text;
  });
}

function setupLongNote() {
  els.longNote.value = localStorage.getItem(longNoteKey) ?? "";
  els.longNote.addEventListener("input", () => {
    localStorage.setItem(longNoteKey, els.longNote.value);
  });
}

function applyTheme(theme) {
  document.body.dataset.theme = theme;
  els.themeLabel.textContent = theme === "dark" ? "Light" : "Dark";
}

function loadItems() {
  try {
    return JSON.parse(localStorage.getItem(storageKey)) ?? seedItems();
  } catch {
    return seedItems();
  }
}

function loadNotified() {
  try {
    return JSON.parse(localStorage.getItem(notifiedKey)) ?? {};
  } catch {
    return {};
  }
}

function saveItems() {
  localStorage.setItem(storageKey, JSON.stringify(state.items));
}

function saveNotified() {
  localStorage.setItem(notifiedKey, JSON.stringify(state.notified));
}

function seedItems() {
  return [];
}

function render() {
  const visibleItems = getVisibleItems();
  const activeItems = state.items.filter((item) => !item.done);
  const focus = getFocusItem();

  els.list.replaceChildren();
  renderLongGoals();
  els.empty.hidden = visibleItems.length > 0;

  visibleItems.forEach((item) => {
    const node = els.template.content.firstElementChild.cloneNode(true);
    node.classList.toggle("done", item.done);
    node.classList.toggle("overdue", isOverdue(item));
    node.querySelector("h3").textContent = item.title;
    node.querySelector(".type-pill").textContent = typeLabels[item.type];
    node.querySelector(".due").textContent = formatDue(item);
    node.querySelector(".priority").textContent = priorityLabels[item.priority];
    const recurrence = node.querySelector(".recurrence");
    recurrence.textContent = recurrenceLabels[item.recurrence ?? "none"];
    recurrence.hidden = !recurrence.textContent;

    const why = node.querySelector(".item-why");
    why.textContent = item.why;
    why.classList.toggle("visible", Boolean(item.why));

    node.querySelector(".check-button").addEventListener("click", () => {
      if (item.done) {
        updateItem(item.id, { done: false });
      } else {
        completeItem(item);
      }
    });

    node.querySelector(".edit-button").addEventListener("click", () => {
      startEdit(item);
    });

    node.querySelector(".delete-button").addEventListener("click", () => {
      state.items = state.items.filter((candidate) => candidate.id !== item.id);
      saveItems();
      render();
    });

    els.list.append(node);
  });

  els.dueTodayCount.textContent = activeItems.filter(isToday).length;
  els.overdueCount.textContent = activeItems.filter(isOverdue).length;
  els.goalsCount.textContent = activeItems.filter((item) => item.type === "goal").length;

  if (focus) {
    els.focusTitle.textContent = focus.title;
    els.focusMeta.textContent = `${typeLabels[focus.type]} · ${formatDue(focus)}`;
    els.completeFocus.disabled = false;
  } else {
    els.focusTitle.textContent = "Masz przestrzeń na regenerację";
    els.focusMeta.textContent = "Dodaj kolejny ruch albo wróć do swoich celów później.";
    els.completeFocus.disabled = true;
  }
}

function startEdit(item) {
  state.editingId = item.id;
  els.title.value = item.title;
  els.type.value = item.type;
  els.date.value = item.dueAt ? toLocalInputValue(new Date(item.dueAt)) : "";
  els.why.value = item.why ?? "";
  els.priority.value = item.priority ?? "normal";
  els.recurrence.value = item.recurrence ?? "none";
  els.longTerm.checked = Boolean(item.longTerm);
  els.formTitle.textContent = "Edytuj wpis";
  els.submitButton.textContent = "Zapisz zmiany";
  els.cancelEditButton.hidden = false;
  els.form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function resetForm() {
  els.form.reset();
  els.priority.value = "normal";
  els.recurrence.value = "none";
  els.longTerm.checked = false;
  els.formTitle.textContent = "Dodaj swój następny ruch";
  els.submitButton.textContent = "Dodaj do planu";
  els.cancelEditButton.hidden = true;
  setDefaultDate();
}

function getVisibleItems() {
  return sortItems(state.items).filter((item) => {
    if (state.filter === "all") return true;
    if (state.filter === "today") return isToday(item);
    return item.type === state.filter;
  });
}

function renderLongGoals() {
  const goals = sortItems(state.items).filter((item) => item.longTerm && !item.done);
  els.longGoalsList.replaceChildren();

  if (!goals.length) {
    const empty = document.createElement("p");
    empty.className = "long-goals-empty";
    empty.textContent = "Dodaj cel i zaznacz „Pokazuj jako cel długoterminowy”.";
    els.longGoalsList.append(empty);
    return;
  }

  goals.forEach((goal) => {
    const row = document.createElement("article");
    row.className = "long-goal";

    const content = document.createElement("div");

    const title = document.createElement("strong");
    title.textContent = goal.title;

    const meta = document.createElement("span");
    meta.textContent = [typeLabels[goal.type], formatDue(goal), recurrenceLabels[goal.recurrence ?? "none"]]
      .filter(Boolean)
      .join(" · ");

    content.append(title);

    if (goal.why) {
      const intention = document.createElement("p");
      intention.className = "long-goal-intention";
      intention.textContent = goal.why;
      content.append(intention);
    }

    content.append(meta);
    row.append(content);

    if (goal.recurrence && goal.recurrence !== "none" && isToday(goal)) {
      const doneToday = document.createElement("button");
      doneToday.className = "long-goal-done";
      doneToday.type = "button";
      doneToday.textContent = "Dziś zrobione";
      doneToday.addEventListener("click", () => completeItem(goal));
      row.append(doneToday);
    }

    els.longGoalsList.append(row);
  });
}

function setFilter(filter) {
  state.filter = filter;
  els.tabs.forEach((button) => button.classList.toggle("active", button.dataset.filter === filter));
}

function getFocusItem() {
  const active = state.items.filter((item) => !item.done);
  return sortItems(active)[0];
}

function sortItems(items) {
  const priorityWeight = { high: 0, normal: 1, low: 2 };
  return [...items].sort((a, b) => {
    if (a.done !== b.done) return Number(a.done) - Number(b.done);
    if (priorityWeight[a.priority] !== priorityWeight[b.priority]) {
      return priorityWeight[a.priority] - priorityWeight[b.priority];
    }
    return dueTime(a) - dueTime(b);
  });
}

function updateItem(id, patch) {
  state.items = state.items.map((item) => (item.id === id ? { ...item, ...patch } : item));
  saveItems();
  render();
}

function completeItem(item) {
  if (item.recurrence && item.recurrence !== "none") {
    state.notified[item.id] = false;
    saveNotified();
    updateItem(item.id, { dueAt: getNextDueAt(item), done: false });
    return;
  }

  updateItem(item.id, { done: true });
}

function getNextDueAt(item) {
  const next = item.dueAt ? new Date(item.dueAt) : new Date();
  const now = new Date();

  advanceRecurringDate(next, item.recurrence);

  while (next <= now) {
    advanceRecurringDate(next, item.recurrence);
    if (!["daily", "weekly", "monthly"].includes(item.recurrence)) break;
  }

  if (next <= now) next.setDate(next.getDate() + 1);
  return next.toISOString();
}

function advanceRecurringDate(date, recurrence) {
  if (recurrence === "daily") date.setDate(date.getDate() + 1);
  if (recurrence === "weekly") date.setDate(date.getDate() + 7);
  if (recurrence === "monthly") date.setMonth(date.getMonth() + 1);
}

function dueTime(item) {
  return item.dueAt ? new Date(item.dueAt).getTime() : Number.MAX_SAFE_INTEGER;
}

function isToday(item) {
  if (!item.dueAt) return false;
  const due = new Date(item.dueAt);
  const now = new Date();
  return due.getFullYear() === now.getFullYear() && due.getMonth() === now.getMonth() && due.getDate() === now.getDate();
}

function isOverdue(item) {
  return Boolean(item.dueAt && !item.done && new Date(item.dueAt).getTime() < Date.now());
}

function formatDue(item) {
  if (!item.dueAt) return "Bez terminu";
  const date = new Date(item.dueAt);
  const day = isToday(item) ? "Dziś" : new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "short" }).format(date);
  const time = new Intl.DateTimeFormat("pl-PL", { hour: "2-digit", minute: "2-digit" }).format(date);
  return `${day}, ${time}`;
}

function setDefaultDate() {
  const date = new Date();
  date.setHours(date.getHours() + 2, 0, 0, 0);
  els.date.value = toLocalInputValue(date);
}

function toLocalInputValue(date) {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return offsetDate.toISOString().slice(0, 16);
}

function checkReminders() {
  const now = Date.now();
  const windowStart = now - 60_000;
  const dueItems = state.items.filter((item) => {
    const due = dueTime(item);
    return !item.done && item.dueAt && due <= now && due >= windowStart && !state.notified[item.id];
  });

  dueItems.forEach((item) => {
    state.notified[item.id] = true;
    sendReminder(item);
  });

  if (dueItems.length) saveNotified();
}

function sendReminder(item) {
  if ("Notification" in window && Notification.permission === "granted") {
    showNotification(item.title, {
      body: `${typeLabels[item.type]} · ${formatDue(item)}`,
      tag: `assistant-${item.id}`,
    });
  } else {
    const message = `${item.title} - ${typeLabels[item.type]} (${formatDue(item)})`;
    console.info("Przypomnienie:", message);
  }
}

async function showNotification(title, options = {}) {
  const payload = {
    body: options.body ?? "",
    icon: "assets/icon-192.png",
    badge: "assets/icon-180.png",
    tag: options.tag ?? "assistant-reminder",
  };

  if ("serviceWorker" in navigator) {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, payload);
    return;
  }

  new Notification(title, payload);
}

async function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    try {
      await navigator.serviceWorker.register("service-worker.js");
    } catch (error) {
      console.info("Service worker niedostępny:", error);
    }
  }
}
