import fs from "node:fs";
import vm from "node:vm";

const text = fs.readFileSync("site.js", "utf8");

function grab(name, next) {
  const start = text.indexOf(`const ${name} = `);
  const end = text.indexOf(next, start);
  if (start < 0 || end < 0) throw new Error(`Не нашёл ${name}`);
  let chunk = text.slice(start + `const ${name} = `.length, end).trim();
  const comment = chunk.lastIndexOf("\n//");
  if (comment > 0) chunk = chunk.slice(0, comment).trim();
  chunk = chunk.replace(/;\s*$/, "");
  return vm.runInNewContext(`(${chunk})`);
}

const priceGroups = grab("priceGroups", "const colorOfMonth");
const colorOfMonth = grab("colorOfMonth", "const zodiac");
const ids = ["manicure", "pedicure", "gaze", "massage", "face", "peels", "cleansing", "hardware", "wax", "men"];
priceGroups.forEach((group, index) => {
  group.id = ids[index] || `group-${index}`;
  group.items = group.items.map(([name, price]) => ({ name, price }));
});

const pages = {
  manikyur: {
    nav: "Маникюр",
    title: "Маникюр",
    lead: "Форма, покрытие и уход по одному стандарту. Техника одна у всех мастеров, цена зависит от категории.",
    groups: ["manicure"],
    wish: "Хочу записаться на маникюр.",
    extra: "<p>Оттенок можно выбрать заранее: на странице <a href=\"color.html\">цвета месяца</a>.</p>",
    description: "Маникюр в салоне «По любви», Электросталь. Одна техника, цена по категории мастера.",
  },
  pedikyur: {
    nav: "Педикюр",
    title: "Смарт-педикюр",
    lead: "Стопы остаются гладкими надолго. Домашний уход продлевает эффект. Технику ставит и проверяет технолог салона.",
    groups: ["pedicure"],
    wish: "Хочу записаться на смарт-педикюр.",
    extra: "",
    description: "Смарт-педикюр в салоне «По любви», Электросталь.",
  },
  vzglyad: {
    nav: "Взгляд",
    title: "Оформление взгляда",
    lead: "Брови и ламинирование ресниц. Наращивание ресниц скоро появится в записи.",
    groups: ["gaze"],
    wish: "Хочу записаться на брови или ресницы.",
    extra: "",
    description: "Брови и ламинирование ресниц в салоне «По любви», Электросталь.",
  },
  estetika: {
    nav: "Эстетика",
    title: "Эстетика",
    lead: "Чистка, уход под вашу кожу, массаж лица, пилинги, аппаратный массаж лица и тела. Инъекций нет.",
    groups: ["face", "peels", "cleansing", "hardware"],
    wish: "Хочу записаться к косметологу.",
    extra: "<p>Можно прийти только на <a href=\"consult.html\">бесплатную консультацию</a>: тип кожи, план и разбор домашнего ухода по составу, без привязки к маркам. На процедуру можно остаться или прийти позже.</p>",
    description: "Уход за кожей без инъекций в салоне «По любви», Электросталь.",
  },
  massazh: {
    nav: "Массаж",
    title: "Массаж",
    lead: "Мастер с опытом больше десяти лет: от антицеллюлитного до расслабляющего.",
    groups: ["massage"],
    wish: "Хочу записаться на массаж.",
    extra: "",
    description: "Массаж в салоне «По любви», Электросталь.",
  },
};

const content = {
  salon: {
    city: "Электросталь",
    street: "проспект Ленина, 08А",
    phone: "+7 (929) 555-18-87",
    email: "",
    hours: "Ежедневно, 9:00–21:00",
    telegram: "nailpersona",
    whatsapp: "https://wa.me/79295551887",
    site: "https://taplink.cc/nailpersona",
    siteLabel: "taplink.cc/nailpersona",
    lat: 55.811174,
    lon: 38.430234,
    maps: "https://yandex.ru/maps/org/po_lyubvi/241721947105/",
    reviews: "https://yandex.ru/maps/org/po_lyubvi/241721947105/reviews/",
  },
  yclientsId: "",
  offer: {
    title: "Первый визит — минус 15% на чек",
    text: "Для нового клиента, на все услуги этого визита. Процент один: чем больше процедур сразу, тем больше сумма скидки.",
  },
  standards:
    "Мастеров учит один технолог, инструмент стерилизуем перед каждым клиентом. Косметика с эко- и органик-сертификатами: 95–99% натурального состава. Администратор напомнит о визите и потом спросит, как всё прошло.",
  priceNote:
    "Услуга полная у каждой категории, качество одно и то же. Цена другая: у младшего мастера она доступнее. С опытом и скоростью работы мастер поднимается в категории — и в цене. Так можно выбрать мастера под свой бюджет.",
  priceSource:
    "Цифры с карточки на Яндекс Картах, обновлены 8 сентября. Где указана вилка, нижняя цена — у младшего мастера, верхняя — у эксперта.",
  notes: {
    rating: "На Яндекс Картах оценка 5,0 по 90 оценкам, знак «Хорошее место 2026».",
    reviewsLabel: "71 отзыв",
    way: "Остановка «Эльград», 285 метров пешком. Раньше салон назывался «Нэйл Персона».",
    place:
      "Парковка, Wi-Fi, оплата картой, подарочный сертификат, можно с детьми. Вход на коляске недоступен, зал доступен частично.",
    route: "Откроется Яндекс Карты с маршрутом до проспекта Ленина, 08А. Дальше нажмите «Поехали».",
  },
  consult: {
    title: "Бесплатная консультация косметолога",
    text: "Можно прийти только поговорить. Косметолог определит тип кожи, составит план под то, какой кожи вы хотите, и разберёт домашний уход по составу: какие действия средства должны давать именно вашей коже, без привязки к маркам. На процедуру можно остаться. Можно уйти и прийти позже по этому плану.",
  },
  pages: Object.fromEntries(
    Object.entries(pages).map(([key, page]) => [
      key,
      { title: page.title, lead: page.lead, groups: page.groups },
    ]),
  ),
  colorOfMonth,
  priceGroups,
  photos: fs
    .readdirSync("photos")
    .filter((name) => /\.(webp|jpe?g|png|gif)$/i.test(name))
    .sort()
    .map((name) => `photos/${name}`),
  hiddenPhotos: [],
};

fs.writeFileSync("content.json", `${JSON.stringify(content, null, 2)}\n`, "utf8");

function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

const navItems = [
  ["manikyur.html", "Маникюр", "manikyur"],
  ["pedikyur.html", "Педикюр", "pedikyur"],
  ["vzglyad.html", "Взгляд", "vzglyad"],
  ["estetika.html", "Эстетика", "estetika"],
  ["massazh.html", "Массаж", "massazh"],
  ["price.html", "Прайс", "price"],
  ["photos.html", "Фото", "photos"],
  ["contacts.html", "Контакты", "contacts"],
];

function header(current) {
  const nav = navItems
    .map(([href, label, key]) => {
      const currentAttr = key === current ? ' aria-current="page"' : "";
      return `<a href="${href}"${currentAttr}>${label}</a>`;
    })
    .join("\n          ");
  return `<header class="header">
        <a class="brand" href="index.html">
          <img class="brand-mark" src="favicon.svg" alt="" width="40" height="40" />
          <span class="brand-word">По любви</span>
        </a>
        <nav class="nav" aria-label="Разделы">
          ${nav}
        </nav>
        <a class="button" href="contacts.html#booking" data-book>Записаться</a>
      </header>`;
}

function footer() {
  return `<footer class="footer">
        <p>По любви, Электросталь</p>
        <nav class="footer-links" aria-label="Ещё">
          <a href="color.html">Цвет месяца</a>
          <a href="consult.html">Консультация</a>
          <a href="privacy.html">Политика конфиденциальности</a>
          <a href="admin.html">Вход для салона</a>
        </nav>
      </footer>`;
}

function shell(key, title, description, body) {
  return `<!DOCTYPE html>
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}" />
    <meta name="theme-color" content="#e6e2da" />
    <link rel="icon" href="favicon.svg" type="image/svg+xml" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600&family=Oranienbaum&display=swap" rel="stylesheet" />
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <a class="skip" href="#content">К содержанию</a>
    <div class="wrap">
      ${header(key)}
      <noscript><p class="section-lead">Включите JavaScript: так подгружаются прайс, фото и онлайн-запись.</p></noscript>
      ${body}
      ${footer()}
    </div>
    <script src="site.js"></script>
  </body>
</html>
`;
}

function servicePage(key, page) {
  const wishHref = `contacts.html?wish=${encodeURIComponent(page.wish)}`;
  return shell(
    key,
    `${page.title} — По любви`,
    page.description,
    `<main class="page" id="content">
        <h1 data-title="${key}">${esc(page.title)}</h1>
        <p class="section-lead" data-lead="${key}">${esc(page.lead)}</p>
        ${page.extra || ""}
        <p class="section-lead" id="price-note"></p>
        <div id="price-list" data-groups="${page.groups.join(",")}"></div>
        <p class="price-source" id="price-source"></p>
        <div class="page-actions">
          <a class="button" href="contacts.html#booking" data-book data-wish="${esc(page.wish)}">Записаться</a>
          <a data-extra-wish hidden href="${wishHref}">Оставить заявку администратору</a>
        </div>
      </main>`,
  );
}

const homeCards = ["manikyur", "pedikyur"]
  .map(
    (key) => `<a href="${key}.html">
              <h3>${esc(pages[key].title)}</h3>
              <p data-home-lead="${key}">${esc(pages[key].lead)}</p>
            </a>`,
  )
  .join("\n            ");

const restCards = ["vzglyad", "estetika", "massazh"]
  .map(
    (key) => `<a href="${key}.html">
              <h3>${esc(pages[key].title)}</h3>
              <p data-home-lead="${key}">${esc(pages[key].lead)}</p>
            </a>`,
  )
  .join("\n            ");

const discountWish = encodeURIComponent("Первый визит, хочу записаться со скидкой 15%.");

const indexHtml = shell(
  "home",
  "По любви — салон в Электростали",
  "Маникюр и смарт-педикюр в Электростали. Первому визиту — минус 15% на чек. Бесплатная консультация косметолога. Салон «По любви».",
  `<main id="content">
        <section class="hero" id="top">
          <div>
            <h1 class="wordmark"><span>По</span><span>любви</span></h1>
            <p class="slogan">Маленькая роскошь быть собой</p>
            <p class="place">Электросталь</p>
          </div>
          <div class="hero-note">
            <p class="offer-title" id="offer-title">${esc(content.offer.title)}</p>
            <p id="offer-text">${esc(content.offer.text)}</p>
            <a class="button" href="contacts.html?wish=${discountWish}">Записаться со скидкой</a>
          </div>
        </section>
        <section class="services" id="services" aria-labelledby="services-title">
          <h2 id="services-title" class="section-title">Услуги</h2>
          <div class="service-main">
            ${homeCards}
          </div>
          <div class="service-rest">
            ${restCards}
          </div>
          <p class="standards" id="standards">${esc(content.standards)}</p>
          <nav class="more-links" aria-label="Ещё разделы">
            <a href="price.html">Прайс</a>
            <a href="consult.html">Консультация косметолога</a>
            <a href="color.html">Цвет месяца</a>
            <a href="photos.html">Фото</a>
          </nav>
        </section>
        <section class="photos-tease" id="home-photos" hidden>
          <h2 class="section-title">Фото</h2>
          <div class="photo-strip" id="photo-strip"></div>
          <p class="more-links"><a href="photos.html">Все фотографии</a></p>
        </section>
        <section class="home-visit" aria-labelledby="visit-title">
          <h2 id="visit-title" class="section-title">Салон</h2>
          <p id="home-address">Электросталь, проспект Ленина, 08А. Ежедневно, 9:00–21:00.</p>
          <p><a id="home-phone" href="tel:+79295551887">+7 (929) 555-18-87</a></p>
          <a class="button" data-route href="https://yandex.ru/maps/?rtext=~55.811174,38.430234&amp;rtt=auto" target="_blank" rel="noopener noreferrer">Построить маршрут</a>
        </section>
      </main>`,
);

const priceHtml = shell(
  "price",
  "Прайс — По любви",
  "Цены салона «По любви» в Электростали. Нижняя цена вилки — младший мастер, верхняя — эксперт.",
  `<main class="page price" id="content">
        <h1>Прайс</h1>
        <p class="section-lead" id="price-note">${esc(content.priceNote)}</p>
        <div id="price-list"></div>
        <p class="price-source" id="price-source">${esc(content.priceSource)}</p>
        <div class="page-actions">
          <a class="button" href="contacts.html#booking" data-book>Записаться</a>
        </div>
      </main>`,
);

const consultHtml = shell(
  "consult",
  "Консультация косметолога — По любви",
  "Бесплатная консультация косметолога в салоне «По любви»: тип кожи, план и разбор домашнего ухода.",
  `<main class="page consult" id="content">
        <h1 id="consult-title">${esc(content.consult.title)}</h1>
        <p id="consult-text">${esc(content.consult.text)}</p>
        <div class="page-actions">
          <a class="button" href="contacts.html?wish=${encodeURIComponent("Хочу бесплатную консультацию косметолога.")}">Записаться на консультацию</a>
        </div>
      </main>`,
);

const colorHtml = shell(
  "color",
  "Цвет месяца — По любви",
  "Цвет маникюра месяца и спокойные оттенки по знаку в салоне «По любви».",
  `<main class="page color" id="content">
        <h1>Цвет месяца</h1>
        <div class="play">
          <article>
            <p class="color-kicker" id="month-kicker">${esc(colorOfMonth.month)}</p>
            <h3 id="month-name">${esc(colorOfMonth.name)}</h3>
            <div class="swatch" id="month-swatch"></div>
            <div class="nails" id="month-nails" aria-hidden="true"><i></i><i></i><i></i></div>
            <p id="month-text">${esc(colorOfMonth.text)}</p>
            <button class="button" type="button" id="book-month">Записать этот цвет</button>
          </article>
          <article>
            <h3>Цвет по знаку</h3>
            <p>Не гороскоп, а повод выбрать оттенок.</p>
            <div class="signs" id="signs" role="group" aria-label="Знак зодиака"></div>
            <div class="sign-result" id="sign-result" hidden>
              <div class="sign-swatch" id="sign-swatch"></div>
              <p id="sign-copy"></p>
              <button class="button" type="button" id="book-sign">Записать этот цвет</button>
            </div>
          </article>
        </div>
      </main>`,
);

const photosHtml = shell(
  "photos",
  "Фото — По любви",
  "Фотографии салона «По любви» в Электростали.",
  `<main class="page" id="content">
        <h1>Фото</h1>
        <p class="section-lead" id="photo-lead">Фотографии салона с карточки на Яндекс Картах.</p>
        <div class="gallery-grid" id="gallery-grid"></div>
        <dialog class="photo-dialog" id="photo-dialog" aria-label="Фотография">
          <div class="photo-dialog-bar">
            <button class="button quiet" type="button" id="photo-prev">Назад</button>
            <p id="photo-pos"></p>
            <button class="button quiet" type="button" id="photo-next">Дальше</button>
            <button class="button" type="button" id="photo-close">Закрыть</button>
          </div>
          <img id="photo-view" alt="" />
        </dialog>
      </main>`,
);

const contactsHtml = shell(
  "contacts",
  "Контакты — По любви",
  "Салон «По любви», Электросталь, проспект Ленина, 08А. Ежедневно с 9:00 до 21:00.",
  `<main class="page contacts" id="content">
        <h1>Контакты</h1>
        <p id="booking-note" hidden></p>
        <div class="contacts-grid">
          <div>
            <address>
              <p id="city-line">Электросталь</p>
              <p id="street-line">проспект Ленина, 08А</p>
              <p id="hours-line">Ежедневно, 9:00–21:00</p>
              <p id="phone-line"><a class="phone-link" id="phone-link" href="tel:+79295551887">+7 (929) 555-18-87</a></p>
              <p id="telegram-line"><a class="phone-link" id="telegram-link" href="https://t.me/nailpersona" target="_blank" rel="noopener noreferrer">Telegram @nailpersona</a></p>
              <p id="wa-line"><a class="phone-link" id="wa-link" href="https://wa.me/79295551887" target="_blank" rel="noopener noreferrer">WhatsApp</a></p>
              <p id="site-line"><a class="phone-link" id="site-link" href="https://taplink.cc/nailpersona" target="_blank" rel="noopener noreferrer">taplink.cc/nailpersona</a></p>
            </address>
            <p id="rating-line">На Яндекс Картах оценка 5,0 по 90 оценкам, знак «Хорошее место 2026». <a id="reviews-link" href="https://yandex.ru/maps/org/po_lyubvi/241721947105/reviews/" target="_blank" rel="noopener noreferrer">71 отзыв</a></p>
            <p id="way-line">Остановка «Эльград», 285 метров пешком. Раньше салон назывался «Нэйл Персона».</p>
            <p id="place-notes">Парковка, Wi-Fi, оплата картой, подарочный сертификат, можно с детьми. Вход на коляске недоступен, зал доступен частично.</p>
            <p id="route-note">Откроется Яндекс Карты с маршрутом до проспекта Ленина, 08А. Дальше нажмите «Поехали».</p>
            <a class="button" data-route href="https://yandex.ru/maps/?rtext=~55.811174,38.430234&amp;rtt=auto" target="_blank" rel="noopener noreferrer">Построить маршрут</a>
          </div>
          <form id="booking" novalidate>
            <h3>Заявка</h3>
            <div class="field">
              <label for="client-name">Имя</label>
              <input id="client-name" name="name" type="text" autocomplete="name" required />
            </div>
            <div class="field">
              <label for="client-phone">Телефон</label>
              <input id="client-phone" name="phone" type="tel" autocomplete="tel" inputmode="tel" required />
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
        </div>
      </main>`,
);

const privacyHtml = shell(
  "privacy",
  "Политика конфиденциальности — По любви",
  "Как салон «По любви» обращается с именем и телефоном из заявки на сайте.",
  `<main class="prose page" id="content">
        <h1>Политика конфиденциальности</h1>
        <p>Это правила для заявки на сайте салона «По любви» в Электростали. Полные реквизиты оператора (ИП или ООО, ИНН, юридический адрес) салон сообщает по запросу и дополнит на этой странице.</p>
        <h2>Какие данные нужны</h2>
        <p>Имя, телефон и текст заявки: какая услуга или вопрос вас интересует.</p>
        <h2>Зачем</h2>
        <p>Чтобы администратор ответил и записал вас. Для рассылки и рекламы эти данные не используются.</p>
        <h2>На каком основании</h2>
        <p>На вашем согласии. Галочка в форме не стоит заранее. Без неё заявка не отправляется. Позвонить в салон можно и без формы.</p>
        <h2>Куда попадает заявка</h2>
        <p>Заявка сохраняется у салона, чтобы администратор увидел имя, телефон и текст. Если сервер сайта не ответил, а в настройках указана почта, на вашем устройстве открывается письмо. Оно уходит только когда вы сами нажимаете «Отправить» в почте.</p>
        <p>Кнопка «Записаться» может открыть онлайн-запись YCLIENTS. Имя и телефон для такой записи вы вводите уже в окне YCLIENTS, по правилам YCLIENTS, не в форме этого сайта.</p>
        <h2>Сколько храним</h2>
        <p>Пока заявка нужна, чтобы связаться и провести запись. Дальше — пока этого требует запись к мастеру. По вашей просьбе данные удаляем, если закон не обязывает хранить их дольше.</p>
        <h2>Кому передаём</h2>
        <p>Третьим лицам для их рекламы не передаём. Исключение — если этого прямо требует закон. Онлайн-запись YCLIENTS обрабатывается на стороне YCLIENTS, когда вы сами открываете их окно.</p>
        <h2>Ваши права</h2>
        <p>Можно спросить, какие данные салона вас касаются, попросить исправить или удалить их и отозвать согласие. Для этого напишите или позвоните в салон. Отказ от согласия не мешает уже оказанной услуге, но новую заявку с сайта без согласия отправить нельзя.</p>
      </main>`,
);

const files = {
  "index.html": indexHtml,
  "price.html": priceHtml,
  "consult.html": consultHtml,
  "color.html": colorHtml,
  "photos.html": photosHtml,
  "contacts.html": contactsHtml,
  "privacy.html": privacyHtml,
};

Object.entries(pages).forEach(([key, page]) => {
  files[`${key}.html`] = servicePage(key, page);
});

for (const [name, html] of Object.entries(files)) {
  fs.writeFileSync(name, html, "utf8");
}

if (fs.existsSync("site.next.js")) {
  fs.copyFileSync("site.next.js", "site.js");
  fs.unlinkSync("site.next.js");
}

console.log(`pages ${Object.keys(files).length}, photos ${content.photos.length}, prices ${priceGroups.length}`);
