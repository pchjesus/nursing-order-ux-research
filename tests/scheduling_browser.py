"""v0.2.5 synthetic planned slots and separate execution/record browser regression."""
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
APP=ROOT/'app'
SCRIPTS=['fixtures.js','activity-details.js','case-context.js','domain.js','order-sheet-model.js','app.js']

def init(page,saved=None):
    page.set_content((APP/'index.html').read_text(encoding='utf-8'))
    page.add_style_tag(content=(APP/'styles.css').read_text(encoding='utf-8'))
    page.evaluate("""(saved)=>{
        const db={};if(saved!==null)db['nursing-order-demo-v02']=saved;
        Object.defineProperty(window,'localStorage',{configurable:true,value:{
          getItem:k=>db[k]??null,setItem:(k,v)=>{db[k]=String(v)},removeItem:k=>delete db[k]}});
    }""",saved)
    for name in SCRIPTS:
        page.add_script_tag(content=(APP/name).read_text(encoding='utf-8'))
    page.evaluate("window.dispatchEvent(new Event('DOMContentLoaded'))")

with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    page=browser.new_page(viewport={'width':1360,'height':1000},locale='ko-KR',timezone_id='Asia/Seoul')
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    init(page)
    assert 'v0.2.5' in page.title()
    page.locator('#tab-status').click()
    assert '예정: 미지정' in page.locator('#order-list').inner_text()
    page.locator('#tab-search').click()
    page.locator('#account').select_option('N-D01')
    page.locator('#password').fill('2468');page.locator('#login').click()
    page.locator('[data-item="SIM-ACT-0001"]').click()
    page.locator('#schedule-kind').select_option('interval')
    assert page.locator('#schedule-interval-fields').is_visible()
    page.locator('#schedule-start').fill('2026-10-11T09:00')
    page.locator('#schedule-every').fill('8')
    page.locator('#schedule-count').fill('25')
    page.locator('#save-draft').click()
    assert '반복 횟수' in page.locator('#flash').inner_text()
    page.locator('#schedule-count').fill('3')
    page.locator('#save-draft').click()
    order=page.locator('#order-list .order-card').first
    assert order.locator('.schedule-slot').count()==3
    assert '예정: 주기 반복 · 3회' in order.inner_text()
    assert '예정 미정 처방' in page.locator('#summary').inner_text()
    order.locator('[data-confirm]').click()
    page.locator('#confirm-pin').fill('2468')
    page.get_by_role('button',name='재인증 후 가상 확정').click()
    order=page.locator('#order-list .order-card').first
    order.locator('[data-slot]').first.click()
    order=page.locator('#order-list .order-card').first
    assert '연결 수행 1건 · 연결 기록 0건' in order.inner_text()
    assert '연결 수행 0건 · 연결 기록 0건' in order.inner_text()
    order.locator('[data-view]').click()
    order.locator('[data-note-for]').last.fill('예정 연계 합성 기록')
    order.locator('[data-record]').last.click()
    order=page.locator('#order-list .order-card').first
    assert '연결 수행 1건 · 연결 기록 1건' in order.inner_text()
    saved=page.evaluate("localStorage.getItem('nursing-order-demo-v02')")
    assert '"schema":2' in saved and '"slotId":' in saved
    assert '예정 3회' in page.locator('#case-order-sheet').text_content()
    page.locator('#group-by-code').check()
    assert '개별 처방' in page.locator('#order-list').inner_text()
    page.locator('[data-patient="P-B102"]').click()
    assert '예정: 주기 반복 · 3회' not in page.locator('#order-list').inner_text()
    page.locator('#tab-search').click()
    page.locator('[data-item="SIM-ACT-0001"]').click()
    page.locator('#schedule-kind').select_option('conditional')
    page.locator('#schedule-condition').fill('산소포화도 관찰상 변화가 발생하면')
    page.locator('#save-draft').click()
    assert '조건부 · 예정 횟수 미정' in page.locator('#order-list').inner_text()
    stored=page.evaluate("localStorage.getItem('nursing-order-demo-v02')")
    page2=browser.new_page(viewport={'width':1200,'height':900},locale='ko-KR',timezone_id='Asia/Seoul')
    page2.on('pageerror',lambda e:errors.append(str(e)))
    init(page2,stored)
    page2.locator('#tab-status').click()
    assert '예정: 주기 반복 · 3회' in page2.locator('#order-list').inner_text()
    assert '연결 수행 1건 · 연결 기록 1건' in page2.locator('#order-list').inner_text()
    page2.locator('[data-patient="P-B102"]').click()
    assert '조건부 · 예정 횟수 미정' in page2.locator('#order-list').inner_text()
    assert not errors,errors
    print('SCHEDULING BROWSER PASS: validation, 3 slots, explicit execution and record, grouping, patient isolation, conditional, reload, pageerrors=0')
    browser.close()
