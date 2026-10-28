const YM_ID = null; // TODO: номер счётчика Метрики

function initMetrika() {
  if (!YM_ID) return;
  window.ym =
    window.ym ||
    function () {
      (window.ym.a = window.ym.a || []).push(arguments);
    };
  window.ym.l = Date.now();
  const script = document.createElement("script");
  script.async = true;
  script.src = "https://mc.yandex.ru/metrika/tag.js";
  document.head.append(script);
  window.ym(YM_ID, "init", {
    clickmap: true,
    trackLinks: true,
    accurateTrackBounce: true,
    webvisor: true,
  });
}

function goal(name) {
  if (YM_ID && typeof window.ym === "function") {
    window.ym(YM_ID, "reachGoal", name);
    return;
  }
  console.debug(`goal: ${name}`);
}

function mountGoals() {
  document.addEventListener("click", (event) => {
    const book = event.target.closest("[data-book]");
    if (book) goal("booking_open");

    const link = event.target.closest("a[href]");
    if (!link) return;
    const href = link.getAttribute("href") || "";
    if (href.startsWith("tel:")) goal("call");
    if (href.includes("wa.me")) goal("whatsapp");
    if (href.includes("t.me")) goal("telegram");
    if (link.matches("[data-route]") || link.closest("[data-route]")) goal("route");
  });

  document.addEventListener("toggle", (event) => {
    const details = event.target;
    if (!(details instanceof HTMLDetailsElement) || !details.open) return;
    if (details.closest(".service-catalog") || details.closest("#price-list") || details.classList.contains("service-catalog-group")) {
      goal("price_open");
    }
  }, true);
}

initMetrika();
mountGoals();

const zodiac = [
  { sign: "Овен", name: "Тёплый коралл", hex: "#C47A6A", line: "Заметный, но не кричащий." },
  { sign: "Телец", name: "Шампань", hex: "#C6B59A", line: "Тёплый свет, близкий к коже." },
  { sign: "Близнецы", name: "Холодный серый", hex: "#A7A7A4", line: "Ровный тон без лишнего блеска." },
  { sign: "Рак", name: "Молоко", hex: "#E4D9CC", line: "Почти нюд, мягкий на короткой длине." },
  { sign: "Лев", name: "Чернила", hex: "#2C2C2C", line: "Плотный тёмный, если хочется контраста." },
  { sign: "Дева", name: "Олива", hex: "#8A8F78", line: "Приглушённый зелёный, не кислотный." },
  { sign: "Весы", name: "Пыльная роза", hex: "#C7A9A4", line: "Тихий розовый к бежевому." },
  { sign: "Скорпион", name: "Вино", hex: "#7A4450", line: "Глубокий, лучше на коротком ногте." },
  { sign: "Стрелец", name: "Карамель", hex: "#A67C62", line: "Тёплый коричневый без рыжины." },
  { sign: "Козерог", name: "Графит", hex: "#5E5A55", line: "Серый, который выглядит собранно." },
  { sign: "Водолей", name: "Сталь", hex: "#8E9AA0", line: "Холодный серо-голубой." },
  { sign: "Рыбы", name: "Пыльная сирень", hex: "#B7A8B8", line: "Мягкий фиолетовый, почти серый." },
];

function safeHex(value) {
  return /^#[0-9A-Fa-f]{6}$/.test(value || "") ? value : "#6B705C";
}

function yclientsId(value) {
  const text = String(value || "").trim();
  const marked = text.match(/[nw](\d{4,12})/i);
  if (marked) return marked[1];
  return /^\d{4,12}$/.test(text) ? text : "";
}

function setText(selector, value) {
  const node = document.querySelector(selector);
  if (node && value != null) node.textContent = value;
}

function telHref(phone) {
  return `tel:${String(phone).replace(/[^\d+]/g, "")}`;
}

function telegramHref(handle) {
  const name = String(handle || "").replace(/^@/, "").trim();
  return name ? `https://t.me/${encodeURIComponent(name)}` : "";
}

function applyTexts(content) {
  setText("#offer-title", content.offer?.title);
  setText("#offer-text", content.offer?.text);
  setText("#standards", content.standards);
  setText("#price-note", content.priceNote);
  const source = document.querySelector("#price-source");
  if (source) {
    const sourceText = String(content.priceSource || "").trim();
    source.textContent = sourceText;
    source.hidden = !sourceText;
  }
  setText("#consult-title", content.consult?.title);
  setText("#consult-text", content.consult?.text);

  const heading = document.querySelector("[data-title]");
  if (heading && content.pages) {
    const page = content.pages[heading.dataset.title];
    if (page?.title) {
      heading.textContent = page.title;
      document.title = `${page.title} — По любви`;
    }
  }

  document.querySelectorAll("[data-lead], [data-home-lead]").forEach((node) => {
    const key = node.dataset.lead || node.dataset.homeLead;
    const page = content.pages?.[key];
    if (page?.lead) node.textContent = page.lead;
  });
}

function applySalon(content) {
  const salon = content.salon || {};
  const notes = content.notes || {};
  const homeAddress = document.querySelector("#home-address");
  if (homeAddress && salon.city && salon.street) {
    homeAddress.textContent = `${salon.city}, ${salon.street}. ${salon.hours || ""}`.trim();
  }

  const homePhone = document.querySelector("#home-phone");
  if (homePhone && salon.phone) {
    homePhone.textContent = salon.phone;
    homePhone.href = telHref(salon.phone);
  }

  setText("#city-line", salon.city);
  setText("#street-line", salon.street);
  setText("#hours-line", salon.hours);

  const phoneLink = document.querySelector("#phone-link");
  if (phoneLink && salon.phone) {
    phoneLink.hidden = false;
    phoneLink.textContent = salon.phone;
    phoneLink.href = telHref(salon.phone);
    const phoneLine = document.querySelector("#phone-line");
    if (phoneLine) phoneLine.hidden = false;
  }

  const tg = telegramHref(salon.telegram);
  linkLine("#telegram-line", "#telegram-link", tg, tg ? `Telegram @${salon.telegram.replace(/^@/, "")}` : "");
  linkLine("#wa-line", "#wa-link", salon.whatsapp || "", salon.whatsapp ? "WhatsApp" : "");
  linkLine("#site-line", "#site-link", salon.site || "", salon.siteLabel || salon.site || "");

  const rating = document.querySelector("#rating-line");
  const reviews = document.querySelector("#reviews-link");
  if (rating && reviews) {
    rating.replaceChildren(document.createTextNode(`${notes.rating || ""} `), reviews);
    if (notes.reviewsLabel) reviews.textContent = notes.reviewsLabel;
    if (salon.reviews) reviews.href = salon.reviews;
  }

  const yandex = document.querySelector("#yandex-place");
  if (yandex) {
    setText("#yandex-score", notes.ratingScore);
    setText("#yandex-award", notes.award);
    setText("#yandex-year", notes.awardYear);
    const meta = ["Яндекс Карты", notes.ratingCount, notes.reviewsLabel].filter(Boolean).join(" · ");
    setText("#yandex-meta", meta);
    if (salon.reviews) yandex.href = salon.reviews;
  }

  setText("#way-line", notes.way);
  setText("#place-notes", notes.place);
  setText("#route-note", notes.route);

  if (salon.lat && salon.lon) {
    const href = `https://yandex.ru/maps/?rtext=~${salon.lat},${salon.lon}&rtt=auto`;
    document.querySelectorAll("[data-route]").forEach((link) => {
      link.href = href;
    });
  }
}

function mountTelegram(content) {
  if (document.querySelector(".tg-float")) return;
  const href = telegramHref(content.salon?.telegram);
  if (!href) return;
  const link = document.createElement("a");
  link.className = "tg-float";
  link.href = href;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.setAttribute("aria-label", "Написать в Telegram");
  link.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M2.4 11.6 21 3.4c.7-.3 1.4.4 1.1 1.1l-3.4 14.2c-.2.9-1.3 1.2-2 .6l-4.2-3.6-2.3 2.2c-.4.4-1 .2-1.1-.4l.3-3.8 8-6.4-9.9 5.5-3.7-1.5c-.8-.3-.8-1.4.1-1.7Z"/></svg>';
  document.body.append(link);
}

function linkLine(lineSelector, linkSelector, href, label) {
  const line = document.querySelector(lineSelector);
  const link = document.querySelector(linkSelector);
  if (!line || !link) return;
  if (!href || !label) {
    line.hidden = true;
    return;
  }
  line.hidden = false;
  link.href = href;
  link.textContent = label;
}

function bookingHref(content) {
  const id = yclientsId(content.yclientsId);
  return id ? `https://n${id}.yclients.ru` : "";
}

function mountBooking(content) {
  const id = yclientsId(content.yclientsId);
  const href = bookingHref(content);
  document.querySelectorAll("[data-book]").forEach((link) => {
    if (href) {
      link.href = href;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    } else if (link.dataset.wish) {
      link.href = `contacts.html?wish=${encodeURIComponent(link.dataset.wish)}`;
      link.removeAttribute("target");
      link.removeAttribute("rel");
    } else {
      link.href = "contacts.html#booking";
      link.removeAttribute("target");
      link.removeAttribute("rel");
    }
  });
  document.querySelectorAll("[data-extra-wish]").forEach((link) => {
    link.hidden = !id;
  });
  const onlineWrap = document.querySelector("#online-book-wrap");
  if (onlineWrap) onlineWrap.hidden = !id;
  const note = document.querySelector("#booking-note");
  if (note) {
    note.hidden = !id;
    if (id) {
      note.textContent = "Кнопка «Записаться» открывает онлайн-запись. Заявку администратору можно отправить во всплывающем окне.";
    }
  }
}

const HOME_SERVICE_FILTERS = [
  { id: "all", label: "Все услуги" },
  { id: "nails", label: "Ногти" },
  { id: "gaze", label: "Брови и ресницы" },
  { id: "cosmetology", label: "Косметология" },
  { id: "massage", label: "Массаж" },
];

const HOME_GROUP_FILTER = {
  manicure: "nails",
  pedicure: "nails",
  gaze: "gaze",
  face: "cosmetology",
  peels: "cosmetology",
  cleansing: "cosmetology",
  hardware: "cosmetology",
  wax: "cosmetology",
  massage: "massage",
};

function servicePageForGroup(id) {
  const map = {
    manicure: "manikyur.html",
    pedicure: "pedikyur.html",
    gaze: "vzglyad.html",
    massage: "massazh.html",
  };
  if (map[id]) return map[id];
  if (["face", "peels", "cleansing", "hardware", "wax"].includes(id)) return "estetika.html";
  return "contacts.html";
}

function renderHomeServices(content) {
  const root = document.querySelector(".service-catalog");
  if (!root) return;
  const filters = root.querySelector(".service-catalog-filters");
  const groupsRoot = root.querySelector(".service-catalog-groups");
  if (!filters || !groupsRoot) return;

  let activeFilter = "all";
  const priceGroups = content.priceGroups || [];

  function paintFilters() {
    filters.replaceChildren();
    HOME_SERVICE_FILTERS.forEach((filter) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "service-filter";
      button.textContent = filter.label;
      button.setAttribute("aria-pressed", filter.id === activeFilter ? "true" : "false");
      button.addEventListener("click", () => {
        activeFilter = filter.id;
        paintFilters();
        paintGroups();
      });
      filters.append(button);
    });
  }

  function paintGroups() {
    groupsRoot.replaceChildren();
    priceGroups.forEach((group) => {
      const tag = HOME_GROUP_FILTER[group.id];
      if (!tag) return;
      if (activeFilter !== "all" && activeFilter !== tag) return;

      const details = document.createElement("details");
      details.className = "service-catalog-group";

      const summary = document.createElement("summary");
      summary.className = "service-pill";
      summary.textContent = group.title;
      details.append(summary);

      if (group.note) {
        const note = document.createElement("p");
        note.className = "service-catalog-note";
        note.textContent = group.note;
        details.append(note);
      }

      const list = document.createElement("div");
      list.className = "service-price-rows";
      (group.items || []).forEach((item) => {
        const row = document.createElement("article");
        row.className = "service-price-row";
        const name = document.createElement("h3");
        name.className = "service-price-name";
        name.textContent = item.name;
        const price = document.createElement("p");
        price.className = "service-price-value";
        price.textContent = item.price;
        const book = document.createElement("a");
        book.className = "service-price-book button quiet small";
        book.textContent = "Записаться";
        book.href = "contacts.html#booking";
        book.dataset.book = "";
        book.dataset.wish = `Хочу записаться: ${item.name}.`;
        row.append(name, price, book);
        list.append(row);
      });
      details.append(list);

      const more = document.createElement("p");
      more.className = "service-catalog-more";
      const link = document.createElement("a");
      link.href = servicePageForGroup(group.id);
      link.textContent = `Подробнее: ${group.title}`;
      more.append(link);
      details.append(more);

      groupsRoot.append(details);
    });
  }

  paintFilters();
  paintGroups();
}

function renderPrices(content) {
  const root = document.querySelector("#price-list");
  if (!root) return;
  const ids = (root.dataset.groups || "").split(",").map((item) => item.trim()).filter(Boolean);
  const groups = (content.priceGroups || []).filter((group) => !ids.length || ids.includes(group.id));
  root.replaceChildren();
  if (!groups.length) {
    const empty = document.createElement("p");
    empty.textContent = "В этом разделе пока нет цен.";
    root.append(empty);
    return;
  }
  groups.forEach((group) => {
    const details = document.createElement("details");
    details.className = "price-group";
    details.open = ids.length > 0 || Boolean(group.open);
    const summary = document.createElement("summary");
    summary.textContent = group.title;
    details.append(summary);
    if (group.note) {
      const note = document.createElement("p");
      note.className = "price-note";
      note.textContent = group.note;
      details.append(note);
    }
    const scroll = document.createElement("div");
    scroll.className = "table-scroll";
    const table = document.createElement("table");
    const body = document.createElement("tbody");
    (group.items || []).forEach((item) => {
      const row = document.createElement("tr");
      const nameCell = document.createElement("th");
      nameCell.scope = "row";
      nameCell.textContent = item.name;
      const priceCell = document.createElement("td");
      priceCell.textContent = item.price;
      row.append(nameCell, priceCell);
      body.append(row);
    });
    table.append(body);
    scroll.append(table);
    details.append(scroll);
    root.append(details);
  });
}

function paint(hex, nodes) {
  nodes.forEach((node) => {
    if (node) node.style.background = hex;
  });
}

function goWish(text) {
  const book = document.querySelector("a[data-book]");
  if (book && /yclients\.(ru|com)$/i.test(book.hostname)) {
    window.open(book.href, "_blank", "noopener,noreferrer");
    return;
  }
  openRequest(text);
}

function renderMonth(content) {
  const name = document.querySelector("#month-name");
  const color = content.colorOfMonth;
  if (!name || !color) return;
  const hex = safeHex(color.hex);
  setText("#month-kicker", color.month);
  name.textContent = color.name || "";
  setText("#month-text", color.text);
  paint(hex, [document.querySelector("#month-swatch"), ...document.querySelectorAll("#month-nails i")]);
  const button = document.querySelector("#book-month");
  if (button) {
    button.addEventListener("click", () => {
      goWish(`Хочу маникюр цвета «${color.name}».`);
    });
  }
}

function renderSigns() {
  const signs = document.querySelector("#signs");
  if (!signs) return;
  const result = document.querySelector("#sign-result");
  const copy = document.querySelector("#sign-copy");
  zodiac.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = item.sign;
    button.setAttribute("aria-pressed", "false");
    button.addEventListener("click", () => {
      signs.querySelectorAll("button").forEach((other) => other.setAttribute("aria-pressed", "false"));
      button.setAttribute("aria-pressed", "true");
      result.hidden = false;
      document.querySelector("#sign-swatch").style.background = safeHex(item.hex);
      copy.textContent = `${item.name}. ${item.line}`;
      document.querySelector("#book-sign").onclick = () => {
        goWish(`Хочу маникюр цвета «${item.name}» — ${item.sign.toLowerCase()}.`);
      };
    });
    signs.append(button);
  });
}

function visiblePhotos(content) {
  const hidden = new Set(content.hiddenPhotos || []);
  return (content.photos || []).filter((src) => typeof src === "string" && src.startsWith("photos/") && !hidden.has(src));
}

function newsArticle(item) {
  const article = document.createElement("article");
  article.className = "news-item";
  if (item.date) {
    const date = document.createElement("p");
    date.className = "news-date";
    date.textContent = item.date;
    article.append(date);
  }
  const title = document.createElement("h3");
  title.textContent = item.title || "";
  const text = document.createElement("p");
  text.textContent = item.text || "";
  article.append(title, text);
  return article;
}

function renderNews(content) {
  const items = Array.isArray(content.news) ? content.news.filter((item) => item && item.title && item.text) : [];
  const latest = document.querySelector("#latest-news");
  if (latest) {
    latest.replaceChildren();
    if (!items.length) {
      const empty = document.createElement("p");
      empty.textContent = "Новостей пока нет.";
      latest.append(empty);
    } else {
      latest.append(newsArticle(items[0]));
    }
  }
  const list = document.querySelector("#news-list");
  if (!list) return;
  list.replaceChildren();
  if (!items.length) {
    const empty = document.createElement("p");
    empty.textContent = "Новостей пока нет.";
    list.append(empty);
    return;
  }
  items.forEach((item) => list.append(newsArticle(item)));
}

function renderPhotos(content) {
  const items = visiblePhotos(content);
  const strip = document.querySelector("#photo-strip");
  const tease = document.querySelector("#home-photos");
  if (strip && tease) {
    strip.replaceChildren();
    if (!items.length) {
      tease.hidden = true;
    } else {
      tease.hidden = false;
      items.slice(0, 6).forEach((src, index) => {
        const link = document.createElement("a");
        link.href = "photos.html";
        const image = document.createElement("img");
        image.src = src;
        image.alt = `Фото салона «По любви», ${index + 1}`;
        image.loading = "lazy";
        image.decoding = "async";
        link.append(image);
        strip.append(link);
      });
    }
  }

  const grid = document.querySelector("#gallery-grid");
  const dialog = document.querySelector("#photo-dialog");
  if (!grid || !dialog) return;
  const lead = document.querySelector("#photo-lead");
  if (lead) {
    lead.textContent = items.length
      ? `Работы салона. ${items.length} фото.`
      : "Фотографий пока нет.";
  }
  let index = 0;
  let opener = null;
  const view = document.querySelector("#photo-view");
  const pos = document.querySelector("#photo-pos");

  function show(next) {
    if (!items.length) return;
    index = (next + items.length) % items.length;
    view.src = items[index];
    view.alt = `Фото салона «По любви», ${index + 1} из ${items.length}`;
    pos.textContent = `${index + 1} из ${items.length}`;
    if (!dialog.open) {
      opener = document.activeElement;
      dialog.showModal();
    }
  }

  grid.replaceChildren();
  items.forEach((src, photoIndex) => {
    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("aria-label", `Открыть фото ${photoIndex + 1} из ${items.length}`);
    const image = document.createElement("img");
    image.src = src;
    image.alt = "";
    image.loading = photoIndex < 4 ? "eager" : "lazy";
    image.decoding = "async";
    button.append(image);
    button.addEventListener("click", () => show(photoIndex));
    grid.append(button);
  });

  document.querySelector("#photo-prev")?.addEventListener("click", () => show(index - 1));
  document.querySelector("#photo-next")?.addEventListener("click", () => show(index + 1));
  document.querySelector("#photo-close")?.addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => {
    if (opener && typeof opener.focus === "function") opener.focus();
  });
  dialog.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      show(index + 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      show(index - 1);
    }
  });
}

function nationalDigits(value) {
  let digits = String(value || "").replace(/\D/g, "");
  if (digits.length >= 11 && (digits[0] === "7" || digits[0] === "8")) {
    digits = digits.slice(1);
  }
  return digits.slice(0, 10);
}

function formatNational(digits) {
  const a = digits.slice(0, 3);
  const b = digits.slice(3, 6);
  const c = digits.slice(6, 8);
  const d = digits.slice(8, 10);
  if (!digits) return "";
  if (digits.length <= 3) return `(${a}`;
  if (digits.length <= 6) return `(${a}) ${b}`;
  if (digits.length <= 8) return `(${a}) ${b}-${c}`;
  return `(${a}) ${b}-${c}-${d}`;
}

function fullPhone(national) {
  const formatted = formatNational(national);
  return formatted ? `+7 ${formatted}` : "";
}

function bindPhone(input) {
  if (!input) return;
  input.addEventListener("input", () => {
    const digits = nationalDigits(input.value);
    input.value = formatNational(digits);
  });
  input.addEventListener("keydown", (event) => {
    if (event.key !== "Backspace" || input.selectionStart !== 0 || input.selectionEnd !== 0) return;
    event.preventDefault();
  });
}

function wishFromNode(node) {
  if (node.dataset.wish) return node.dataset.wish;
  try {
    return new URL(node.href, location.href).searchParams.get("wish") || "";
  } catch {
    return "";
  }
}

function openRequest(wish) {
  const dialog = document.querySelector("#request-dialog");
  const form = document.querySelector("#booking");
  const field = document.querySelector("#wish");
  const phone = document.querySelector("#client-phone");
  const status = document.querySelector("#form-status");
  if (!dialog) return;
  form?.reset();
  if (phone) phone.value = "";
  if (status) status.textContent = "";
  if (typeof wish === "string" && field) field.value = wish.slice(0, 1000);
  if (!dialog.open) dialog.showModal();
  document.querySelector("#client-name")?.focus();
}

function fallbackBooking(content, payload, status) {
  const salon = content.salon || {};
  if (salon.email) {
    const letter = [
      `Имя: ${payload.name}`,
      `Телефон: ${payload.phone}`,
      payload.wish ? `Заявка: ${payload.wish}` : "Заявка: без комментария",
      "Согласие на обработку персональных данных: да",
    ].join("\n");
    window.location.href = `mailto:${salon.email}?subject=${encodeURIComponent("Заявка с сайта «По любви»")}&body=${encodeURIComponent(letter)}`;
    status.textContent = "Сервер заявок не ответил. Откроется письмо на почту салона. Отправьте его, чтобы заявка дошла.";
    return true;
  }
  status.textContent = salon.phone
    ? `Сейчас заявка с сайта не сохранилась. Позвоните ${salon.phone} или напишите в WhatsApp.`
    : "Сейчас заявка с сайта не сохранилась. Запишитесь по телефону салона.";
  return false;
}

function mountRequest(content) {
  if (!document.querySelector("#request-dialog")) {
    const dialog = document.createElement("dialog");
    dialog.className = "request-dialog";
    dialog.id = "request-dialog";
    dialog.setAttribute("aria-labelledby", "request-title");
    dialog.innerHTML = `
      <div class="request-dialog-bar">
        <h2 id="request-title">Заявка</h2>
        <button class="button quiet small" type="button" id="request-close">Закрыть</button>
      </div>
      <form id="booking" novalidate>
        <div class="field">
          <label for="client-name">Имя</label>
          <input id="client-name" name="name" type="text" autocomplete="name" required />
        </div>
        <div class="field">
          <label for="client-phone">Телефон</label>
          <div class="phone-box">
            <span class="phone-code" aria-hidden="true">+7</span>
            <input id="client-phone" name="phone" type="tel" inputmode="numeric" autocomplete="tel-national" placeholder="(926) 923-29-29" maxlength="16" required />
          </div>
        </div>
        <div class="field">
          <label for="wish">Что записать</label>
          <textarea id="wish" name="wish" rows="3"></textarea>
        </div>
        <div class="field consent">
          <input id="consent" name="consent" type="checkbox" value="yes" required />
          <label for="consent">Соглашаюсь на обработку персональных данных и принимаю <a href="privacy.html">политику конфиденциальности</a>.</label>
        </div>
        <button class="button" type="submit">Отправить заявку</button>
        <p class="form-status" id="form-status" role="status"></p>
      </form>
    `;
    document.body.append(dialog);
  }

  const dialog = document.querySelector("#request-dialog");
  const form = document.querySelector("#booking");
  const consent = document.querySelector("#consent");
  const status = document.querySelector("#form-status");
  const phone = document.querySelector("#client-phone");
  if (!dialog || !form || !consent || !status || !phone) return;

  bindPhone(phone);
  document.querySelector("#request-close")?.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });

  document.querySelectorAll("[data-request], [data-extra-wish]").forEach((node) => {
    node.addEventListener("click", (event) => {
      event.preventDefault();
      openRequest(wishFromNode(node));
    });
  });

  if (!bookingHref(content)) {
    document.querySelectorAll("[data-book]").forEach((link) => {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        openRequest(wishFromNode(link));
      });
    });
  }

  const wish = new URLSearchParams(location.search).get("wish");
  if (wish || location.hash === "#booking") openRequest(wish || "");

  function syncConsent() {
    consent.setCustomValidity(
      consent.checked ? "" : "Поставьте отметку, если согласны на обработку персональных данных.",
    );
  }

  consent.addEventListener("change", () => {
    syncConsent();
    status.textContent = "";
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    syncConsent();
    const name = document.querySelector("#client-name");
    const digits = nationalDigits(phone.value);
    phone.value = formatNational(digits);
    phone.setCustomValidity(digits.length === 10 ? "" : "Введите телефон целиком, чтобы администратор мог перезвонить.");
    name.setCustomValidity(name.value.trim().length >= 2 ? "" : "Напишите, как к вам обращаться.");
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    const payload = {
      name: name.value.trim(),
      phone: fullPhone(digits),
      wish: document.querySelector("#wish").value.trim(),
      consent: true,
    };
    try {
      const response = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (response.status === 404) {
        if (fallbackBooking(content, payload, status)) goal("form_sent");
        return;
      }
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        status.textContent = data.error || "Заявку не удалось сохранить.";
        return;
      }
      form.reset();
      phone.value = "";
      status.textContent = content.salon?.phone
        ? `Заявка у администратора. Если удобнее, позвоните ${content.salon.phone}.`
        : "Заявка у администратора.";
      goal("form_sent");
    } catch {
      if (fallbackBooking(content, payload, status)) goal("form_sent");
    }
  });
}

async function boot() {
  let content;
  try {
    const response = await fetch("content.json", { cache: "no-store" });
    if (!response.ok) return;
    content = await response.json();
  } catch {
    return;
  }
  applyTexts(content);
  applySalon(content);
  mountTelegram(content);
  mountRequest(content);
  renderHomeServices(content);
  renderPrices(content);
  mountBooking(content);
  renderMonth(content);
  renderSigns();
  renderPhotos(content);
  renderNews(content);
}

boot();
