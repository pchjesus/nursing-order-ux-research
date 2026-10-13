"""Root landing-page regression: real file:// and HTTP serving, links, and storage isolation."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
HOME = ROOT / 'index.html'
SCREENSHOT = ROOT / 'docs' / 'ui-root-landing.png'

class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, fmt, *args):
        pass

def assert_landing(page):
    assert page.title() == 'Nursing Order UX Lab · 시작 화면'
    assert 'Directory listing for /' not in page.content()
    assert page.get_by_role('heading', name='실행할 화면을 선택하세요').is_visible()
    assert page.locator('a[href="app/index.html"]').count() == 1
    assert page.locator('a[href="research/pilot-viewer.html"]').count() == 1
    assert page.locator('script').count() == 0
    assert page.get_by_text('실제 병원 EMR·nU가 아닙니다.', exact=False).is_visible()

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(
        headless=True, executable_path='/usr/bin/chromium',
        args=['--no-sandbox', '--disable-dev-shm-usage']
    )
    page = browser.new_page(viewport={'width':1440, 'height':960}, locale='ko-KR')
    errors = []
    page.on('pageerror', lambda err: errors.append(str(err)))

    # A single static root index works from local files.
    page.goto(HOME.as_uri(), wait_until='load')
    assert_landing(page)
    page.get_by_role('link', name='간호처방 시뮬레이터 v0.2.6 열기').click()
    assert page.title() == 'Nursing Order UX Lab · v0.2.6'
    assert page.locator('[data-patient]').count() == 4
    page.goto(HOME.as_uri())
    page.get_by_role('link', name='읽기 전용 연구용 평가 뷰어 v0.2.7 열기').click()
    assert page.title() == 'Nursing Order UX · 합성 사례 평가 뷰어 v0.2.7'
    assert page.locator('[data-pilot-order]').count() == 2

    # HTTP root matches Codespaces style: "/" must serve the landing page,
    # not a directory listing, and relative navigation must still work.
    handler = partial(QuietHandler, directory=str(ROOT))
    server = ThreadingHTTPServer(('127.0.0.1', 0), handler)
    thread = Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        base = f'http://127.0.0.1:{server.server_port}/'
        response = page.goto(base, wait_until='load')
        assert response.status == 200
        assert_landing(page)
        SCREENSHOT.parent.mkdir(parents=True, exist_ok=True)
        page.screenshot(path=str(SCREENSHOT), full_page=True, animations='disabled')
        page.get_by_role('link', name='간호처방 시뮬레이터 v0.2.6 열기').click()
        assert page.url.endswith('/app/index.html')
        assert page.locator('[data-patient]').count() == 4
        existing = page.evaluate("localStorage.getItem('nursing-order-demo-v02')")
        assert existing is not None, 'Expected the v0.2.6 app seed, not a blank state'

        # Returning to / cannot overwrite or reset the existing browser state.
        page.goto(base, wait_until='load')
        assert_landing(page)
        assert page.evaluate("localStorage.getItem('nursing-order-demo-v02')") == existing
        page.get_by_role('link', name='읽기 전용 연구용 평가 뷰어 v0.2.7 열기').click()
        assert page.url.endswith('/research/pilot-viewer.html')
        assert page.locator('[data-pilot-order]').count() == 2
        assert page.evaluate("localStorage.getItem('nursing-order-demo-v02')") == existing
        page.goto(base)
        assert_landing(page)
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=3)

    assert not errors, errors
    print('LANDING BROWSER PASS: file:// and HTTP root, two destination links, '
          'original app, independent pilot, localStorage preservation, JS errors=0')
    browser.close()
