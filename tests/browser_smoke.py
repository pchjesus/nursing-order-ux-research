from playwright.sync_api import sync_playwright
from pathlib import Path
root=Path(__file__).parents[1]/'app'
html=(root/'index.html').read_text()
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page(viewport={'width':1440,'height':900}); errors=[]
 page.on('pageerror',lambda err:errors.append(str(err)))
 # Chromium policy disallows opening localhost/file URLs here; use a synthetic about:blank document for interaction tests.
 page.set_content(html,wait_until='domcontentloaded')
 page.add_style_tag(content=(root/'styles.css').read_text())
 page.evaluate("""() => {const cache={}; Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem(k){return cache[k]??null},setItem(k,v){cache[k]=String(v)},removeItem(k){delete cache[k]}}})}""")
 for file in ['fixtures.js','domain.js','app.js']:
  page.add_script_tag(content=(root/file).read_text())
 page.evaluate('window.dispatchEvent(new Event("DOMContentLoaded"))')
 page.wait_for_timeout(300)
 print('TITLE',page.title())
 print('PATIENT',page.locator('#patient-name').inner_text())
 print('CATALOG RESULTS',page.locator('#result-count').inner_text())
 assert page.locator('[data-patient]').count()==4
 assert page.locator('[data-item]').count()==38
 page.locator('#query').fill('드레싱')
 assert page.locator('[data-item]').count()>=4
 page.locator('[data-item="SIM-ACT-0053"]').click()
 assert '멸균 창상 드레싱' in page.locator('#selected-item').inner_text()
 page.locator('#save-draft').click()
 assert '로그인' in page.locator('#flash').inner_text()
 page.locator('#account').select_option('N-D01')
 page.locator('#password').fill('2468');page.locator('#login').click()
 assert '김하늘' in page.locator('#session-label').inner_text()
 page.locator('#save-draft').click()
 assert '임시저장' in page.locator('#flash').inner_text()
 assert page.locator('#tab-status').get_attribute('aria-pressed')=='true'
 assert page.locator('.order-card').count()>=5
 draft=page.locator('.order-card').filter(has=page.locator('.badge.draft')).first
 draft.locator('[data-confirm]').click()
 assert page.locator('#confirm-modal').is_visible()
 page.locator('#confirm-pin').fill('wrong');page.get_by_role('button',name='재인증 후 가상 확정').click()
 assert page.locator('#confirm-error').is_visible()
 assert page.locator('#confirm-modal').is_visible()
 page.locator('#confirm-pin').fill('2468');page.get_by_role('button',name='재인증 후 가상 확정').click()
 assert not page.locator('#confirm-modal').is_visible()
 assert '확정' in page.locator('#flash').inner_text()
 first=page.locator('.order-card').first
 assert '멸균 창상' in first.inner_text() and '김하늘' in first.inner_text()
 first.locator('[data-execute]').click()
 first=page.locator('.order-card').first
 assert '수행 1건' in first.inner_text()
 first.locator('[data-view]').click()
 assert first.locator('details').is_visible()
 first.locator('[data-note-for]').last.fill('모의 기록 테스트')
 first.locator('[data-record]').last.click()
 first=page.locator('.order-card').first
 assert '기록 1건' in first.inner_text()
 page.locator('[data-patient="P-B102"]').click()
 assert page.locator('#patient-name').inner_text()=='가상 환자 B'
 assert '멸균 창상' not in page.locator('#order-list').inner_text()
 raw=page.evaluate('localStorage.getItem(NursingDomain.STORAGE_KEY)')
 assert '모의 기록 테스트' in raw
 page.screenshot(path=str(root.parent/'docs'/'ui-test.png'),full_page=True)
 print('BROWSER INTERACTION PASS: search, context, login, draft, wrong/correct confirmation, execution, record, local state, patient isolation')
 print('PAGE ERRORS',errors)
 assert not errors
 browser.close()
