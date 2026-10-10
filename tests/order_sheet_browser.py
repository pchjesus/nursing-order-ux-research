"""Chromium DOM interactions with injected local HTML/JS (localhost forbidden in this test environment)."""
from pathlib import Path
import re
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
APP=ROOT/'app'

with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
        page=browser.new_page(viewport={'width':1460,'height':1000},locale='ko-KR')
        errors=[]
        page.on('pageerror', lambda e:errors.append(str(e)))
        page.goto('about:blank')
        page.evaluate("""() => { const db=new Map(); Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>db.has(k)?db.get(k):null,setItem:(k,v)=>db.set(k,String(v)),removeItem:k=>db.delete(k)}}); }""")
        html=(APP/'index.html').read_text(encoding='utf-8')
        html=re.sub(r'<script src="[^"]+"></script>', '', html)
        html=html.replace('<link rel="stylesheet" href="styles.css">','')
        page.set_content(html)
        page.add_style_tag(content=(APP/'styles.css').read_text(encoding='utf-8'))
        for file in ['fixtures.js','activity-details.js','case-context.js','domain.js','order-sheet-model.js','app.js']:
            page.add_script_tag(content=(APP/file).read_text(encoding='utf-8'))
        page.evaluate("window.dispatchEvent(new Event('DOMContentLoaded'))")
        assert page.title()=='Nursing Order UX Lab · v0.2.3'
        assert page.locator('#patient-name').inner_text()=='가상 환자 A'
        page.locator('#tab-status').click()
        assert page.locator('#case-sheet-panel').is_visible()
        assert not page.locator('#case-sheet-panel').get_attribute('open')
        page.locator('#case-sheet-panel > summary').click()
        assert '복부 수술 후' in page.locator('#case-summary').inner_text()
        assert page.locator('#case-order-sheet tbody tr').count()==4
        assert '수행' in page.locator('#case-order-sheet').inner_text()
        assert '외부' not in page.locator('#case-order-sheet').inner_text() # no cross app linkage
        # Other patient must not carry over the first patient's order sheet.
        page.locator('[data-patient="P-B102"]').click()
        assert '호흡기 증상' in page.locator('#case-summary').inner_text()
        assert page.locator('#case-order-sheet tbody tr').count()==4
        assert 'P-A101' not in page.locator('#case-order-sheet').inner_text()
        page.locator('[data-patient="P-A101"]').click()
        # Create nursing order through existing pathway.
        page.locator('#account').select_option('N-D01')
        page.locator('#password').fill('2468')
        page.locator('#login').click()
        page.locator('#tab-search').click()
        page.locator('#query').fill('SIM-ACT-0053')
        assert page.locator('.catalog-item').count()==1
        page.locator('.catalog-item').click()
        page.locator('#order-note').fill('새로운 가상 시나리오 메모')
        page.locator('#save-draft').click()
        assert page.locator('#case-order-sheet tbody tr').count()==5
        assert '추가 모의 처방' in page.locator('#case-order-sheet').inner_text()
        page.locator('[data-confirm]').first.click()
        page.locator('#confirm-pin').fill('0000')
        page.locator('#confirm-form [type="submit"]').click()
        assert '비밀번호가 일치하지 않습니다' in page.locator('#confirm-error').inner_text()
        page.locator('#confirm-pin').fill('2468')
        page.locator('#confirm-form [type="submit"]').click()
        assert page.locator('#case-order-sheet tbody tr').count()==5
        assert '가상 확정' in page.locator('#case-order-sheet').inner_text()
        # verify mock localStorage writes and saved code survives a fresh in-memory state load.
        stored=page.evaluate("window.localStorage.getItem('nursing-order-demo-v02')")
        assert stored and 'SIM-ACT-0053' in stored
        assert '가상 확정' in page.locator('#case-order-sheet').inner_text()
        screenshot=ROOT/'docs'/'ui-v0.2.3.png'
        page.screenshot(path=str(screenshot),full_page=True)
        assert not errors, f'JavaScript errors: {errors}'
        print('PASS: injected Chromium patient switching, Kardex, read-only sheet, login, save, reauth, mock localStorage, no JS exceptions')
        print('SCREENSHOT:',screenshot)
        browser.close()
