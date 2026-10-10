"""Chromium injected DOM: selectable details, brands, infusion modes, confirmation, reload snapshot. No live clinical software."""
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];APP=ROOT/'app'
SCRIPTS=['fixtures.js','activity-details.js','case-context.js','domain.js','order-sheet-model.js','app.js']

def init(page,saved=None):
    page.set_content((APP/'index.html').read_text(encoding='utf-8'))
    page.add_style_tag(content=(APP/'styles.css').read_text(encoding='utf-8'))
    page.evaluate("""(saved) => {
      const db={};if(saved!==null)db['nursing-order-demo-v02']=saved;
      Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem(k){return db[k]??null},setItem(k,v){db[k]=String(v)},removeItem(k){delete db[k]}}});
    }""",saved)
    for file in SCRIPTS:page.add_script_tag(content=(APP/file).read_text(encoding='utf-8'))
    page.evaluate("window.dispatchEvent(new Event('DOMContentLoaded'))")

with sync_playwright() as playwright:
    browser=playwright.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    page=browser.new_page(viewport={'width':1440,'height':1000},locale='ko-KR');errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    init(page)
    assert page.locator('[data-item]').count()==42
    page.locator('#query').fill('듀오덤')
    assert page.locator('[data-item="SIM-ACT-0053"]').count()==1
    page.locator('[data-item="SIM-ACT-0053"]').click()
    assert page.locator('#detail-site option').count()>2
    page.locator('#detail-site').select_option('수술부위')
    page.locator('#detail-purpose').select_option('창상 보호')
    page.locator('#detail-frequency').select_option('매 근무조')
    page.locator('#detail-method').select_option('멸균 드레싱 관련 관리')
    page.locator('#detail-product').select_option('SIM-PRD-001')
    assert '제조사 자료 보기' in page.locator('#detail-product-info').inner_text()
    page.screenshot(path=str(ROOT/'docs'/'ui-detail-form-v0.2.3.png'),full_page=True)
    page.locator('#account').select_option('N-D01');page.locator('#password').fill('2468');page.locator('#login').click()
    page.locator('#save-draft').click()
    assert page.locator('#tab-status').get_attribute('aria-pressed')=='true'
    assert '듀오덤 DuoDERM Extra Thin' in page.locator('#order-list').inner_text()
    assert '수술부위' in page.locator('#case-order-sheet').text_content()
    page.locator('[data-confirm]').first.click();page.locator('#confirm-pin').fill('2468');page.get_by_role('button',name='재인증 후 가상 확정').click()
    assert '가상 확정' in page.locator('#case-order-sheet').text_content()
    # New infusion line activity with Dosi Flow-style generic option, do not conflate with pump.
    page.locator('#tab-search').click();page.locator('#query').fill('수액 주입 속도 확인')
    page.locator('[data-item="SIM-ACT-0041"]').click()
    page.locator('#detail-site').select_option('수액 주입라인');page.locator('#detail-purpose').select_option('주입속도 확인')
    page.locator('#detail-method').select_option('도지플로우(유량조절기형)')
    assert page.locator('#detail-product option[value="SIM-PRD-006"]').count()==0
    page.locator('#detail-product').select_option('SIM-GEN-002')
    page.locator('#save-draft').click()
    assert '도지플로우' in page.locator('#order-list').inner_text()
    # New pump activity only has pump set candidates.
    page.locator('#tab-search').click();page.locator('#query').fill('수액 주입펌프 상태 확인')
    page.locator('[data-item="SIM-ACT-0042"]').click()
    assert page.locator('#detail-method option').count()==3
    assert page.locator('#detail-product option[value="SIM-GEN-002"]').count()==0
    page.locator('#detail-method').select_option('인퓨전 펌프 전용세트')
    page.locator('#detail-product').select_option('SIM-PRD-006')
    page.locator('#save-draft').click()
    assert 'Infusomat Space Line PVC' in page.locator('#order-list').inner_text()
    stored=page.evaluate("localStorage.getItem('nursing-order-demo-v02')")
    assert stored.count('productId')>=3
    # Patient switching never carries product details to another patient's order list.
    page.locator('[data-patient="P-B102"]').click()
    assert 'DuoDERM' not in page.locator('#order-list').inner_text()
    page.screenshot(path=str(ROOT/'docs'/'ui-v0.2.3.png'),full_page=True)
    # Simulated reload restores unmodified schema=2 and all details.
    page2=browser.new_page(viewport={'width':1300,'height':850},locale='ko-KR');page2.on('pageerror',lambda e:errors.append(str(e)))
    init(page2,stored)
    page2.locator('#tab-status').click()
    assert '듀오덤 DuoDERM Extra Thin' in page2.locator('#order-list').inner_text()
    assert 'Infusomat Space Line PVC' in page2.locator('#order-list').inner_text()
    assert '저장 데이터 문제가 있어' not in page2.locator('#flash').inner_text()
    assert not errors,errors
    print('PASS: 42 activities, DuoDERM, flow-regulator vs pump, product/method filtering, save-confirm, patient isolation, storage JSON reload, JS errors=0')
    browser.close()
