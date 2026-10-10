from playwright.sync_api import sync_playwright
from pathlib import Path
root=Path(__file__).parents[1]/'app'
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page(viewport={'width':1350,'height':900})
 errors=[]
 page.on('pageerror',lambda error:errors.append(str(error)))
 page.set_content((root/'index.html').read_text(),wait_until='domcontentloaded')
 page.add_style_tag(content=(root/'styles.css').read_text())
 page.evaluate("""() => {const values={};Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem(k){return values[k]??null},setItem(k,v){values[k]=String(v)},removeItem(k){delete values[k]}}})}""")
 for f in ['fixtures.js','case-context.js','domain.js','order-sheet-model.js','app.js']:
  page.add_script_tag(content=(root/f).read_text())
 page.evaluate('window.dispatchEvent(new Event("DOMContentLoaded"))')
 page.locator('#tab-status').click()
 assert not page.locator('#group-by-code').is_checked()
 assert page.locator('details.order-group').count()==0
 baseline=page.locator('article.order-card').count()
 assert baseline==4
 page.locator('#shift').select_option('D')
 page.locator('#account').select_option('N-D01')
 page.locator('#password').fill('2468')
 page.locator('#login').click()
 page.locator('#tab-search').click()
 page.locator('#query').fill('멸균 창상 드레싱')
 page.locator('[data-item="SIM-ACT-0053"]').click()
 page.locator('#save-draft').click()
 page.locator('#group-by-code').check()
 group=page.locator('details.order-group').filter(has_text='SIM-ACT-0053')
 assert group.count()==1
 assert group.is_visible()  # collapsed summary remains visible
 assert '개별 처방 2건' in group.inner_text()
 group.locator(':scope > summary').click()
 assert group.get_attribute('open') is not None
 assert group.locator('article.order-card').count()==2
 assert group.locator('.order-card').filter(has_text='임시저장').count()==1
 draft=group.locator('.order-card').filter(has_text='임시저장')
 draft.locator('[data-confirm]').click()
 page.locator('#confirm-pin').fill('2468')
 page.get_by_role('button',name='재인증 후 가상 확정').click()
 assert group.get_attribute('open') is not None
 assert '확정 2건' in group.inner_text()
 assert group.locator('article.order-card').count()==2
 group.locator('article.order-card').first.locator('[data-view]').click()
 assert group.locator('details.order-history[open]').count()==1
 page.locator('#status-filter').select_option('draft')
 assert group.count()==0
 assert '선택한 조건의 가상 처방이 없습니다' in page.locator('#order-list').inner_text()
 page.locator('#status-filter').select_option('')
 page.locator('#group-by-code').uncheck()
 assert page.locator('details.order-group').count()==0
 assert page.locator('article.order-card').count()==5
 page.locator('[data-patient="P-B102"]').click()
 assert page.locator('article.order-card').count()==4
 assert not errors,errors
 print('BROWSER GROUP PASS: opt-in, code grouping, individual history, confirmation preserves open group, filter, ungrouped regression, patient isolation; errors=0')
 browser.close()
