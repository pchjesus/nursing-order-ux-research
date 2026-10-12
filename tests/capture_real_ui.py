"""Capture ACTUAL v0.2.6 DOM/CSS/JS from the repository, no design recreation.
Saves screenshots of two native tabs and one synthetic schedule interaction.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
APP = ROOT / 'app'
OUT = ROOT / 'real-ui-captures'
OUT.mkdir(exist_ok=True)
SCRIPTS = ['fixtures.js','activity-details.js','case-context.js','domain.js','order-sheet-model.js','app.js']

def initialize(page):
    # Matching existing tested DOM-injection harness; no remote EHR or real patient data.
    page.set_content((APP / 'index.html').read_text(encoding='utf-8'))
    page.add_style_tag(content=(APP / 'styles.css').read_text(encoding='utf-8'))
    page.evaluate("""() => {
      const db = {};
      Object.defineProperty(window, 'localStorage', {
        configurable: true,
        value: {
          getItem: k => db[k] ?? null,
          setItem: (k,v) => { db[k] = String(v) },
          removeItem: k => { delete db[k] }
        }
      });
    }""")
    for filename in SCRIPTS:
        page.add_script_tag(content=(APP / filename).read_text(encoding='utf-8'))
    page.evaluate("window.dispatchEvent(new Event('DOMContentLoaded'))")

def screenshot(page, name, full=True):
    path = OUT / name
    page.screenshot(path=str(path), full_page=full, animations='disabled')
    print('SCREENSHOT',name,path.stat().st_size)

def change_slot(page, row, action, reason, new_time=None):
    target=page.locator('#order-list .order-card').first
    target.locator('[data-slot-row]').nth(row).locator('[data-slot-change="'+action+'"]').click()
    assert page.locator('#slot-change-modal').is_visible()
    page.locator('#slot-change-reason').fill(reason)
    if new_time is not None:
        page.locator('#slot-change-time').fill(new_time)
    page.locator('#slot-change-pin').fill('2468')
    page.locator('#slot-change-form button[type="submit"]').click()
    assert not page.locator('#slot-change-modal').is_visible()

with sync_playwright() as playwright:
    browser=playwright.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    page=browser.new_page(viewport={'width':1600,'height':1000},locale='ko-KR',timezone_id='Asia/Seoul',device_scale_factor=1)
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    initialize(page)
    assert page.title()=='Nursing Order UX Lab · v0.2.6'
    assert page.locator('[data-patient]').count()==4
    assert page.locator('[data-item]').count()==42

    # 1. Actual SEARCH tab, with existing activity fields and optional schedule UI.
    page.locator('#account').select_option('N-D01')
    page.locator('#password').fill('2468')
    page.locator('#login').click()
    page.locator('#query').fill('듀오덤')
    page.locator('[data-item="SIM-ACT-0053"]').click()
    page.locator('#detail-product-category').select_option('dressing-hydro')
    page.locator('#detail-product').select_option('SIM-PRD-001')
    page.locator('#schedule-kind').select_option('interval')
    page.locator('#schedule-start').fill('2026-10-13T09:00')
    page.locator('#schedule-every').fill('8')
    page.locator('#schedule-count').fill('3')
    screenshot(page, '01-actual-search-full.png')
    screenshot(page, '01-actual-search-viewport.png',full=False)

    # 2. Actual STATUS tab, exactly as seed data renders in the browser.
    page.locator('#tab-status').click()
    assert page.locator('#order-list .order-card').count()==4
    screenshot(page, '02-actual-status-seed-full.png')
    screenshot(page, '02-actual-status-seed-viewport.png',full=False)

    # 3. ACTUAL state-change UI populated only by simulated user interactions.
    page.locator('#tab-search').click()
    page.locator('#query').fill('')
    page.locator('[data-item="SIM-ACT-0001"]').click()
    page.locator('#schedule-kind').select_option('interval')
    page.locator('#schedule-start').fill('2026-10-13T09:00')
    page.locator('#schedule-every').fill('8')
    page.locator('#schedule-count').fill('3')
    page.locator('#save-draft').click()
    order=page.locator('#order-list .order-card').first
    assert order.locator('[data-confirm]').count()==1
    order.locator('[data-confirm]').click()
    page.locator('#confirm-pin').fill('2468')
    page.get_by_role('button',name='재인증 후 가상 확정').click()
    assert page.locator('#order-list .order-card').first.locator('[data-slot-row]').count()==3
    change_slot(page,0,'hold','교육용 보류 시나리오')
    change_slot(page,1,'postpone','교육용 연기 시나리오','2026-10-14T12:00')
    change_slot(page,2,'cancel','교육용 취소 시나리오')
    order=page.locator('#order-list .order-card').first
    order.locator('[data-view]').click()
    assert 'slot_cancelled' in order.inner_text()
    assert '연기된 예정' in order.inner_text()
    screenshot(page, '03-actual-status-schedule-full.png')
    screenshot(page, '03-actual-status-schedule-viewport.png',full=False)
    order.screenshot(path=str(OUT/'04-actual-order-card.png'),animations='disabled')
    print('SCREENSHOT 04-actual-order-card.png', (OUT/'04-actual-order-card.png').stat().st_size)
    assert not errors, errors
    print('PASS: screenshots rendered with actual HTML/CSS/JS, real fixture context and simulated UI interactions, page errors=0')
    browser.close()
