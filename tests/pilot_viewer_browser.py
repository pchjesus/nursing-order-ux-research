"""Chromium smoke for the isolated, read-only synthetic usability pilot viewer v0.2.7."""
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
HTML=ROOT/'research'/'pilot-viewer.html'
OUT=ROOT/'docs'/'ui-pilot-v0.2.7.png'

with sync_playwright() as playwright:
    browser=playwright.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    page=browser.new_page(viewport={'width':1440,'height':1000},locale='ko-KR',timezone_id='Asia/Seoul')
    errors=[]
    page.on('pageerror',lambda e: errors.append(str(e)))
    page.goto(HTML.as_uri(),wait_until='load')
    assert page.title()=='Nursing Order UX · 합성 사례 평가 뷰어 v0.2.7'
    assert page.locator('#viewer-error').is_hidden()
    assert page.locator('#search-count').inner_text().endswith('건')
    assert page.locator('.search-item').count()>=3
    assert page.locator('[data-pilot-order]').count()==2
    assert '예정 슬롯' in page.locator('#pilot-metrics').inner_text()
    assert '3' in page.locator('#pilot-metrics').inner_text()
    assert '조건부' in page.locator('#pilot-orders').inner_text()
    assert 'PILOT-O-001' in page.locator('#pilot-orders').inner_text()
    assert 'PILOT-O-002' in page.locator('#pilot-orders').inner_text()
    assert 'PILOT-E-001' not in page.locator('#pilot-orders').inner_text() # only summary, no exposed raw event log

    page.locator('#pilot-query').fill('SIM-ACT-0053')
    assert page.locator('.search-item').count()==1
    assert '멸균 창상 드레싱 관리' in page.locator('.search-item').inner_text()
    page.locator('#pilot-query').fill('없는 가상 검색어')
    assert page.locator('.search-item').count()==0
    assert '없습니다' in page.locator('#search-results').inner_text()
    page.locator('#clear-search').click()
    assert page.locator('.search-item').count()==42

    original_ids=page.locator('[data-pilot-order]').evaluate_all('(nodes)=>nodes.map(n=>n.dataset.pilotOrder).sort()')
    page.locator('#group-by-code').check()
    assert page.locator('.pilot-group').count()==1
    assert page.locator('.pilot-group [data-pilot-order]').count()==2
    grouped_ids=page.locator('[data-pilot-order]').evaluate_all('(nodes)=>nodes.map(n=>n.dataset.pilotOrder).sort()')
    assert original_ids==grouped_ids

    page.locator('[data-pilot-patient="P-B102"]').click()
    assert page.locator('[data-pilot-order]').count()==1
    assert page.locator('[data-pilot-order="PILOT-O-003"]').count()==1
    assert 'PILOT-O-002' not in page.locator('#pilot-orders').inner_text()
    page.locator('[data-pilot-patient="P-A101"]').click()
    assert page.locator('[data-pilot-order]').count()==2
    assert page.locator('[data-pilot-order="PILOT-O-003"]').count()==0

    # No localStorage write or read: override storage with an always-throwing accessor
    # then reload the same independent research file. It must still render.
    page.add_init_script("""Object.defineProperty(window,'localStorage',{get(){throw new Error('storage must not be accessed by pilot viewer')}});""")
    page.reload(wait_until='load')
    assert page.locator('[data-pilot-order]').count()==2
    assert page.locator('#viewer-error').is_hidden()
    assert not errors,errors
    page.screenshot(path=str(OUT),full_page=True,animations='disabled')
    print('PILOT VIEWER BROWSER PASS: real file-open, exact search, grouping/IDs, patient isolation, no storage, no JS errors',OUT)
    browser.close()
