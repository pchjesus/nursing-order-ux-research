"""Chromium DOM-injection smoke test for product representative labels and category filtering."""
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
APP=ROOT/'app'
SCRIPTS=['fixtures.js','activity-details.js','case-context.js','domain.js','order-sheet-model.js','app.js']

def init(page, stored=None):
    page.set_content((APP/'index.html').read_text(encoding='utf-8'))
    page.add_style_tag(content=(APP/'styles.css').read_text(encoding='utf-8'))
    page.evaluate("""(saved)=>{
      const db={};if(saved!==null)db['nursing-order-demo-v02']=saved;
      Object.defineProperty(window,'localStorage',{configurable:true,value:{
        getItem:k=>db[k]??null,setItem:(k,v)=>{db[k]=String(v)},removeItem:k=>{delete db[k]}}});
    }""",stored)
    for name in SCRIPTS:page.add_script_tag(content=(APP/name).read_text(encoding='utf-8'))
    page.evaluate("window.dispatchEvent(new Event('DOMContentLoaded'))")

with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    page=browser.new_page(viewport={'width':1440,'height':1100},locale='ko-KR')
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    init(page)
    assert 'v0.2.5' in page.title()
    page.locator('#query').fill('듀오덤')
    page.locator('[data-item="SIM-ACT-0053"]').click()
    # Category list is scoped to the chosen ACT: no infusion categories for dressings.
    cats=page.locator('#detail-product-category option').all_text_contents()
    assert any('하이드로콜로이드' in x for x in cats),cats
    assert all('수액세트' not in x for x in cats),cats
    assert '듀오덤' in page.locator('#detail-product').inner_text()
    page.locator('#detail-product-category').select_option('dressing-hydro')
    assert page.locator('#detail-product option[value="SIM-PRD-001"]').count()==1
    assert page.locator('#detail-product option[value="SIM-PRD-003"]').count()==0
    page.locator('#detail-product').select_option('SIM-PRD-001')
    # Changing category must clear a now-ineligible choice, never silently save previous material.
    page.locator('#detail-product-category').select_option('dressing-film')
    assert page.locator('#detail-product').input_value()==''
    assert page.locator('#detail-product option[value="SIM-PRD-001"]').count()==0
    assert page.locator('#detail-product option[value="SIM-PRD-003"]').count()==1
    assert '비지블 드레싱' in page.locator('#detail-product').inner_text()
    page.locator('#detail-product-category').select_option('dressing-hydro')
    page.locator('#detail-product').select_option('SIM-PRD-001')
    page.screenshot(path=str(ROOT/'docs'/'ui-representative-v0.2.4.png'),full_page=True)
    page.locator('#account').select_option('N-D01');page.locator('#password').fill('2468');page.locator('#login').click()
    page.locator('#detail-site').select_option('수술부위')
    page.locator('#detail-purpose').select_option('창상 보호')
    page.locator('#save-draft').click()
    assert '듀오덤 · 얇은형' in page.locator('#order-list').inner_text()
    saved=page.evaluate("localStorage.getItem('nursing-order-demo-v02')")
    assert 'SIM-PRD-001' in saved
    page2=browser.new_page(viewport={'width':1300,'height':950},locale='ko-KR');page2.on('pageerror',lambda e:errors.append(str(e)))
    init(page2,saved);page2.locator('#tab-status').click()
    assert '듀오덤 · 얇은형' in page2.locator('#order-list').inner_text()
    assert '듀오덤' in page2.locator('#case-order-sheet').text_content()
    # New category ID never stored in v0.2 schema, only original selected productId.
    assert 'dressing-hydro' not in saved
    # Infusion category is different from dressing and must keep infusion/pump distinction.
    page.locator('#tab-search').click();page.locator('#query').fill('도지 플로우')
    assert page.locator('[data-item="SIM-ACT-0041"]').count()==1
    page.locator('[data-item="SIM-ACT-0041"]').click()
    page.locator('#detail-method').select_option('도지플로우(유량조절기형)')
    assert page.locator('#detail-product-category option[value="infusion-flow"]').count()==1
    assert page.locator('#detail-product option[value="SIM-GEN-002"]').count()==1
    assert page.locator('#detail-product option[value="SIM-PRD-006"]').count()==0
    assert not errors,errors
    print('REPRESENTATIVE BROWSER PASS: categories, scoped product names, category change clears invalid selection, save/reload, infusion mode, errors=0')
    browser.close()
