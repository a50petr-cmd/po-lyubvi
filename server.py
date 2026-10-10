#!/usr/bin/env python3
"""Локальный сервер сайта «По любви»: страницы, админка, заявки."""

from __future__ import annotations

import hashlib
import hmac
import json
import re
import secrets
import threading
import time
from datetime import datetime
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse

ROOT = Path(__file__).resolve().parent
CONTENT = ROOT / "content.json"
ADMIN = ROOT / "admin.json"
REQUESTS = ROOT / "requests.json"
PHOTOS = ROOT / "photos"
PASSWORD_FILE = ROOT / "admin-password.txt"
HOST = "127.0.0.1"
PORT = 17342
MAX_JSON = 2_000_000
MAX_IMAGE = 6_000_000
SESSION_SECONDS = 60 * 60 * 12

BLOCKED = {
    "admin.json",
    "requests.json",
    "admin-password.txt",
    "server.py",
    "download-photos.mjs",
    "photo-urls.json",
    "photos.js",
    "site.next.js",
    "seed.mjs",
}

MIME = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".svg": "image/svg+xml",
    ".webp": "image/webp",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".json": "application/json; charset=utf-8",
    ".txt": "text/plain; charset=utf-8",
    ".ico": "image/x-icon",
}

PHOTO_NAME = re.compile(r"^photos/[\w.-]+\.(webp|jpe?g|png|gif)$", re.I)
LOCK = threading.Lock()
LOGIN_FAILS: dict[str, list[float]] = {}
BOOK_HITS: dict[str, list[float]] = {}


def load_json(path: Path, default):
    if not path.exists():
        return default
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, data) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def hash_password(password: str, salt: str | None = None) -> tuple[str, str]:
    if salt is None:
        salt = secrets.token_hex(16)
    digest = hashlib.scrypt(
        password.encode("utf-8"),
        salt=salt.encode("utf-8"),
        n=2**14,
        r=8,
        p=1,
        dklen=32,
        maxmem=32 * 1024 * 1024,
    )
    return salt, digest.hex()


def verify_password(password: str, salt: str, digest: str) -> bool:
    _, got = hash_password(password, salt)
    return hmac.compare_digest(got, digest)


def ensure_admin() -> None:
    if ADMIN.exists():
        return
    password = secrets.token_urlsafe(9)
    salt, digest = hash_password(password)
    save_json(
        ADMIN,
        {"salt": salt, "password": digest, "secret": secrets.token_hex(32)},
    )
    PASSWORD_FILE.write_text(
        "Пароль входа в админку сайта «По любви»:\n"
        f"{password}\n"
        "Смените его в админке и удалите этот файл.\n",
        encoding="utf-8",
    )
    print(f"Пароль админки: {password}")
    print(f"Он также записан в {PASSWORD_FILE.name}")


def ensure_requests() -> None:
    if not REQUESTS.exists():
        save_json(REQUESTS, [])


def admin_record() -> dict:
    data = load_json(ADMIN, {})
    if not isinstance(data, dict) or "secret" not in data or "password" not in data:
        raise RuntimeError("admin.json повреждён")
    return data


def make_session(secret: str) -> str:
    expiry = int(time.time()) + SESSION_SECONDS
    message = str(expiry).encode("ascii")
    signature = hmac.new(secret.encode("ascii"), message, hashlib.sha256).hexdigest()
    return f"{expiry}.{signature}"


def session_ok(token: str, secret: str) -> bool:
    if not token or "." not in token:
        return False
    expiry_text, signature = token.split(".", 1)
    if not expiry_text.isdigit():
        return False
    if int(expiry_text) < int(time.time()):
        return False
    expected = hmac.new(secret.encode("ascii"), expiry_text.encode("ascii"), hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)


def cookies_from(header: str) -> dict[str, str]:
    found: dict[str, str] = {}
    for part in (header or "").split(";"):
        if "=" not in part:
            continue
        key, value = part.split("=", 1)
        found[key.strip()] = value.strip()
    return found


def normalize_yclients(value: str) -> str:
    text = str(value or "").strip()
    marked = re.search(r"[nw](\d{4,12})", text, re.I)
    if marked:
        return marked.group(1)
    if re.fullmatch(r"\d{4,12}", text):
        return text
    return ""


def clip(value, limit: int) -> str:
    return str(value or "").strip()[:limit]


def validate_content(data) -> str | None:
    if not isinstance(data, dict):
        return "Нужен объект с данными сайта"
    salon = data.get("salon")
    if not isinstance(salon, dict):
        return "Нет блока контактов"
    try:
        salon["lat"] = float(salon.get("lat"))
        salon["lon"] = float(salon.get("lon"))
    except (TypeError, ValueError):
        return "Координаты карты повреждены"
    for key, limit in {
        "city": 80,
        "street": 160,
        "phone": 40,
        "email": 120,
        "hours": 80,
        "telegram": 80,
        "whatsapp": 160,
        "site": 200,
        "siteLabel": 80,
        "maps": 300,
        "reviews": 300,
    }.items():
        if key in salon and salon[key] is not None:
            salon[key] = clip(salon[key], limit)

    groups = data.get("priceGroups")
    if not isinstance(groups, list) or len(groups) > 40:
        return "Прайс должен быть списком разделов"
    for group in groups:
        if not isinstance(group, dict):
            return "Раздел прайса повреждён"
        title = clip(group.get("title"), 80)
        if not title:
            return "У раздела прайса нет названия"
        group["title"] = title
        group["id"] = re.sub(r"[^a-z0-9_-]", "", str(group.get("id", "")).lower())[:40] or secrets.token_hex(4)
        group["note"] = clip(group.get("note"), 300)
        group["open"] = bool(group.get("open"))
        items = group.get("items")
        if not isinstance(items, list) or len(items) > 120:
            return "Проверьте строки прайса"
        clean = []
        for item in items:
            if isinstance(item, dict):
                name = clip(item.get("name"), 180)
                price = clip(item.get("price"), 40)
            elif isinstance(item, list) and len(item) >= 2:
                name = clip(item[0], 180)
                price = clip(item[1], 40)
            else:
                continue
            if name:
                clean.append({"name": name, "price": price})
        group["items"] = clean

    news = data.get("news") or []
    if not isinstance(news, list) or len(news) > 40:
        return "Слишком много новостей"
    clean_news = []
    for item in news:
        if not isinstance(item, dict):
            continue
        title = clip(item.get("title"), 160)
        text = clip(item.get("text"), 2000)
        if not title or not text:
            continue
        clean_news.append({
            "date": clip(item.get("date"), 40),
            "title": title,
            "text": text,
        })
    data["news"] = clean_news

    data["yclientsId"] = normalize_yclients(data.get("yclientsId", ""))
    photos = []
    for item in data.get("photos") or []:
        if isinstance(item, str) and PHOTO_NAME.match(item):
            photos.append(item)
    data["photos"] = photos
    hidden = []
    for item in data.get("hiddenPhotos") or []:
        if isinstance(item, str) and PHOTO_NAME.match(item):
            hidden.append(item)
    data["hiddenPhotos"] = hidden

    color = data.get("colorOfMonth")
    if isinstance(color, dict):
        color["month"] = clip(color.get("month"), 40)
        color["name"] = clip(color.get("name"), 80)
        color["text"] = clip(color.get("text"), 400)
        hex_color = clip(color.get("hex"), 7)
        if not re.fullmatch(r"#[0-9A-Fa-f]{6}", hex_color):
            return "Цвет месяца: нужен HEX вида #6B705C"
        color["hex"] = hex_color
    return None


def photo_path(rel: str) -> Path | None:
    if not PHOTO_NAME.match(rel):
        return None
    full = (ROOT / rel).resolve()
    if PHOTOS.resolve() not in full.parents:
        return None
    return full


def image_ext(blob: bytes) -> str | None:
    if blob.startswith(b"\xff\xd8\xff"):
        return ".jpg"
    if blob.startswith(b"\x89PNG\r\n\x1a\n"):
        return ".png"
    if blob.startswith(b"RIFF") and blob[8:12] == b"WEBP":
        return ".webp"
    if blob.startswith((b"GIF87a", b"GIF89a")):
        return ".gif"
    return None


def next_photo_name(ext: str) -> str:
    PHOTOS.mkdir(exist_ok=True)
    numbers = [int(path.stem) for path in PHOTOS.iterdir() if path.stem.isdigit()]
    return f"{(max(numbers) if numbers else 0) + 1:03d}{ext}"


def too_many(bucket: dict[str, list[float]], ip: str, limit: int, window: float) -> bool:
    now = time.time()
    hits = [stamp for stamp in bucket.get(ip, []) if now - stamp < window]
    bucket[ip] = hits
    return len(hits) >= limit


def remember(bucket: dict[str, list[float]], ip: str) -> None:
    bucket.setdefault(ip, []).append(time.time())


def clear_bucket(bucket: dict[str, list[float]], ip: str) -> None:
    bucket.pop(ip, None)


class Handler(BaseHTTPRequestHandler):
    server_version = "Polyubvi/1.0"

    def log_message(self, fmt: str, *args) -> None:
        print("%s %s" % (self.address_string(), fmt % args))

    @property
    def ip(self) -> str:
        return self.client_address[0]

    def cookie_token(self) -> str:
        return cookies_from(self.headers.get("Cookie", "")).get("session", "")

    def authorized(self) -> bool:
        try:
            record = admin_record()
        except RuntimeError:
            return False
        return session_ok(self.cookie_token(), record["secret"])

    def same_origin(self) -> bool:
        host = self.headers.get("Host", "")
        origin = self.headers.get("Origin")
        if origin:
            return urlparse(origin).netloc == host
        referer = self.headers.get("Referer")
        if referer:
            return urlparse(referer).netloc == host
        return False

    def send_json(self, code: int, payload, cookie: str | None = None, clear_cookie: bool = False) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        if cookie is not None:
            self.send_header(
                "Set-Cookie",
                f"session={cookie}; HttpOnly; SameSite=Lax; Path=/; Max-Age={SESSION_SECONDS}",
            )
        if clear_cookie:
            self.send_header("Set-Cookie", "session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0")
        self.end_headers()
        self.wfile.write(body)

    def read_json(self, limit: int = MAX_JSON):
        if not self.same_origin():
            self.send_json(403, {"error": "Запрос отклонён."})
            return None
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            length = -1
        if length < 0 or length > limit:
            self.send_json(413, {"error": "Слишком большой запрос."})
            return None
        raw = self.rfile.read(length)
        try:
            return json.loads(raw.decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError):
            self.send_json(400, {"error": "Не удалось прочитать данные."})
            return None

    def do_GET(self) -> None:
        path = urlparse(self.path).path
        if path == "/api/session":
            self.send_json(200, {"ok": self.authorized()})
            return
        if path == "/api/requests":
            if not self.authorized():
                self.send_json(401, {"error": "Нужно войти."})
                return
            self.send_json(200, {"requests": load_json(REQUESTS, [])})
            return
        if path.startswith("/api/"):
            self.send_json(404, {"error": "Нет такого адреса."})
            return
        self.serve_file(path)

    def do_POST(self) -> None:
        path = urlparse(self.path).path
        if path == "/api/login":
            self.login()
            return
        if path == "/api/logout":
            if self.read_json(1000) is None:
                return
            self.send_json(200, {"ok": True}, clear_cookie=True)
            return
        if path == "/api/content":
            self.save_content()
            return
        if path == "/api/password":
            self.change_password()
            return
        if path == "/api/booking":
            self.save_booking()
            return
        if path == "/api/upload":
            self.upload_photo()
            return
        if path == "/api/photos/delete":
            self.delete_photo()
            return
        self.send_json(404, {"error": "Нет такого адреса."})

    def do_DELETE(self) -> None:
        path = urlparse(self.path).path
        prefix = "/api/requests/"
        if not path.startswith(prefix):
            self.send_json(404, {"error": "Нет такого адреса."})
            return
        if not self.same_origin():
            self.send_json(403, {"error": "Запрос отклонён."})
            return
        if not self.authorized():
            self.send_json(401, {"error": "Нужно войти."})
            return
        request_id = unquote(path[len(prefix) :])
        if not re.fullmatch(r"[0-9a-f]{32}", request_id):
            self.send_json(400, {"error": "Некорректный номер заявки."})
            return
        with LOCK:
            items = [item for item in load_json(REQUESTS, []) if item.get("id") != request_id]
            save_json(REQUESTS, items)
        self.send_json(200, {"ok": True})

    def login(self) -> None:
        if too_many(LOGIN_FAILS, self.ip, 8, 600):
            self.send_json(429, {"error": "Слишком много попыток. Подождите несколько минут."})
            return
        data = self.read_json(20_000)
        if data is None:
            return
        password = str(data.get("password", ""))
        record = admin_record()
        if not verify_password(password, record["salt"], record["password"]):
            remember(LOGIN_FAILS, self.ip)
            self.send_json(401, {"error": "Неверный пароль."})
            return
        clear_bucket(LOGIN_FAILS, self.ip)
        self.send_json(200, {"ok": True}, cookie=make_session(record["secret"]))

    def save_content(self) -> None:
        if not self.authorized():
            self.send_json(401, {"error": "Нужно войти."})
            return
        data = self.read_json()
        if data is None:
            return
        error = validate_content(data)
        if error:
            self.send_json(400, {"error": error})
            return
        with LOCK:
            save_json(CONTENT, data)
        self.send_json(200, {"ok": True})

    def change_password(self) -> None:
        if not self.authorized():
            self.send_json(401, {"error": "Нужно войти."})
            return
        data = self.read_json(20_000)
        if data is None:
            return
        current = str(data.get("current", ""))
        nxt = str(data.get("next", ""))
        if len(nxt) < 8:
            self.send_json(400, {"error": "Новый пароль — не короче 8 знаков."})
            return
        record = admin_record()
        if not verify_password(current, record["salt"], record["password"]):
            self.send_json(400, {"error": "Текущий пароль не подошёл."})
            return
        salt, digest = hash_password(nxt)
        record["salt"] = salt
        record["password"] = digest
        with LOCK:
            save_json(ADMIN, record)
        if PASSWORD_FILE.exists():
            PASSWORD_FILE.unlink()
        self.send_json(200, {"ok": True})

    def save_booking(self) -> None:
        if too_many(BOOK_HITS, self.ip, 8, 600):
            self.send_json(429, {"error": "Слишком много заявок подряд. Позвоните в салон."})
            return
        data = self.read_json(20_000)
        if data is None:
            return
        if data.get("consent") is not True:
            self.send_json(400, {"error": "Нужно согласие на обработку персональных данных."})
            return
        name = clip(data.get("name"), 80)
        phone = clip(data.get("phone"), 40)
        wish = clip(data.get("wish"), 1000)
        digits = re.sub(r"\D", "", phone)
        if len(name) < 2:
            self.send_json(400, {"error": "Напишите, как к вам обращаться."})
            return
        if len(digits) < 10 or len(digits) > 15:
            self.send_json(400, {"error": "Введите телефон целиком."})
            return
        item = {
            "id": secrets.token_hex(16),
            "at": datetime.now().strftime("%d.%m.%Y %H:%M"),
            "name": name,
            "phone": phone,
            "wish": wish,
            "consent": True,
        }
        with LOCK:
            items = load_json(REQUESTS, [])
            if not isinstance(items, list):
                items = []
            items.append(item)
            save_json(REQUESTS, items[-500:])
        remember(BOOK_HITS, self.ip)
        self.send_json(200, {"ok": True})

    def upload_photo(self) -> None:
        if not self.authorized():
            self.send_json(401, {"error": "Нужно войти."})
            return
        data = self.read_json(MAX_IMAGE + 2_000_000)
        if data is None:
            return
        raw = data.get("data")
        if not isinstance(raw, str):
            self.send_json(400, {"error": "Файл не пришёл."})
            return
        try:
            blob = __import__("base64").b64decode(raw, validate=True)
        except Exception:
            self.send_json(400, {"error": "Файл не удалось прочитать."})
            return
        if len(blob) > MAX_IMAGE:
            self.send_json(413, {"error": "Фото больше 6 МБ."})
            return
        ext = image_ext(blob)
        if not ext:
            self.send_json(400, {"error": "Нужен файл JPG, PNG, WEBP или GIF."})
            return
        with LOCK:
            name = next_photo_name(ext)
            (PHOTOS / name).write_bytes(blob)
            content = load_json(CONTENT, {})
            photos = content.get("photos") if isinstance(content, dict) else None
            if not isinstance(photos, list):
                photos = []
                content["photos"] = photos
            rel = f"photos/{name}"
            if rel not in photos:
                photos.append(rel)
            save_json(CONTENT, content)
        self.send_json(200, {"ok": True, "photo": rel, "photos": content["photos"]})

    def delete_photo(self) -> None:
        if not self.authorized():
            self.send_json(401, {"error": "Нужно войти."})
            return
        data = self.read_json(10_000)
        if data is None:
            return
        rel = str(data.get("name", ""))
        path = photo_path(rel)
        if path is None:
            self.send_json(400, {"error": "Такое фото удалить нельзя."})
            return
        with LOCK:
            if path.exists():
                path.unlink()
            content = load_json(CONTENT, {})
            if isinstance(content, dict):
                content["photos"] = [item for item in content.get("photos", []) if item != rel]
                content["hiddenPhotos"] = [item for item in content.get("hiddenPhotos", []) if item != rel]
                save_json(CONTENT, content)
        self.send_json(200, {"ok": True, "photos": content.get("photos", [])})

    def serve_file(self, url_path: str) -> None:
        if url_path in ("", "/"):
            url_path = "/index.html"
        rel = unquote(url_path).lstrip("/")
        if not rel or "\\" in rel or Path(rel).name in BLOCKED or ".." in Path(rel).parts:
            self.send_error(404)
            return
        full = (ROOT / rel).resolve()
        if ROOT not in full.parents and full != ROOT:
            self.send_error(404)
            return
        if not full.is_file():
            self.send_error(404)
            return
        mime = MIME.get(full.suffix.lower(), "application/octet-stream")
        body = full.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", mime)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("X-Content-Type-Options", "nosniff")
        if full.suffix.lower() in {".html", ".json", ".js", ".css"}:
            self.send_header("Cache-Control", "no-store")
        else:
            self.send_header("Cache-Control", "public, max-age=86400")
        self.end_headers()
        self.wfile.write(body)


def main() -> None:
    ensure_admin()
    ensure_requests()
    PHOTOS.mkdir(exist_ok=True)
    httpd = None
    port = PORT
    for candidate in range(PORT, PORT + 5):
        try:
            httpd = ThreadingHTTPServer((HOST, candidate), Handler)
            port = candidate
            break
        except OSError:
            continue
    if httpd is None:
        raise SystemExit(f"Порты {PORT}–{PORT + 4} заняты.")
    print(f"Сайт: http://{HOST}:{port}/")
    print(f"Админка: http://{HOST}:{port}/admin.html")
    httpd.serve_forever()


if __name__ == "__main__":
    main()
