"""DOM-injected Chromium smoke for v0.2.6 slot changes, audit and recovery."""
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
APP=ROOT/'app'
SCRIPTS=['fixtures.js','activity-details.js','case-context.js','domain.js','order-sheet-model.js','app.js']
def init(page,stored=None):
    page.set_content((APP/'index.html').read_text(encoding='utf-8'))
    page.add_style_tag(content=(APP/'styles.css').read_text(encoding='utf-8'))
    page.evaluate("""(stored)=>{
       const db={};if(stored!==null)db['nursing-order-demo-v02']=stored;
       Object.defineProperty(window,'localStorage',{configurable:true,value:{
         getItem:k=>db[k]??null,setItem:(k,v)=>{db[k]=String(v)},removeItem:k=>delete db[k]}});
    }""",stored)
    for script in SCRIPTS:page.add_script_tag(content=(APP/script).read_text(encoding='utf-8'))
    page.evaluate("window.dispatchEvent(new Event('DOMContentLoaded'))")

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    page=browser.new_page(viewport={'width':1440,'height':1080},locale='ko-KR',timezone_id='Asia/Seoul')
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    init(page)
    assert 'v0.2.6' in page.title()
    page.locator('#account').select_option('N-D01')
    page.locator('#password').fill('2468');page.locator('#login').click()
    page.locator('[data-item="SIM-ACT-0001"]').click()
    page.locator('#schedule-kind').select_option('interval')
    page.locator('#schedule-start').fill('2026-10-11T09:00')
    page.locator('#schedule-every').fill('8');page.locator('#schedule-count').fill('3')
    page.locator('#save-draft').click()
    order=page.locator('#order-list .order-card').first
    order.locator('[data-confirm]').click()
    page.locator('#confirm-pin').fill('2468')
    page.get_by_role('button',name='재인증 후 가상 확정').click()
    order=page.locator('#order-list .order-card').first
    assert order.locator('[data-slot-row]').count()==3
    first=order.locator('[data-slot-row]').first
    first.locator('[data-slot-change="hold"]').click()
    assert page.locator('#slot-change-modal').is_visible()
    page.locator('#slot-change-reason').fill('가상 관찰 결과 검토')
    page.locator('#slot-change-pin').fill('incorrect')
    page.locator('#slot-change-form button[type="submit"]').click()
    assert '비밀번호' in page.locator('#slot-change-error').inner_text()
    assert page.locator('#slot-change-modal').is_visible()
    page.locator('#slot-change-pin').fill('2468')
    page.locator('#slot-change-form button[type="submit"]').click()
    order=page.locator('#order-list .order-card').first
    first=order.locator('[data-slot-row]').first
    assert first.locator('[data-slot-change="resume"]').count()==1
    assert first.locator('[data-execute]').count()==0
    first.locator('[data-slot-change="resume"]').click()
    page.locator('#slot-change-reason').fill('모의 상태 재평가')
    page.locator('#slot-change-pin').fill('2468')
    page.locator('#slot-change-form button[type="submit"]').click()
    order=page.locator('#order-list .order-card').first
    first=order.locator('[data-slot-row]').first
    assert first.locator('[data-slot-change="hold"]').count()==1
    second=order.locator('[data-slot-row]').nth(1)
    second.locator('[data-slot-change="postpone"]').click()
    page.locator('#slot-change-reason').fill('합성 시간 조정')
    page.locator('#slot-change-time').fill('2026-10-12T12:00')
    page.locator('#slot-change-pin').fill('2468')
    page.locator('#slot-change-form button[type="submit"]').click()
    order=page.locator('#order-list .order-card').first
    assert '최초 예정' in order.locator('[data-slot-row]').nth(1).inner_text()
    assert '연기된 예정' in order.locator('[data-slot-row]').nth(1).inner_text()
    third=order.locator('[data-slot-row]').nth(2)
    third.locator('[data-slot-change="cancel"]').click()
    page.locator('#slot-change-reason').fill('가상 시나리오 중단')
    page.locator('#slot-change-pin').fill('2468')
    page.locator('#slot-change-form button[type="submit"]').click()
    order=page.locator('#order-list .order-card').first
    third=order.locator('[data-slot-row]').nth(2)
    assert '취소' in third.inner_text()
    assert third.locator('[data-slot-change]').count()==0
    order.locator('[data-view]').click()
    assert 'slot_postponed' in order.inner_text()
    assert 'slot_cancelled' in order.inner_text()
    raw=page.evaluate("localStorage.getItem('nursing-order-demo-v02')")
    assert '"schema":2' in raw and '"rescheduledAt":' in raw and '"slot_cancelled"' in raw
    assert '연기 이력 있음' in page.locator('#case-order-sheet').text_content()
    page.locator('[data-patient="P-B102"]').click()
    assert '연기된 예정' not in page.locator('#order-list').inner_text()
    newPage=browser.new_page(viewport={'width':1380,'height':1040},locale='ko-KR',timezone_id='Asia/Seoul')
    newPage.on('pageerror',lambda e:errors.append(str(e)))
    init(newPage,raw);newPage.locator('#tab-status').click()
    assert '연기된 예정' in newPage.locator('#order-list').inner_text()
    assert '취소' in newPage.locator('#order-list').inner_text()
    assert not errors,errors
    print('SLOT STATUS BROWSER PASS: hold/resume/postpone/cancel, PIN gate, histories, Kardex, isolated patients, schema 2 roundtrip, errors=0')
    browser.close()
