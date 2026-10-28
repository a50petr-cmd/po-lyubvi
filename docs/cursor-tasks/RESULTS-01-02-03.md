# Результаты задач 01–03 для следующего агента

Дата: 2026-10-28  
Ветка: `redesign` (локально сделано, **пуш на origin не выполнялся**)  
Исполнитель: основной агент (субагент `@developer` недоступен — лимит usage)  
Задачи: `docs/cursor-tasks/01-seo-osnova.md`, `02-metrika-celi.md`, `03-nizhnyaya-panel.md`

Краткий changelog: `docs/changelog.md`

---

## Статус

| Задача | Статус |
|--------|--------|
| 01 SEO-основа | ✅ сделано |
| 02 Метрика и цели | ✅ сделано |
| 03 Нижняя панель | ✅ сделано |

---

## Задача 01 — SEO-основа

### Что сделано
1. **`site-config.json`** — единое место базового URL:
   ```json
   { "baseUrl": "https://a50petr-cmd.github.io/po-lyubvi" }
   ```
   После покупки домена: заменить `baseUrl` и синхронно обновить `robots.txt`, `sitemap.xml`, все `canonical` и `og:image` / `og:*` в HTML.

2. **`robots.txt`**
   - `Allow: /`
   - `Disallow: /admin.html`
   - `Sitemap: https://a50petr-cmd.github.io/po-lyubvi/sitemap.xml`

3. **`sitemap.xml`** — 12 публичных URL, `<lastmod>2026-10-28</lastmod>`, без `admin.html`.

4. Во всех публичных HTML в `<head>`:
   - один `<link rel="canonical" …>`
   - OG: `og:type`, `og:site_name` («По любви»), `og:title`, `og:description`, `og:image` (`…/photos/001.webp`), `og:locale=ru_RU`
   - у `index.html` canonical = `…/po-lyubvi/` (со слэшем)

5. Из всех HTML убран `Bodoni+Moda` из Google Fonts (остались Manrope + Oranienbaum). Поиск `Bodoni` в `*.html` — пусто.

6. **`admin.html`**: `<meta name="robots" content="noindex,nofollow">` (было только `noindex`).

### Изменённые / созданные файлы (01)
```
site-config.json          (new)
robots.txt                (new)
sitemap.xml               (new)
docs/changelog.md         (new / дополнен)
index.html
manikyur.html
pedikyur.html
vzglyad.html
estetika.html
massazh.html
photos.html
news.html
contacts.html
color.html
consult.html
privacy.html
admin.html
```

### Замечания для следующего агента
- В head после вставки OG строка `theme-color` иногда слиплась с `og:locale` в одну строку (валидно, но можно привести к аккуратному форматированию).
- `site-config.json` **не подключён** скриптом: это справочник «где менять URL». HTML/robots/sitemap содержат URL литералом.

### Проверки
- [ ] открыть `/robots.txt` и `/sitemap.xml` на Pages после деплоя
- [ ] в каждой публичной странице ровно один `canonical` и блок `og:*`
- [ ] `rg Bodoni --glob '*.html'` → пусто

---

## Задача 02 — Яндекс Метрика и цели

### Что сделано
В начале **`site.js`**:
- `const YM_ID = null; // TODO: номер счётчика Метрики`
- `initMetrika()` — грузит `tag.js` и `ym(…,'init',{clickmap,trackLinks,accurateTrackBounce,webvisor})` **только если YM_ID задан**
- `goal(name)` — `ym(YM_ID,'reachGoal',name)` или `console.debug('goal: …')`
- `mountGoals()` — делегирование на `document`:
  | Цель | Условие |
  |------|---------|
  | `booking_open` | клик по `[data-book]` |
  | `call` | клик по `a[href^="tel:"]` |
  | `whatsapp` | ссылка с `wa.me` |
  | `telegram` | ссылка с `t.me` |
  | `route` | `[data-route]` |
  | `price_open` | `toggle` на `<details>` в `.service-catalog` / `#price-list` (только при `open`) |
  | `form_sent` | успешный ответ `/api/booking` **или** mailto-fallback (есть email); при полном фейле без mailto — **не** шлётся |

**`privacy.html`**: добавлен блок «Яндекс Метрика» (cookie, вебвизор, статистика).

### Изменённые файлы (02)
```
site.js
privacy.html
docs/changelog.md
```

### Как включить Метрику позже
1. В `site.js` заменить `YM_ID = null` на номер, например `const YM_ID = 12345678;`
2. В интерфейсе Метрики создать цели с теми же идентификаторами (`booking_open`, `call`, …).

### Проверки
- [ ] при `YM_ID = null` в Network нет `mc.yandex.ru`
- [ ] в консоли при клике «Записаться» видно `goal: booking_open`
- [ ] подставить любой числовой id → грузится tag.js

---

## Задача 03 — Нижняя панель `.dock`

### Что сделано
На всех **12 публичных** HTML перед `<script src="site.js">`:

```html
<nav class="dock" aria-label="Быстрые действия">
  <a href="contacts.html#booking" data-book>Записаться</a>
  <a href="tel:+79295551887">Позвонить</a>
  <a href="https://wa.me/79295551887" target="_blank" rel="noopener">WhatsApp</a>
</nav>
```

В **`styles.css`**:
- `.dock { display: none }` по умолчанию
- `@media (max-width: 899px)`:
  - панель `position: fixed; bottom: 0; grid 1.4fr 1fr 1fr; min-height кнопок 46px`
  - padding снизу с `env(safe-area-inset-bottom)`
  - «Записаться» — тёмная кнопка (`var(--ink)` / `var(--sheet)`)
  - `body { padding-bottom: calc(62px + safe-area) }`
  - `.tg-float { display: none }` (не перекрывает панель)
  - уменьшен `padding-bottom` у `.footer`

`mountBooking` вызывается в `boot()` после парсинга DOM → кнопки `.dock [data-book]` получают YCLIENTS-ссылку так же, как кнопка в шапке. Цели Метрики (`booking_open`, `call`, `whatsapp`) тоже срабатывают через делегирование.

`admin.html` — **без** панели (по задаче только публичные).

### Изменённые файлы (03)
```
styles.css
index.html
manikyur.html
pedikyur.html
vzglyad.html
estetika.html
massazh.html
photos.html
news.html
contacts.html
color.html
consult.html
privacy.html
docs/changelog.md
```

### Проверки
- [ ] viewport ~390px: панель внизу, без горизонтального скролла, футер не уезжает под панель
- [ ] 1440px: панели нет, `.tg-float` видна
- [ ] «Записаться» в dock открывает YCLIENTS (`n1270388.yclients.ru`)

---

## Полный список затронутых файлов (01+02+03)

**Новые:**
- `site-config.json`
- `robots.txt`
- `sitemap.xml`
- `docs/changelog.md`
- `docs/cursor-tasks/RESULTS-01-02-03.md` (этот файл)

**Изменённые:**
- `site.js`
- `styles.css`
- `admin.html`
- все публичные HTML из списка задачи 01
- `privacy.html` (OG + Метрика + dock)

**Не трогали (как просили):**
- `content.json`, `photos/`, `source/`, вёрстку героя/шапки (кроме head meta и dock), Google Analytics

---

## Что сделать следующему агенту

1. **Закоммитить и запушить** ветку `redesign` (пользователь ещё не просил «выложи» после этих задач — или спросить).
2. Пройти QA по чеклистам выше (мобила / десктоп / консоль goals).
3. Следующие задачи из `docs/cursor-tasks/` — если появятся файлы `04-…`.
4. Когда будет номер Метрики — только правка `YM_ID` в `site.js`.
5. При смене домена — `site-config.json` + robots + sitemap + canonical/og во всех HTML.

Полный контекст проекта: `docs/AGENT_HANDOFF.md`, `docs/WORKFLOW.md`, `docs/REDESIGN_BRIEF.md`.
