@developer

# Задача 01. SEO-основа на текущем сайте

Ветка: `redesign`. Сайт — статические HTML в корне (index.html, manikyur.html, pedikyur.html, vzglyad.html,
estetika.html, massazh.html, photos.html, news.html, contacts.html, color.html, consult.html, privacy.html).
Пока домен не куплен, базовый адрес: https://a50petr-cmd.github.io/po-lyubvi/ — вынеси его в одно место, чтобы потом заменить.

## Сделать
1. `robots.txt` в корне: разрешить всё, кроме admin.html; строка `Sitemap:` с полным адресом sitemap.xml.
2. `sitemap.xml` в корне: все публичные страницы из списка выше (без admin.html), `<lastmod>` — сегодняшняя дата.
3. Во всех публичных HTML в `<head>`:
   - `<link rel="canonical" href="БАЗА/имя-файла.html">` (для index.html — БАЗА/);
   - Open Graph: og:type=website, og:site_name «По любви», og:title = текущий `<title>`, og:description = текущий
     meta description, og:image = БАЗА/photos/001.webp, og:locale=ru_RU.
4. Во всех HTML убрать `Bodoni+Moda` из ссылки Google Fonts (остальные семейства оставить).
5. admin.html: добавить `<meta name="robots" content="noindex,nofollow">`.

## Не делать
Не менять тексты, вёрстку, стили, site.js, content.json. Не трогать photos/ и source/.

## Готово, когда
- robots.txt и sitemap.xml открываются, sitemap — валидный XML;
- в каждой публичной странице ровно один canonical и блок og:*;
- поиск по проекту `Bodoni` не находит ничего в HTML;
- в конце — список изменённых файлов и строка в docs/changelog.md.
