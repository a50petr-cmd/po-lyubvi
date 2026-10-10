let content = null;

const fields = {
  "yclients-id": (data, value) => {
    data.yclientsId = value;
  },
  "salon-city": (data, value) => {
    data.salon.city = value;
  },
  "salon-street": (data, value) => {
    data.salon.street = value;
  },
  "salon-phone": (data, value) => {
    data.salon.phone = value;
  },
  "salon-hours": (data, value) => {
    data.salon.hours = value;
  },
  "salon-email": (data, value) => {
    data.salon.email = value;
  },
  "salon-telegram": (data, value) => {
    data.salon.telegram = value;
  },
  "salon-whatsapp": (data, value) => {
    data.salon.whatsapp = value;
  },
  "salon-site": (data, value) => {
    data.salon.site = value;
  },
  "salon-site-label": (data, value) => {
    data.salon.siteLabel = value;
  },
  "note-rating": (data, value) => {
    data.notes.rating = value;
  },
  "note-reviews": (data, value) => {
    data.notes.reviewsLabel = value;
  },
  "note-way": (data, value) => {
    data.notes.way = value;
  },
  "note-place": (data, value) => {
    data.notes.place = value;
  },
  "note-route": (data, value) => {
    data.notes.route = value;
  },
  "offer-title": (data, value) => {
    data.offer.title = value;
  },
  "offer-text": (data, value) => {
    data.offer.text = value;
  },
  standards: (data, value) => {
    data.standards = value;
  },
  "price-note": (data, value) => {
    data.priceNote = value;
  },
  "price-source": (data, value) => {
    data.priceSource = value;
  },
  "consult-title": (data, value) => {
    data.consult.title = value;
  },
  "consult-text": (data, value) => {
    data.consult.text = value;
  },
  "month-label": (data, value) => {
    data.colorOfMonth.month = value;
  },
  "month-color-name": (data, value) => {
    data.colorOfMonth.name = value;
  },
  "month-hex": (data, value) => {
    data.colorOfMonth.hex = value;
  },
  "month-text": (data, value) => {
    data.colorOfMonth.text = value;
  },
};

function val(id) {
  return document.querySelector(`#${id}`).value.trim();
}

function fill(id, value) {
  const node = document.querySelector(`#${id}`);
  if (node) node.value = value || "";
}

function status(id, text) {
  const node = document.querySelector(id);
  if (node) node.textContent = text;
}

function setSaveStatus(text) {
  status("#save-status", text);
  status("#save-status-bottom", text);
}

async function api(url, options = {}) {
  const response = await fetch(url, {
    credentials: "same-origin",
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Не получилось.");
  return data;
}

function fillForm() {
  const salon = content.salon;
  const notes = content.notes;
  fill("yclients-id", content.yclientsId);
  fill("salon-city", salon.city);
  fill("salon-street", salon.street);
  fill("salon-phone", salon.phone);
  fill("salon-hours", salon.hours);
  fill("salon-email", salon.email);
  fill("salon-telegram", salon.telegram);
  fill("salon-whatsapp", salon.whatsapp);
  fill("salon-site", salon.site);
  fill("salon-site-label", salon.siteLabel);
  fill("note-rating", notes.rating);
  fill("note-reviews", notes.reviewsLabel);
  fill("note-way", notes.way);
  fill("note-place", notes.place);
  fill("note-route", notes.route);
  fill("offer-title", content.offer.title);
  fill("offer-text", content.offer.text);
  fill("standards", content.standards);
  fill("price-note", content.priceNote);
  fill("price-source", content.priceSource);
  fill("consult-title", content.consult.title);
  fill("consult-text", content.consult.text);
  fill("month-label", content.colorOfMonth.month);
  fill("month-color-name", content.colorOfMonth.name);
  fill("month-hex", /^#[0-9A-Fa-f]{6}$/.test(content.colorOfMonth.hex || "") ? content.colorOfMonth.hex : "#6B705C");
  fill("month-text", content.colorOfMonth.text);
  renderPageTexts();
  renderPriceEditor();
  renderPhotoEditor();
}

function renderPageTexts() {
  const root = document.querySelector("#page-texts");
  root.replaceChildren();
  Object.entries(content.pages || {}).forEach(([key, page]) => {
    const box = document.createElement("div");
    box.dataset.pageKey = key;
    const titleField = document.createElement("div");
    titleField.className = "field";
    const titleLabel = document.createElement("label");
    titleLabel.textContent = `Заголовок страницы «${page.title || key}»`;
    const titleInput = document.createElement("input");
    titleInput.className = "page-title";
    titleInput.type = "text";
    titleInput.value = page.title || "";
    titleField.append(titleLabel, titleInput);
    const leadField = document.createElement("div");
    leadField.className = "field";
    const leadLabel = document.createElement("label");
    leadLabel.textContent = "Текст страницы";
    const leadInput = document.createElement("textarea");
    leadInput.className = "page-lead";
    leadInput.rows = 3;
    leadInput.value = page.lead || "";
    leadField.append(leadLabel, leadInput);
    box.append(titleField, leadField);
    root.append(box);
  });
}

function priceRow(item) {
  const row = document.createElement("div");
  row.className = "price-row";
  const name = document.createElement("input");
  name.className = "item-name";
  name.type = "text";
  name.value = item?.name || "";
  name.placeholder = "Услуга";
  name.setAttribute("aria-label", "Услуга");
  const price = document.createElement("input");
  price.className = "item-price";
  price.type = "text";
  price.value = item?.price || "";
  price.placeholder = "Цена";
  price.setAttribute("aria-label", "Цена");
  const remove = document.createElement("button");
  remove.className = "button quiet small";
  remove.type = "button";
  remove.textContent = "Убрать";
  remove.addEventListener("click", () => row.remove());
  row.append(name, price, remove);
  return row;
}

function renderPriceEditor() {
  const root = document.querySelector("#price-editor");
  root.replaceChildren();
  (content.priceGroups || []).forEach((group) => {
    const box = document.createElement("div");
    box.className = "price-edit";
    box.dataset.id = group.id || "";
    const title = document.createElement("input");
    title.className = "group-title";
    title.type = "text";
    title.value = group.title || "";
    title.setAttribute("aria-label", "Название раздела");
    const note = document.createElement("input");
    note.className = "group-note";
    note.type = "text";
    note.value = group.note || "";
    note.placeholder = "Пометка, если нужна";
    note.setAttribute("aria-label", "Пометка раздела");
    const openLabel = document.createElement("label");
    const open = document.createElement("input");
    open.className = "group-open";
    open.type = "checkbox";
    open.checked = Boolean(group.open);
    openLabel.append(open, document.createTextNode(" Открыт в общем прайсе"));
    const rows = document.createElement("div");
    rows.className = "group-rows";
    (group.items || []).forEach((item) => rows.append(priceRow(item)));
    const add = document.createElement("button");
    add.className = "button quiet small";
    add.type = "button";
    add.textContent = "Добавить строку";
    add.addEventListener("click", () => rows.append(priceRow()));
    const removeGroup = document.createElement("button");
    removeGroup.className = "button quiet small";
    removeGroup.type = "button";
    removeGroup.textContent = "Удалить раздел";
    removeGroup.addEventListener("click", () => {
      if (removeGroup.dataset.armed !== "1") {
        removeGroup.dataset.armed = "1";
        removeGroup.textContent = "Точно удалить раздел";
        return;
      }
      box.remove();
    });
    box.append(title, note, openLabel, rows, add, removeGroup);
    root.append(box);
  });
}

function readPrices() {
  const groups = [];
  document.querySelectorAll("#price-editor .price-edit").forEach((box) => {
    const items = [];
    box.querySelectorAll(".price-row").forEach((row) => {
      const name = row.querySelector(".item-name").value.trim();
      const price = row.querySelector(".item-price").value.trim();
      if (name) items.push({ name, price });
    });
    groups.push({
      id: box.dataset.id,
      title: box.querySelector(".group-title").value.trim() || "Раздел",
      note: box.querySelector(".group-note").value.trim(),
      open: box.querySelector(".group-open").checked,
      items,
    });
  });
  content.priceGroups = groups;
}

function readPages() {
  document.querySelectorAll("[data-page-key]").forEach((box) => {
    const page = content.pages[box.dataset.pageKey];
    if (!page) return;
    page.title = box.querySelector(".page-title").value.trim();
    page.lead = box.querySelector(".page-lead").value.trim();
  });
}

function readForm() {
  Object.entries(fields).forEach(([id, apply]) => apply(content, val(id)));
  readPages();
  readPrices();
  readHidden();
}

function readHidden() {
  const hidden = [];
  document.querySelectorAll("#photo-editor input[type=checkbox]").forEach((box) => {
    if (box.checked) hidden.push(box.value);
  });
  content.hiddenPhotos = hidden;
}

function renderPhotoEditor() {
  const root = document.querySelector("#photo-editor");
  root.replaceChildren();
  const hidden = new Set(content.hiddenPhotos || []);
  (content.photos || []).forEach((src) => {
    const figure = document.createElement("figure");
    const image = document.createElement("img");
    image.src = src;
    image.alt = "";
    const label = document.createElement("label");
    const box = document.createElement("input");
    box.type = "checkbox";
    box.value = src;
    box.checked = hidden.has(src);
    label.append(box, document.createTextNode("Скрыть"));
    const remove = document.createElement("button");
    remove.className = "button quiet small";
    remove.type = "button";
    remove.textContent = "Удалить";
    remove.addEventListener("click", () => deletePhoto(src, remove));
    figure.append(image, label, remove);
    root.append(figure);
  });
}

async function deletePhoto(name, button) {
  if (button.dataset.armed !== "1") {
    button.dataset.armed = "1";
    button.textContent = "Точно удалить";
    return;
  }
  readHidden();
  try {
    const data = await api("/api/photos/delete", { method: "POST", body: JSON.stringify({ name }) });
    content.photos = data.photos;
    content.hiddenPhotos = (content.hiddenPhotos || []).filter((item) => item !== name);
    renderPhotoEditor();
    status("#upload-status", "Фото удалено.");
  } catch (error) {
    status("#upload-status", error.message);
  }
}

async function uploadPhoto(file) {
  status("#upload-status", "Загружаю…");
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  }
  readHidden();
  const data = await api("/api/upload", {
    method: "POST",
    body: JSON.stringify({ data: btoa(binary) }),
  });
  content.photos = data.photos;
  renderPhotoEditor();
  status("#upload-status", "Фото добавлено.");
}

async function save() {
  readForm();
  setSaveStatus("Сохраняю…");
  try {
    await api("/api/content", { method: "POST", body: JSON.stringify(content) });
    setSaveStatus("Сохранено.");
  } catch (error) {
    setSaveStatus(error.message);
  }
}

function renderRequests(items) {
  const root = document.querySelector("#request-list");
  root.replaceChildren();
  if (!items.length) {
    const empty = document.createElement("p");
    empty.textContent = "Заявок с сайта пока нет.";
    root.append(empty);
    return;
  }
  items.slice().reverse().forEach((item) => {
    const box = document.createElement("article");
    box.className = "request";
    const head = document.createElement("p");
    const strong = document.createElement("strong");
    strong.textContent = `${item.name}, ${item.phone}`;
    head.append(strong, document.createTextNode(item.at ? `, ${item.at}` : ""));
    const wish = document.createElement("p");
    wish.textContent = item.wish || "Без комментария";
    const remove = document.createElement("button");
    remove.className = "button quiet small";
    remove.type = "button";
    remove.textContent = "Удалить заявку";
    remove.addEventListener("click", async () => {
      try {
        await api(`/api/requests/${item.id}`, { method: "DELETE" });
        await loadRequests();
      } catch (error) {
        setSaveStatus(error.message);
      }
    });
    box.append(head, wish, remove);
    root.append(box);
  });
}

async function loadRequests() {
  const data = await api("/api/requests");
  renderRequests(data.requests || []);
}

async function enter() {
  const response = await fetch("content.json", { cache: "no-store" });
  if (!response.ok) throw new Error("Не удалось прочитать содержание сайта.");
  content = await response.json();
  document.querySelector("#login-form").hidden = true;
  document.querySelector("#desk").hidden = false;
  fillForm();
  await loadRequests();
}

document.querySelector("#login-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  status("#login-status", "");
  try {
    await api("/api/login", {
      method: "POST",
      body: JSON.stringify({ password: document.querySelector("#password").value }),
    });
    await enter();
  } catch (error) {
    status("#login-status", error.message);
  }
});

document.querySelector("#logout").addEventListener("click", async () => {
  await api("/api/logout", { method: "POST", body: "{}" });
  location.reload();
});

document.querySelector("#save").addEventListener("click", save);
document.querySelector("#save-bottom").addEventListener("click", save);
document.querySelector("#add-group").addEventListener("click", () => {
  readPrices();
  content.priceGroups.push({
    id: `group-${Date.now()}`,
    title: "Новый раздел",
    note: "",
    open: true,
    items: [],
  });
  renderPriceEditor();
});

document.querySelector("#photo-file").addEventListener("change", async (event) => {
  const file = event.target.files && event.target.files[0];
  event.target.value = "";
  if (!file) return;
  try {
    await uploadPhoto(file);
  } catch (error) {
    status("#upload-status", error.message);
  }
});

document.querySelector("#reload-requests").addEventListener("click", async () => {
  try {
    await loadRequests();
  } catch (error) {
    setSaveStatus(error.message);
  }
});

document.querySelector("#password-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const next = document.querySelector("#next-password").value;
  const repeat = document.querySelector("#repeat-password").value;
  if (next.length < 8) {
    status("#password-status", "Новый пароль — не короче 8 знаков.");
    return;
  }
  if (next !== repeat) {
    status("#password-status", "Новый пароль повторён иначе.");
    return;
  }
  try {
    await api("/api/password", {
      method: "POST",
      body: JSON.stringify({
        current: document.querySelector("#current-password").value,
        next,
      }),
    });
    document.querySelector("#password-form").reset();
    status("#password-status", "Пароль сменён.");
  } catch (error) {
    status("#password-status", error.message);
  }
});

fetch("/api/session")
  .then((response) => response.json())
  .then((data) => {
    if (data.ok) return enter();
    return null;
  })
  .catch(() => {
    status("#login-status", "Админка отвечает только если сайт открыт через python server.py.");
  });
