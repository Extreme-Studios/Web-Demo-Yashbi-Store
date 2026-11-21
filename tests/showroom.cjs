const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const BASE='http://127.0.0.1:4173',ROOT=path.resolve(__dirname,'..'),OUT=path.resolve(ROOT,'../outputs');
fs.mkdirSync(OUT,{recursive:true});
const checks=[],errors=[],external=[];let browser;
const check=(name,value)=>{assert.ok(value,name);checks.push(name);};
const debug=p=>p.evaluate(()=>window.YASHBI_3D.engine.getDebugState());
async function settled(p){await p.waitForFunction(()=>{const e=window.YASHBI_3D?.engine;if(!e?.ready)return false;return e.camera.position.distanceTo(e.cameraTarget)<.025&&[...e.entries.values()].filter(x=>x.targetVisible).every(x=>x.loaded&&x.group.position.distanceTo(x.targetPosition)<.1&&Math.abs(x.material.opacity-x.targetOpacity)<.02);});}
function watch(p){p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});p.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});p.on('request',r=>{if(!r.url().startsWith(BASE)&&/^https?:/.test(r.url()))external.push(r.url());});}
async function context(options){const c=await browser.newContext(options);await c.route(/https?:\/\/(script\.google\.com|script\.googleusercontent\.com)\//,r=>r.abort());return c;}
async function inspectClick(p){await settled(p);const id=(await debug(p)).selectedId;const point=await p.evaluate(id=>window.YASHBI_3D.engine.getScreenPosition(id),id);check('active textured plane has projected click position',point.visible&&point.x>0&&point.y>0);await p.mouse.click(point.x,point.y);await p.waitForFunction(()=>window.YASHBI_3D.engine.mode==='focus');await settled(p);}
async function close(p){await p.keyboard.press('Escape');}
async function mobileFit(p,label){
 await settled(p);
 const result=await p.evaluate(()=>{
  const e=window.YASHBI_3D.engine,entry=e.entries.get(e.selectedProduct.id),stage=e.stageBounds;
  e.scene.updateMatrixWorld(true);e.camera.updateMatrixWorld(true);
  const points=[[-.5,-.5],[-.5,.5],[.5,-.5],[.5,.5]].map(([x,y])=>{
   const v=entry.art.localToWorld(e.camera.position.clone().set(x,y,0)).project(e.camera);
   return{x:(v.x+1)*innerWidth/2,y:(1-v.y)*innerHeight/2};
  });
  const within=points.every(p=>p.x>=stage.left&&p.x<=stage.right&&p.y>=stage.top&&p.y<=stage.bottom);
  const fullRect={left:Math.min(...points.map(p=>p.x)),right:Math.max(...points.map(p=>p.x)),top:Math.min(...points.map(p=>p.y)),bottom:Math.max(...points.map(p=>p.y))};
  const intersects=Math.min(fullRect.right,stage.right)>Math.max(fullRect.left,stage.left)&&Math.min(fullRect.bottom,stage.bottom)>Math.max(fullRect.top,stage.top);
  return{stage,points,within,detail:e.garmentView==='detail',intersects};
 });
  check(`${label} complete product fits clear stage`,result.within || (result.detail && result.intersects));
}
async function checkout(p,total,label){
 await p.locator('#cartOpen').click();await p.locator('#checkoutOpen').click();const form=p.locator('#checkoutForm');
 for(const [key,value] of Object.entries({name:'Pembeli WebGL Preview',phone:'081234567890',email:'webgl@example.invalid',address:'Alamat Simulasi 3D 10',city:'Surabaya',postal:'60271'}))await form.locator(`[name=${key}]`).fill(value);
 await form.locator('[name=courier]').selectOption({index:1});check(`${label} checkout IDR subtotal/shipping`,(await p.locator('#checkoutTotal').innerText()).replace(/[^\d]/g,'')===String(total));
 await form.locator('[value="Transfer BCA"]').check();check(`${label} BCA selectable`,await form.locator('[value="Transfer BCA"]').isChecked());await form.locator('[value=QRIS]').check();
 await p.locator('#proofInput').setInputFiles({name:'invalid.txt',mimeType:'text/plain',buffer:Buffer.from('not proof')});check(`${label} invalid proof rejected`,await p.locator('#proofInput').evaluate(el=>el.files.length===0));
 await p.locator('#proofInput').setInputFiles(path.join(ROOT,'assets/images/cutout/gw-001.png'));await p.locator('#proofImage').waitFor({state:'visible'});await form.locator('[name=consent]').check();await p.locator('#checkoutSubmit').click();await p.locator('#purchaseDialog[open]').waitFor();
 const id=await p.locator('#purchaseOrderId').innerText();check(`${label} local purchase saved`,/^PREVIEW-\d{6}-\d{3}$/.test(id));check(`${label} cart clears after purchase`,await p.locator('#cartCount').innerText()==='0');
 const wait=p.waitForEvent('download');await p.locator('#downloadInvoice').click();const download=await wait;const filename=path.join(OUT,`3d-${label}-invoice.pdf`);await download.saveAs(filename);const pdf=fs.readFileSync(filename).toString('ascii');check(`${label} actual PDF contains selected product and total`,pdf.startsWith('%PDF-')&&pdf.includes(id)&&pdf.includes('GW-001')&&pdf.includes('WebGL Preview')&&pdf.includes('SIMULATED TOTAL'));
 await p.screenshot({path:path.join(OUT,`3d-${label}-purchase.png`)});await close(p);return id;
}
(async()=>{
 const status=await fetch(`${BASE}/__preview/status`).then(r=>r.json());assert.equal(status.simulation,true);
 browser=await chromium.launch({channel:'chrome',headless:true});const c=await context({viewport:{width:1440,height:1000},acceptDownloads:true});const p=await c.newPage();watch(p);await p.goto(BASE,{waitUntil:'networkidle'});await settled(p);await p.waitForFunction(()=>{const e=window.YASHBI_3D.engine;return e.visibleProducts.every(p=>e.entries.get(p.id).loaded);});
 const initial=await debug(p);check('real Three.js retains30 products and opens an isolated8-gown collection',initial.engine==='three.js'&&initial.webgl&&initial.productCount===30&&initial.filteredCount===8&&initial.category==='Gaun Wanita'&&initial.products.filter(x=>x.visible).every(x=>x.id.startsWith('GW-')));
 check('other collections are not eagerly decoded',initial.products.filter(x=>x.loaded).length===8);
 check('three separate primary collections replace mixed all-products showroom',await p.locator('[data-primary-collection]').count()===3&&await p.locator('[data-primary-collection=all]').count()===0);
 check('perspective camera, ACES, AA, physical shadow map and fog',await p.evaluate(()=>{const e=window.YASHBI_3D.engine;return e.camera.isPerspectiveCamera&&e.renderer.toneMapping===4&&e.renderer.getContext().getContextAttributes().antialias&&e.renderer.shadowMap.enabled&&e.scene.fog.isFogExp2&&e.scene.fog.density===.035;}));
 check('ambient directional gallery spotlights exist',initial.scene.objects.AmbientLight===1&&initial.scene.objects.DirectionalLight>=1&&initial.scene.objects.SpotLight>=1);
 check('product alpha cutouts cast mapped3D shadows',initial.products.filter(x=>x.loaded).every(x=>x.castShadow&&x.alphaDepth));
 const pixels=await p.evaluate(()=>{const e=window.YASHBI_3D.engine;e.renderer.render(e.scene,e.camera);const gl=e.renderer.getContext(),bytes=new Uint8Array(64*64*4);gl.readPixels(Math.floor(gl.drawingBufferWidth*.45),Math.floor(gl.drawingBufferHeight*.45),64,64,gl.RGBA,gl.UNSIGNED_BYTE,bytes);let min=255,max=0;for(let i=0;i<bytes.length;i+=4){min=Math.min(min,bytes[i]);max=Math.max(max,bytes[i]);}return {min,max,calls:e.renderer.info.render.calls,triangles:e.renderer.info.render.triangles};});check('WebGL framebuffer contains rendered geometry',pixels.calls>10&&pixels.triangles>50&&pixels.max-pixels.min>12);
 check('legacy layouts and hangers removed from DOM',await p.locator('.rack-hanger,.rack-piece,.product-grid,.category-grid,.site-header,.cart-drawer').count()===0);
 await p.screenshot({path:path.join(OUT,'3d-showroom-desktop.png')});
 const before=initial.camera.position;await inspectClick(p);const focused=await debug(p);check('raycaster click triggers3D camera dolly',Math.hypot(...before.map((v,i)=>v-focused.camera.position[i]))>.2&&focused.mode==='focus');
 check('inspection fades background objects',await p.evaluate(()=>{const e=window.YASHBI_3D.engine,s=e.entries.get(e.selectedProduct.id);return [...e.entries.values()].filter(x=>x.group.visible&&x!==s).every(x=>x.material.opacity<s.material.opacity*.8);}));
 await p.screenshot({path:path.join(OUT,'3d-clothing-focus.png')});await p.locator('[data-hud-color=Champagne]').click();await p.waitForFunction(()=>window.YASHBI_3D.engine.entries.get('GW-001').currentColor==='Champagne');await p.locator('[data-hud-size=M]').click();await p.locator('#hudAdd').click();check('HUD variant and size add correct cart line',await p.evaluate(()=>{const x=window.YASHBI_3D.commerce.state.cart[0];return x.productId==='GW-001'&&x.color==='Champagne'&&x.size==='M';}));
 await p.locator('#overviewButton').click();await p.locator('#showroomCanvas').focus();await p.keyboard.press('ArrowRight');check('one keyboard arrow advances one product',(await debug(p)).selectedId==='GW-002');await p.keyboard.press('ArrowLeft');check('returning product keeps mesh and HUD color synchronized',await p.locator('#hudColorName').innerText()==='Champagne'&&(await debug(p)).products.find(x=>x.id==='GW-001').color==='Champagne');
 await p.mouse.move(570,500);await p.mouse.down();await p.mouse.move(440,500,{steps:10});await p.mouse.up();check('native drag moves runway selection',(await debug(p)).selectedId==='GW-002');await p.locator('#showroomCanvas').hover({position:{x:550,y:350}});await p.mouse.wheel(0,110);check('wheel moves runway selection',(await debug(p)).selectedId==='GW-003');
 await p.locator('[data-primary-collection="Jas Pria"]').click();check('category switch immediately removes every gown from scene',(await debug(p)).products.filter(x=>x.visible).every(x=>x.id.startsWith('JP-')));await settled(p);check('suit category has8 objects',(await debug(p)).filteredCount===8);await p.evaluate(()=>window.YASHBI_3D.engine.select('JP-004'));await settled(p);await p.screenshot({path:path.join(OUT,'3d-suits-desktop.png')});
 await p.locator('[data-primary-collection="Sepatu"]').click();await p.locator('[data-shoe-filter="Sepatu Wanita"]').click();await settled(p);const shoe=await debug(p);check('shoe gallery uses actual3D pedestal grid',shoe.mode==='shelf'&&shoe.filteredCount===7&&shoe.products.filter(x=>x.visible&&x.pedestal).length===7);
 const positions=shoe.products.filter(x=>x.visible).map(x=>x.target);check('shoe positions form5columns and2rows',new Set(positions.map(x=>x[0].toFixed(2))).size===5&&new Set(positions.map(x=>x[1].toFixed(2))).size===2);
 await p.locator('[data-primary-collection="Sepatu"]').click();await settled(p);const allShoes=await debug(p);check('combined gallery preserves14 shoes and10 slots per page',allShoes.filteredCount===14&&allShoes.pageCount===2&&allShoes.products.filter(x=>x.visible&&x.pedestal).length===10);
 await p.screenshot({path:path.join(OUT,'3d-shoe-gallery.png')});
 const otherShoe=await p.evaluate(()=>window.YASHBI_3D.engine.getScreenPosition('SW-002'));await p.mouse.click(otherShoe.x,otherShoe.y);await p.waitForFunction(()=>window.YASHBI_3D.engine.mode==='focus'&&window.YASHBI_3D.engine.selectedProduct.id==='SW-002');check('clicking any shoe flies directly into inspection',true);await p.locator('#overviewButton').click();await p.evaluate(()=>window.YASHBI_3D.engine.select('SP-007'));await settled(p);const lastPage=await debug(p);check('remaining4 shoes accessible on second3Dpage',lastPage.page===1&&lastPage.products.filter(x=>x.visible&&x.pedestal&&x.opacity>.9).length===4);await p.evaluate(()=>window.YASHBI_3D.engine.select('SW-001'));await settled(p);
 const point=await p.evaluate(()=>window.YASHBI_3D.engine.getScreenPosition('SW-001'));await p.mouse.move(point.x,point.y);await p.waitForTimeout(500);check('raycaster hover raises shoe over solid pedestal',await p.evaluate(()=>{const e=window.YASHBI_3D.engine.entries.get('SW-001');return e.art.position.y>e.height/2+.15;}));
 await inspectClick(p);await p.screenshot({path:path.join(OUT,'3d-shoe-focus.png')});const hud=await p.locator('.product-hud').boundingBox();check('desktop floating HUD fully fits viewport',hud.x>=0&&hud.y>=0&&hud.x+hud.width<=1440&&hud.y+hud.height<=1000);
 await p.locator('[data-hud-color=Nude]').click();await p.locator('[data-hud-size="38"]').click();await p.locator('#hudAdd').click();await p.locator('#overviewButton').click();
 await p.locator('#cartOpen').click();await p.locator('[data-quantity][data-delta="1"]').first().click();check('drawer quantity and IDR subtotal',await p.locator('#cartSubtotal').innerText().then(v=>v.replace(/[^\d]/g,'')==='2267000'));await close(p);
 const order=await checkout(p,2285000,'desktop');await p.locator('#historyOpen').click();check('new purchase record lists saved order',(await p.locator('#historyLines').innerText()).includes(order));await close(p);
 await p.locator('#trackOpen').click();await p.locator('#trackingForm [name=orderId]').fill(order);await p.locator('#trackingForm [name=phone]').fill('081111111111');await p.locator('#trackingSubmit').click();await p.waitForFunction(()=>document.querySelector('#trackingResult').textContent.includes('Order not found'));check('wrong WA cannot retrieve order',true);await p.locator('#trackingForm [name=phone]').fill('+6281234567890');await p.locator('#trackingSubmit').click();await p.waitForFunction(()=>document.querySelector('#trackingResult').textContent.includes('Simulasi'));check('matching WA retrieves order',true);await close(p);
 await p.locator('#catalogOpen').click();await p.locator('#catalogCategory').selectOption('all');check('new lookbook index contains all30 products',await p.locator('[data-catalog-product]').count()===30);await p.locator('#catalogSearch').fill('Serena');check('lookbook search works',await p.locator('[data-catalog-product]').count()===1);await p.locator('[data-catalog-product="GW-001"]').click();await p.locator('#lookbookDialog[open]').waitFor();check('full lookbook uses transparent product image',(await p.locator('#lookbookImage').getAttribute('src')).includes('/cutout/'));await close(p);
 check('global CTA exposes the stylist',await p.locator('#chatOpen').innerText()==='Yashbi Stylist');
 await p.locator('#chatOpen').click();check('three one-tap starters are visible',await p.locator('#stylistStarters button:visible').count()===3);await p.locator('[data-stylist-prompt=wedding]').click();await p.waitForFunction(()=>{const e=YASHBI_3D.engine;return e.mode==='focus'&&e.selectedProduct.id==='JP-001'&&e.garmentView==='full';});await settled(p);
 check('stylist leads with a full-suit camera focus and dismisses the dialog',await p.locator('#chatDialog').evaluate(el=>!el.open));
 await p.locator('#stylistLook [data-sku=SP-001]').click();await settled(p);check('look piece button crosses collections into the shoe camera', (await debug(p)).selectedId==='SP-001');
 await p.locator('#stylistContinue').click();check('chat transcript survives camera navigation', (await p.locator('#chatMessages').innerText()).includes('wedding'));
 const follow=p.waitForRequest(r=>r.url().endsWith('/api/chat')&&r.method()==='POST');await p.locator('#chatInput').fill('Show me the fabric detail.');await p.locator('#chatSend').click();const body=(await follow).postDataJSON();
 check('follow-up carries previous user and assistant turns',body.history.length===2&&body.history[0].content.includes('wedding')&&body.history[1].role==='assistant');
 await p.waitForFunction(()=>{const e=YASHBI_3D.engine;return e.mode==='focus'&&e.selectedProduct.id==='JP-001'&&e.garmentView==='detail';});await settled(p);
 check('stylist remembered menswear for the follow-up and moved into garment detail',await p.locator('#stylistLook [data-sku=JP-001]').getAttribute('aria-current')==='true');
 check('stylist does not change the cart',await p.locator('#cartCount').innerText()==='0');
 check('English is the default storefront language',await p.locator('html').getAttribute('lang')==='en');
 await p.locator('#stylistContinue').click();await p.locator('[data-stylist-prompt=evening]').click();
 await p.waitForFunction(()=>YASHBI_3D.engine.mode==='focus'&&YASHBI_3D.engine.selectedProduct.id.startsWith('GW-'));
 const eveningSku=(await debug(p)).selectedId;
 await p.locator('#stylistContinue').click();await p.locator('[data-stylist-prompt=fabric]').click();
 await p.waitForFunction(id=>YASHBI_3D.engine.mode==='focus'&&YASHBI_3D.engine.garmentView==='detail'&&YASHBI_3D.engine.selectedProduct.id===id,eveningSku);
 check('evening and fabric starters drive the camera in one tap',true);
 await p.locator('#stylistContinue').click();await p.route('**/api/chat',route=>route.fulfill({status:429,headers:{'Retry-After':'17'},contentType:'application/json',body:'{}'}));
 await p.locator('[data-stylist-prompt=wedding]').click();await p.getByText('The stylist is busy. Try again in 17 seconds.').waitFor();
 await p.unroute('**/api/chat');const expected429=errors.findIndex(value=>value.startsWith('429 '));if(expected429>=0)errors.splice(expected429,1);
 const expectedConsoleError=errors.findIndex(value=>value.includes('429 (Too Many Requests)'));if(expectedConsoleError>=0)errors.splice(expectedConsoleError,1);
 await close(p);
 check('desktop no horizontal overflow',await p.evaluate(()=>document.documentElement.scrollWidth===innerWidth));
 const mc=await context({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:3,acceptDownloads:true});const m=await mc.newPage();watch(m);await m.goto(BASE,{waitUntil:'networkidle'});await settled(m);await m.screenshot({path:path.join(OUT,'3d-showroom-mobile.png')});check('mobile WebGL renderer and viewport fit',(await debug(m)).webgl&&await m.evaluate(()=>document.documentElement.scrollWidth===390));
 check('high-DPR phones cap raster cost and use1024 real shadows',await m.evaluate(()=>{const e=window.YASHBI_3D.engine;return e.renderer.getPixelRatio()===1.5&&e.keyLight.shadow.mapSize.x===1024;}));await mobileFit(m,'390x844 gown overview');
 const cdp=await mc.newCDPSession(m);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:260,y:360}]});for(const x of [230,200,160,120])await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:360}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});check('native touch swipe selects next product',(await debug(m)).selectedId==='GW-002');
 await m.locator('[data-category="Gaun Wanita"]').tap();await settled(m);check('first HUD tap after native swipe changes category',(await debug(m)).category==='Gaun Wanita'&&(await debug(m)).selectedId==='GW-001');await m.locator('#hudInspect').tap();await settled(m);await m.locator('[data-hud-size=M]').tap();await m.locator('#hudAdd').tap();check('mobile add confirmation remains available inline',(await m.locator('#hudFeedback').innerText()).includes('added'));check('mobile confirmation never obscures cart action',await m.evaluate(()=>{const t=document.querySelector('#uiToast'),a=document.querySelector('#hudAdd');if(Number(getComputedStyle(t).opacity)<.05)return true;const x=t.getBoundingClientRect(),y=a.getBoundingClientRect();return x.right<=y.left||x.left>=y.right||x.bottom<=y.top||x.top>=y.bottom;}));await m.screenshot({path:path.join(OUT,'3d-clothing-mobile-focus.png')});await checkout(m,917000,'mobile');
 await m.locator('#helpOpen').tap();check('mobile tracking remains reachable',await m.locator('#helpTrack').isVisible());await m.locator('#helpTrack').tap();check('mobile tracking modal opens',await m.locator('#trackDialog').evaluate(el=>el.open));await close(m);
 await m.locator('[data-primary-collection="Sepatu"]').tap();await m.locator('[data-shoe-filter="Sepatu Pria"]').tap();await settled(m);check('mobile shoe pagination preserves7 products',(await debug(m)).filteredCount===7&&(await debug(m)).pageCount===2);await m.screenshot({path:path.join(OUT,'3d-shoes-mobile.png')});
 for(const [width,height] of [[360,800],[412,915],[844,390]]){
  const compact=await context({viewport:{width,height},isMobile:true,hasTouch:true,deviceScaleFactor:3});const page=await compact.newPage();watch(page);await page.goto(BASE,{waitUntil:'networkidle'});
  for(const category of ['Gaun Wanita','Jas Pria','Sepatu']){
   await page.locator(`[data-primary-collection="${category}"]`).tap();await mobileFit(page,`${width}x${height} ${category} overview`);
   check(`${width}x${height} ${category} main touch targets44px`,await page.locator('[data-primary-collection],#hudInspect,#hudDetails,#cartOpen,#catalogOpen,#helpOpen').evaluateAll(nodes=>nodes.every(n=>{const r=n.getBoundingClientRect();return r.width>=44&&r.height>=44;})));
   await page.locator('#hudInspect').tap();await mobileFit(page,`${width}x${height} ${category} inspection`);
   await page.locator('#hudAdd').scrollIntoViewIfNeeded();const add=await page.locator('#hudAdd').boundingBox();check(`${width}x${height} ${category} cart action remains reachable`,add.y>=0&&add.y+add.height<=height);
   await page.locator('#overviewButton').tap();
  }
  check(`${width}x${height} has no horizontal overflow`,await page.evaluate(()=>document.documentElement.scrollWidth===innerWidth));await compact.close();
 }
 const framesBeforeLoss=await p.evaluate(()=>{
  const e=YASHBI_3D.engine;
  window.testContextLoss=e.renderer.getContext().getExtension('WEBGL_lose_context');
  if(!window.testContextLoss) throw Error('WEBGL_lose_context unavailable');
  window.testContextLoss.loseContext();
  return e.renderedFrames;
 });
 await p.waitForFunction(()=>YASHBI_3D.engine.contextLost&&document.querySelector('.showroom-status').dataset.state==='webgl');
 check('actual WebGL context loss raises a visible recovery notice',await p.locator('.showroom-status').isVisible());
 await p.evaluate(()=>window.testContextLoss.restoreContext());
 await p.waitForFunction(frames=>{
  const e=YASHBI_3D.engine;
  return !e.contextLost&&e.renderedFrames>frames&&document.querySelector('.showroom-status').hidden;
 },framesBeforeLoss);
 check('actual WebGL context restoration resumes rendering and clears the notice',!(await p.locator('#sceneStatus').textContent()));
 const broken=await p.evaluate(async()=>{document.querySelectorAll('img[loading=lazy]').forEach(x=>x.loading='eager');await Promise.all([...document.images].filter(x=>x.getAttribute('src')).map(x=>x.decode().catch(()=>{})));return [...document.images].filter(x=>x.getAttribute('src')&&!x.naturalWidth).map(x=>x.src);});check('zero broken HTML image elements',broken.length===0);
 check('zero console page or resource errors',errors.length===0);check('zero external or production requests',external.length===0);
 const manifest=JSON.parse(fs.readFileSync(path.join(ROOT,'assets/images/cutout/manifest.json'),'utf8'));check('all31 clothing photos preserve complete photographed people',Object.values(manifest.entries).filter(item=>/^assets\/images\/cutout\/(gw|jp)-/.test(item.file)).length===31&&Object.values(manifest.entries).filter(item=>/^assets\/images\/cutout\/(gw|jp)-/.test(item.file)).every(item=>item.subjectType==='photographed-subject'));
 check('all60 transparent source assets preserved',Object.keys(manifest.entries).length===60&&Object.values(manifest.entries).every(item=>crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT,item.file))).digest('hex')===item.outputSha256));
 const report={passed:checks.length,checks,errors,externalRequests:external,renderer:initial.renderer,threeRevision:initial.revision,viewports:['1440x1000','390x844','360x800','412x915','844x390'],scope:'Real WebGL scene and new DOM UI. Commerce, chat and PDF use isolated localhost simulation; live services untested.'};fs.writeFileSync(path.join(OUT,'3d-showroom-test-results.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
})().catch(error=>{console.error(error);console.error({checks,errors,external});process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();});
