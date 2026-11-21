import { productDescription } from './catalog-copy-en.js';
import { bindStylist } from './stylist.js';

const html = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const orderStatuses = new Map([
  ['menunggu verifikasi pembayaran', 'Awaiting Payment Verification'],
  ['checkout — belum bayar', 'Checkout — Payment Pending'],
  ['menunggu sinkronisasi', 'Awaiting Sync'],
  ['diproses', 'Processing'],
  ['ready — pickup otomatis', 'Ready for Automatic Pickup'],
  ['ready — meminta pickup', 'Requesting Pickup'],
  ['menunggu penjemputan', 'Awaiting Pickup'],
  ['selesai', 'Completed'],
  ['batal', 'Cancelled'],
]);

function orderStatusLabel(status) {
  const value = String(status ?? '').trim();
  const simulationPrefix = /^simulasi\s*[-–—]\s*/i;
  const label = value.replace(simulationPrefix, '');
  const translated = orderStatuses.get(label.toLowerCase()) ?? label;
  return simulationPrefix.test(value) ? 'Simulation — ' + translated : translated;
}

const icons = {
  bag:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14l1 14H4L5 7Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
  close:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>',
  arrow:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h16m-6-6 6 6-6 6"/></svg>',
  chat:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 11a9 9 0 0 1-9 9H4l-2 2V11a9 9 0 1 1 19 0Z"/><path d="M7 10h10M7 14h6"/></svg>'
};

const stylistAvatar = '<span class="stylist-avatar" aria-hidden="true">A</span>';
const stylistName = 'Alya — Yashbi Stylist';

export function createUI({products, money, imageForColor, commerce, onCategory=()=>{}, onSelect=()=>{}, onInspect=()=>{}, onColor=()=>{}, onOverview=()=>{}, onStep=()=>{}, onGarmentView=()=>{}, onStylistFocus=()=>false}) {
  const hud = document.getElementById('hudRoot');
  const overlay = document.getElementById('overlayRoot');
  const collections = [{value:'Gaun Wanita',label:'Dresses',count:8},{value:'Jas Pria',label:'Menswear',count:8},{value:'Sepatu',label:'Shoes',count:14}];
  const categories = ['all','Gaun Wanita','Jas Pria','Sepatu','Sepatu Wanita','Sepatu Pria'];
  const categoryLabel = value => ({all:'All categories','Gaun Wanita':'Dresses','Jas Pria':'Menswear',Sepatu:'Shoes','Sepatu Wanita':"Women's shoes",'Sepatu Pria':"Men's shoes"})[value] || value;
  let current = products[0];
  let color = current.colors[0];
  let size = '';
  let mode = 'overview';
  let garmentView = 'detail';
  let proof = null;
  let lookbookProduct = null;
  let lookbookColor = '';
  let lookbookSize = '';
  let lastOrder = null;
  let toastTimer;
  let activeCategory = 'Gaun Wanita';
  let checkoutBusy = false;
  let stylist;
  let state = commerce.state;
  const local = Boolean(window.YASHBI_LOCAL_PREVIEW);
  let layoutPending=false;
  function notifyLayout(){if(layoutPending)return;layoutPending=true;requestAnimationFrame(()=>{layoutPending=false;window.dispatchEvent(new Event('yashbi:layout'));});}
  hud.innerHTML = `
    <div class="showroom-ui" data-mode="overview">
      <header class="showroom-header">
        <a class="showroom-brand" href="/" aria-label="Yashbi Store home"><span>Y</span><div>Yashbi<small>STORE / INDONESIA</small></div></a>
        <nav class="showroom-nav" aria-label="Collections">${collections.map(c=>`<button type="button" data-category="${c.value}" data-primary-collection="${c.value}" aria-pressed="${c.value==='Gaun Wanita'}">${c.label}<span>${String(c.count).padStart(2,'0')}</span></button>`).join('')}</nav>
        <div class="showroom-header-actions"><button type="button" id="catalogOpen" class="quiet-action">Catalog</button><button type="button" id="historyOpen" class="quiet-action desktop-action">Order history</button><button type="button" id="trackOpen" class="quiet-action desktop-action">Track order</button><button type="button" id="helpOpen" class="quiet-action help-action" aria-label="Open store help">•••</button><button type="button" id="cartOpen" class="icon-action" aria-label="Open cart">${icons.bag}<span id="cartCount">0</span></button></div>
      </header>
      <section class="showroom-intro"><p class="micro-label">THE YASHBI ATELIER / COLLECTION 2026</p><h1>The art of<br><em>getting dressed.</em></h1><p class="intro-copy">Find a look for your occasion.</p></section>
      <div class="shoe-scene-heading"><p>A different perspective</p><span>Shoes / Yashbi Store</span><div class="shoe-subfilters" role="group" aria-label="Filter shoes"><button type="button" data-category="Sepatu" data-shoe-filter="Sepatu" aria-pressed="false">All shoes <span>14</span></button><button type="button" data-category="Sepatu Wanita" data-shoe-filter="Sepatu Wanita" aria-pressed="false">Women <span>07</span></button><button type="button" data-category="Sepatu Pria" data-shoe-filter="Sepatu Pria" aria-pressed="false">Men <span>07</span></button></div></div>
      <div class="showroom-status" role="status"><span class="status-orbit"></span><span id="sceneStatus">Preparing the showroom…</span></div>
      <button type="button" id="overviewButton" class="overview-return" hidden>← Back to collection <span>ESC</span></button>
      <aside class="product-hud" aria-label="Selected product">
        <div class="hud-topline"><span id="hudIndex">01 / 08</span><span id="hudCategory">Dresses</span></div>
        <h2 id="hudTitle"></h2><div class="hud-price"><strong id="hudPrice"></strong><span id="hudOriginal"></span></div>
        <section id="stylistLook" class="stylist-look" aria-label="Stylist recommendations" hidden><p class="stylist-look-title">Stylist’s look</p><div id="stylistLookItems" class="stylist-items"></div><details class="stylist-notes"><summary>Styling notes</summary><p id="stylistNotes" dir="auto"></p></details><button id="stylistContinue" type="button" class="stylist-continue">Continue with stylist</button></section>
        <p id="hudDescription" class="hud-description"></p>
        <div class="hud-options"><div class="garment-view-controls" role="group" aria-label="Garment inspection view" hidden><button type="button" data-garment-view="detail" aria-pressed="true">GARMENT DETAIL</button><button type="button" data-garment-view="full" aria-pressed="false">FULL VIEW</button></div><div class="hud-option-label"><span>COLOR</span><strong id="hudColorName"></strong><div id="hudColors" class="color-controls" role="group" aria-label="Product colors"></div></div><div class="hud-size-label"><span>SIZE</span><button type="button" data-info="size">Size guide ↗</button></div><div id="hudSizes" class="size-controls" role="group" aria-label="Product sizes"></div></div>
        <p id="hudFeedback" class="selection-feedback" aria-live="polite">Choose a size to complete your selection.</p>
        <div class="hud-actions"><button type="button" id="hudInspect" class="atelier-button">INSPECT PRODUCT ${icons.arrow}</button><button type="button" id="hudAdd" class="atelier-button atelier-button-dark" aria-label="Add product to cart">${icons.bag}<span>ADD TO CART</span></button></div>
        <button type="button" id="hudDetails" class="text-action">VIEW DETAILS <span>↗</span></button>
      </aside>
      <div class="scene-pagination"><span id="sceneIndex">01 / 08</span><div><button type="button" id="previousProduct" aria-label="Previous product">←</button><button type="button" id="nextProduct" aria-label="Next product">→</button></div><span class="pagination-hint">DRAG TO EXPLORE · CLICK TO INSPECT</span></div>
      <div class="showroom-footer"><span>YASHBI STORE <i>·</i> INDONESIA / IDR</span><div><button type="button" data-info="size">Size guide</button><button type="button" data-info="shipping">Shipping</button><button type="button" data-info="returns">Exchanges</button><button type="button" data-info="about">About us</button></div></div>
      ${local?'<div class="preview-badge">LOCAL PREVIEW · SIMULATION</div>':''}
      <button type="button" id="chatOpen" class="chat-launch" aria-label="Open Yashbi Stylist">${icons.chat}<span>Yashbi Stylist</span><span id="stylistUnread" class="stylist-unread" aria-hidden="true" hidden>1</span></button>
      <div id="stylistGreeting" class="stylist-greeting" hidden>
        <button id="stylistGreetingOpen" class="stylist-greeting-open" type="button" aria-controls="chatDialog">
          <span class="stylist-greeting-identity">${stylistAvatar}<strong>${stylistName}</strong></span>
          <span class="stylist-greeting-copy">Hi there! I'm Alya, your personal stylist. Looking for something special today? Tap here and I'll walk you through the showroom.</span>
        </button>
        <button id="stylistGreetingDismiss" class="stylist-greeting-dismiss" type="button" aria-label="Dismiss stylist greeting">×</button>
      </div>
      <div class="showroom-toast" id="uiToast" role="status" aria-live="polite"></div>
    </div>`;
  const dialog = (id,title,content,klass='') => `<dialog id="${id}" class="atelier-dialog ${klass}" aria-labelledby="${id}Title"><button type="button" class="dialog-close" data-close-dialog aria-label="Close">${icons.close}</button><div class="dialog-heading"><p class="micro-label">YASHBI STORE / PERSONAL SELECTION</p><h2 id="${id}Title">${title}</h2></div>${content}</dialog>`;
  overlay.innerHTML = [
    dialog('cartDialog','Your selection.',`<p class="dialog-subtitle">Your saved selection.</p><div id="cartLines" class="cart-lines"></div><div id="cartSummary" class="cart-summary"><div><span>Subtotal</span><strong id="cartSubtotal"></strong></div><p>Shipping is calculated at checkout.</p><button type="button" id="checkoutOpen" class="atelier-button atelier-button-dark">CONTINUE TO CHECKOUT ${icons.arrow}</button></div>`,'cart-dialog'),
    dialog('checkoutDialog','A little closer.',`<p class="dialog-subtitle">Enter your delivery details and proof of payment.</p>${local?'<p class="simulation-note">Local simulation. Use a sample image to test orders and invoices. Do not make a payment.</p>':''}<form id="checkoutForm"><div class="checkout-layout"><div class="checkout-fields"><h3>Recipient information</h3><div class="field-grid"><label class="ui-field full"><span>Full name</span><input name="name" autocomplete="name" required placeholder="Recipient name"></label><label class="ui-field"><span>WhatsApp number</span><input name="phone" required inputmode="tel" placeholder="08xxxxxxxxxx"></label><label class="ui-field"><span>Email (optional)</span><input name="email" autocomplete="email" type="email" placeholder="name@email.com"></label><label class="ui-field full"><span>Full address</span><textarea name="address" autocomplete="street-address" rows="2" required placeholder="Street and house number, RT/RW"></textarea></label><label class="ui-field"><span>City or regency</span><input name="city" required autocomplete="address-level2" placeholder="Surabaya"></label><label class="ui-field"><span>Postal code</span><input name="postal" autocomplete="postal-code" required inputmode="numeric" placeholder="60231"></label><label class="ui-field full"><span>Shipping</span><select name="courier" required><option value="">Choose shipping</option><option>J&amp;T Regular — Rp18.000</option><option>JNE Regular — Rp20.000</option><option>SiCepat REG — Rp17.000</option><option value="Ambil di toko — Gratis">Store pickup — Free</option></select></label></div><h3>Payment</h3><div class="payment-choices"><label><input type="radio" name="paymentMethod" value="QRIS" checked>QRIS</label><label><input type="radio" name="paymentMethod" value="Transfer BCA">BCA bank transfer</label></div><div id="paymentInstructions" class="payment-instructions"></div><label class="proof-upload"><input id="proofInput" type="file" accept="image/jpeg,image/png,image/webp" required><span>↑</span><strong id="proofLabel">Upload proof of payment</strong><small>JPG, PNG, WEBP · up to 5 MB</small><img id="proofImage" alt="Payment proof preview" hidden></label><label class="ui-consent"><input name="consent" type="checkbox" required><span>I agree to the use of my information to process this order and send status updates via WhatsApp.</span></label></div><aside class="checkout-summary"><p class="micro-label">ORDER SUMMARY</p><div id="checkoutLines"></div><div class="checkout-total-row"><span>Subtotal</span><strong id="checkoutSubtotal"></strong></div><div class="checkout-total-row"><span>Shipping</span><strong id="checkoutShipping">Pilih kurir</strong></div><div class="checkout-total-row final"><span>Total</span><strong id="checkoutTotal"></strong></div><p id="checkoutError" class="form-error" role="alert"></p><button type="submit" id="checkoutSubmit" class="atelier-button atelier-button-dark">PLACE ORDER ${icons.arrow}</button><small>Store staff verify payment.</small></aside></div></form>`,'checkout-dialog'),
    dialog('purchaseDialog','A moment to keep.',`<div id="purchaseContent"></div>`,'purchase-dialog'),
    dialog('historyDialog','Your wardrobe notes.',`<p class="dialog-subtitle">Purchase history on this device.</p><div id="historyLines" class="history-lines"></div>`,'history-dialog'),
    dialog('trackDialog','Follow your story.',`<p class="dialog-subtitle">Track your order using the order number and WhatsApp number entered at checkout.</p><form id="trackingForm" class="tracking-form"><label class="ui-field"><span>Order number</span><input name="orderId" required placeholder="Order number"></label><label class="ui-field"><span>WhatsApp number</span><input name="phone" required inputmode="tel" placeholder="08xxxxxxxxxx"></label><button type="submit" id="trackingSubmit" class="atelier-button atelier-button-dark">TRACK ORDER ${icons.arrow}</button></form><div id="trackingResult" class="tracking-result" hidden aria-live="polite"></div>`,'track-dialog'),
    dialog('lookbookDialog','The closer look.',`<div class="lookbook-layout"><div class="lookbook-picture"><img id="lookbookImage" alt=""></div><div class="lookbook-copy"><p id="lookbookCategory" class="micro-label"></p><h3 id="lookbookTitle"></h3><strong id="lookbookPrice"></strong><p id="lookbookDescription"></p><div class="lookbook-option"><span>COLOR <b id="lookbookColorName"></b></span><div id="lookbookColors" class="color-controls" role="group" aria-label="Lookbook product colors"></div></div><div class="lookbook-option"><span>SIZE</span><div id="lookbookSizes" class="size-controls" role="group" aria-label="Lookbook product sizes"></div></div><p id="lookbookFeedback" class="selection-feedback" aria-live="polite"></p><button type="button" id="lookbookAdd" class="atelier-button atelier-button-dark">ADD TO CART ${icons.bag}</button></div></div>`,'lookbook-dialog'),
    dialog('infoDialog','With a little care.',`<div id="infoContent" class="info-content"></div>`,'info-dialog'),
    dialog('catalogDialog','The complete edit.',`<p class="dialog-subtitle">30 produk. Tiga koleksi untuk menemukan gayamu.</p><div class="catalog-controls"><input id="catalogSearch" type="search" aria-label="Search products" placeholder="Nama, warna, atau gaya…"><select id="catalogCategory" aria-label="Kategori katalog">${categories.map(c=>`<option value="${c}">${categoryLabel(c)}</option>`).join('')}</select><select id="catalogSort" aria-label="Sort products"><option value="featured">Featured</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="newest">New arrivals</option></select></div><p id="catalogCount" class="micro-label"></p><div id="catalogItems" class="catalog-index"></div>`,'catalog-dialog'),
    dialog('helpDialog','Here for your moments.',`<div class="help-list"><button type="button" data-info="size">Size guide <span>↗</span></button><button type="button" data-info="shipping">Shipping <span>↗</span></button><button type="button" data-info="returns">Exchange policy <span>↗</span></button><button type="button" data-info="about">About us <span>↗</span></button><button type="button" id="helpTrack">Track order <span>↗</span></button><button type="button" id="helpHistory">Purchase Record <span>↗</span></button></div>`,'help-dialog'),
    `<dialog id="chatDialog" class="atelier-dialog chat-dialog" aria-labelledby="chatDialogTitle" aria-describedby="chatStatus">
      <header class="chat-header">
        ${stylistAvatar}
        <div>
          <h2 id="chatDialogTitle">${stylistName}</h2>
          <p id="chatStatus">Personal Showroom Stylist · Online</p>
        </div>
        <button type="button" class="dialog-close" data-close-dialog aria-label="Close stylist">${icons.close}</button>
      </header>
      <div id="chatMessages" class="chat-messages" role="log" aria-label="Chat with Alya" tabindex="0">
        <div class="chat-message assistant">Welcome to Yashbi Store! I'm Alya. Tell me what event you're dressing for—or just your vibe and rough budget—and I'll bring the best pieces right in front of you in 3D.</div>
      </div>
      <div class="chat-dock">
        <div id="stylistStarters" class="stylist-starters" role="group" aria-label="Try a styling prompt">
          <button type="button" data-stylist-prompt="wedding">Style a wedding look with a sand suit</button>
          <button type="button" data-stylist-prompt="evening">Find an evening dress under Rp 2M</button>
          <button type="button" data-stylist-prompt="fabric">Show me the fabric close-up</button>
        </div>
        <form id="chatForm" class="chat-form">
          <input id="chatInput" aria-label="Message Alya" placeholder="What are you dressing for?" maxlength="800" required autocomplete="off">
          <button type="submit" id="chatSend" aria-label="Send message">↑</button>
        </form>
      </div>
    </dialog>`
  ].join('');
  const $ = id => document.getElementById(id);
  function toast(message) {
    const activeDialog=overlay.querySelector('dialog[open]');
    if(activeDialog){let feedback=activeDialog.querySelector('.dialog-feedback');if(!feedback){feedback=document.createElement('p');feedback.className='dialog-feedback';feedback.setAttribute('role','status');feedback.setAttribute('aria-live','polite');activeDialog.append(feedback);}feedback.textContent=message;return;}
    $('uiToast').textContent=message;$('uiToast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('uiToast').classList.remove('visible'),2800);
  }
  function closeDialogs(){if(checkoutBusy){toast('Your order is being recorded. Please wait.');return false;}overlay.querySelectorAll('dialog[open]').forEach(element=>element.close());return true;}
  function openDialog(id){if(closeDialogs()){$(id).querySelector('.dialog-feedback')?.remove();$(id).showModal();}}
  overlay.addEventListener('click',event=>{const close=event.target.closest('[data-close-dialog]');if(close){if(checkoutBusy){toast('Your order is being recorded. Please wait.');return;}close.closest('dialog').close();}if(event.target instanceof HTMLDialogElement){const r=event.target.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom){if(checkoutBusy)return;event.target.close();}}});
  $('checkoutDialog').addEventListener('cancel',event=>{if(checkoutBusy){event.preventDefault();toast('Your order is being recorded. Please wait.');}});
  function sizesMarkup(product,chosen,prefix){return product.sizes.map(value=>`<button type="button" data-${prefix}-size="${html(value)}" aria-pressed="${value===chosen}">${html(value)}</button>`).join('');}
  function colorsMarkup(product,chosen,prefix){return product.colors.map((value,index)=>`<button type="button" data-${prefix}-color="${html(value)}" style="--swatch:${product.colorHex[index]}" aria-label="Color ${html(value)}" title="${html(value)}" aria-pressed="${value===chosen}"></button>`).join('');}
  // Native compatibility clicks can be suppressed immediately after a canvas
  // swipe. Activate idempotent selection buttons at touch release and consume
  // only the matching compatibility click, keeping keyboard activation intact.
  let selectionTouch=null,lastTouchSelection=null;
  hud.addEventListener('pointerdown',event=>{const button=event.target.closest('[data-category],[data-hud-color],[data-hud-size],[data-garment-view]');if(event.pointerType==='touch'&&button)selectionTouch={button,id:event.pointerId,x:event.clientX,y:event.clientY};});
  hud.addEventListener('pointercancel',()=>{selectionTouch=null;});
  hud.addEventListener('pointerup',event=>{const touch=selectionTouch;selectionTouch=null;if(!touch||touch.id!==event.pointerId||Math.hypot(event.clientX-touch.x,event.clientY-touch.y)>12)return;lastTouchSelection={button:touch.button,time:performance.now()};touch.button.click();});
  hud.addEventListener('click',event=>{if(event.isTrusted&&event.detail>0&&lastTouchSelection&&performance.now()-lastTouchSelection.time<650&&event.target.closest('button')===lastTouchSelection.button){event.preventDefault();event.stopImmediatePropagation();lastTouchSelection=null;}},true);
  function updateProduct(product,{index=0,total=products.length,mode:nextMode=mode,category=activeCategory,color:nextColor,garmentView:nextGarmentView}={}){
    const focusedColor=document.activeElement?.dataset.hudColor;const focusedSize=document.activeElement?.dataset.hudSize;
    if(!product)return;const changed=current.id!==product.id;current=product;if(changed){color=product.colors[0];size='';garmentView='detail';}if(nextColor&&product.colors.includes(nextColor))color=nextColor;if(['detail','full'].includes(nextGarmentView))garmentView=nextGarmentView;
    if(['runway','shelf','focus'].includes(nextMode))hud.querySelector('.showroom-ui').dataset.scene=nextMode;
    const indexText=`${String(index+1).padStart(2,'0')} / ${String(total).padStart(2,'0')}`;
    $('hudIndex').textContent=indexText;$('sceneIndex').textContent=indexText;$('hudCategory').textContent=categoryLabel(product.category);$('hudTitle').textContent=product.name;$('hudPrice').textContent=money(product.price);$('hudOriginal').textContent=product.original?money(product.original):'';$('hudDescription').textContent=productDescription(product);$('hudColorName').textContent=color;
    $('hudColors').innerHTML=colorsMarkup(product,color,'hud');$('hudSizes').innerHTML=sizesMarkup(product,size,'hud');$('hudFeedback').textContent=size?`Size ${size} selected.`:'Choose a size to complete your selection.';setMode(nextMode);setCategory(category);stylist?.select(product.id);if(!changed&&(focusedColor||focusedSize)){const replacement=[...hud.querySelectorAll('[data-hud-color],[data-hud-size]')].find(button=>focusedColor?button.dataset.hudColor===focusedColor:button.dataset.hudSize===focusedSize);replacement?.focus({preventScroll:true});}
  }
  function syncGarmentView(){const controls=hud.querySelector('.garment-view-controls');controls.hidden=mode!=='inspect'||current.category.startsWith('Sepatu');controls.querySelectorAll('[data-garment-view]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.garmentView===garmentView)));}
  function setMode(value){mode=value==='focus'?'inspect':['runway','shelf'].includes(value)?'overview':value;hud.querySelector('.showroom-ui').dataset.mode=mode;$('overviewButton').hidden=mode!=='inspect';$('hudInspect').hidden=mode==='inspect';syncGarmentView();notifyLayout();}
  function setCategory(value){activeCategory=value;const primary=String(value).startsWith('Sepatu')?'Sepatu':value;hud.querySelectorAll('[data-primary-collection]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.primaryCollection===primary)));hud.querySelectorAll('[data-shoe-filter]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.shoeFilter===value)));hud.querySelector('.showroom-ui').dataset.collection=primary;notifyLayout();}
  function add(product,chosenColor,chosenSize,feedback){
    // The HUD already has an aria-live status row. A second floating message
    // covered the add button on phones; keep confirmation in the normal flow.
    const announce=message=>{if(feedback!=='hudFeedback')toast(message);};
    if(!chosenSize){$(feedback).textContent='Choose a size first.';announce('Choose a size first.');return false;}
    try{commerce.add(product.id,chosenColor,chosenSize);$(feedback).textContent=`${chosenColor} · ${chosenSize} added.`;announce(`${product.name} added to your cart.`);return true;}
    catch(error){$(feedback).textContent=error.message;announce(error.message);return false;}
  }
  hud.addEventListener('click',event=>{const category=event.target.closest('[data-category]');if(category){setCategory(category.dataset.category);onCategory(category.dataset.category);}const colorButton=event.target.closest('[data-hud-color]');if(colorButton){color=colorButton.dataset.hudColor;$('hudColorName').textContent=color;hud.querySelectorAll('[data-hud-color]').forEach(b=>b.setAttribute('aria-pressed',String(b===colorButton)));onColor(color);}const sizeButton=event.target.closest('[data-hud-size]');if(sizeButton){size=sizeButton.dataset.hudSize;hud.querySelectorAll('[data-hud-size]').forEach(b=>b.setAttribute('aria-pressed',String(b===sizeButton)));$('hudFeedback').textContent=`Size ${size} selected.`;}});
  $('hudAdd').addEventListener('click',()=>add(current,color,size,'hudFeedback'));
  hud.addEventListener('click',event=>{const button=event.target.closest('[data-garment-view]');if(!button)return;garmentView=button.dataset.garmentView;syncGarmentView();onGarmentView(garmentView);notifyLayout();});
  $('hudInspect').addEventListener('click',()=>onInspect(current.id));$('overviewButton').addEventListener('click',onOverview);$('previousProduct').addEventListener('click',()=>onStep(-1));$('nextProduct').addEventListener('click',()=>onStep(1));
  $('hudDetails').addEventListener('click',()=>showLookbook(current.id));
  function renderCart(){const cart=state.cart||[];$('cartCount').textContent=cart.reduce((sum,item)=>sum+item.qty,0);$('cartSummary').hidden=!cart.length;$('cartLines').innerHTML=cart.length?cart.map(item=>{const p=products.find(p=>p.id===item.productId);return p?`<article class="cart-line"><img src="${imageForColor(p,item.color)}" alt="${html(p.name)}"><div><h3>${html(p.name)}</h3><p>${html(item.color)} / ${html(item.size)}</p><strong>${money(p.price)}</strong><div class="quantity-control"><button type="button" data-quantity="${html(item.key)}" data-delta="-1" aria-label="Decrease quantity">−</button><span>${item.qty}</span><button type="button" data-quantity="${html(item.key)}" data-delta="1" aria-label="Increase quantity">+</button></div></div><button type="button" class="remove-item" data-remove="${html(item.key)}" aria-label="Remove ${html(p.name)}">×</button></article>`:'';}).join(''):'<div class="empty-selection"><span>◇</span><h3>A little space for something lovely.</h3><p>Your cart is empty.</p><button type="button" class="text-action" data-close-dialog>BACK TO COLLECTION ↗</button></div>';$('cartSubtotal').textContent=money(commerce.subtotal());}
  function showCart(){renderCart();openDialog('cartDialog');}
  $('cartOpen').addEventListener('click',showCart);
  overlay.addEventListener('click',event=>{const quantity=event.target.closest('[data-quantity]');const remove=event.target.closest('[data-remove]');try{if(quantity){const key=quantity.dataset.quantity;const delta=quantity.dataset.delta;commerce.setQty(key,Number(delta));const replacement=[...$('cartLines').querySelectorAll('[data-quantity]')].find(button=>button.dataset.quantity===key&&button.dataset.delta===delta);(replacement||((state.cart||[]).length?$('checkoutOpen'):$('cartDialog').querySelector('[data-close-dialog]'))).focus();}if(remove){commerce.remove(remove.dataset.remove);const next=$('cartLines').querySelector('[data-remove]')||$('cartDialog').querySelector('[data-close-dialog]');next.focus();}}catch(error){toast(error.message);}});
  function renderCheckoutSummary(){const form=$('checkoutForm');const shipping=commerce.shippingCost(form.elements.courier.value);$('checkoutLines').innerHTML=(state.cart||[]).map(item=>{const p=products.find(p=>p.id===item.productId);return `<div class="checkout-line"><img src="${imageForColor(p,item.color)}" alt=""><div><strong>${html(p.name)}</strong><small>${html(item.color)} / ${html(item.size)} / ${item.qty}×</small></div><span>${money(p.price*item.qty)}</span></div>`;}).join('');$('checkoutSubtotal').textContent=money(commerce.subtotal());$('checkoutShipping').textContent=form.elements.courier.value?(shipping?money(shipping):'Free'):'Pilih kurir';$('checkoutTotal').textContent=money(commerce.subtotal()+shipping);}
  function paymentInstructions(){const method=new FormData($('checkoutForm')).get('paymentMethod');$('paymentInstructions').innerHTML=local?'<strong>PAYMENT SIMULATION</strong><p>Do not transfer money. Upload a sample image to test checkout.</p>':method==='Transfer BCA'?'<strong>BCA bank transfer</strong><p>0183769453 · a/n Adi Nugroho</p><small>Use the total shown. Confirm details with staff before paying.</small>':'<img src="assets/images/qris-extreme-studios.jpeg" alt="QRIS Extreme Studios"><div><strong>QRIS Extreme Studios</strong><p>Scan with your payment app and confirm that the amount matches the total.</p></div>';}
  $('checkoutOpen').addEventListener('click',()=>{if(checkoutBusy||!(state.cart||[]).length)return;proof=null;$('checkoutForm').reset();$('proofImage').hidden=true;$('proofImage').removeAttribute('src');$('proofLabel').textContent='Upload proof of payment';$('checkoutError').textContent='';renderCheckoutSummary();paymentInstructions();openDialog('checkoutDialog');});
  $('checkoutForm').addEventListener('change',event=>{if(event.target.name==='courier')renderCheckoutSummary();if(event.target.name==='paymentMethod')paymentInstructions();});
  $('proofInput').addEventListener('change',async event=>{try{proof=await commerce.readAndCompressImage(event.target.files[0]);$('proofImage').src=proof;$('proofImage').hidden=false;$('proofLabel').textContent=event.target.files[0].name;$('checkoutError').textContent='';$('checkoutDialog').querySelector('.dialog-feedback')?.remove();}catch(error){proof=null;event.target.value='';$('proofImage').hidden=true;$('proofLabel').textContent='Could not process proof. Choose another image.';$('checkoutError').textContent=error.message;toast(error.message);}});
  $('checkoutForm').addEventListener('submit',async event=>{event.preventDefault();if(checkoutBusy)return;if(!proof){$('checkoutError').textContent='Upload proof of payment first.';return;}checkoutBusy=true;$('checkoutSubmit').disabled=true;$('checkoutSubmit').textContent='PLACING ORDER…';$('checkoutError').textContent='';try{const customer=Object.fromEntries(new FormData(event.currentTarget));delete customer.consent;if(!state.visitor)commerce.setVisitor(customer.name);const order=await commerce.checkout(customer,proof);lastOrder=order;checkoutBusy=false;showPurchase(order);}catch(error){$('checkoutError').textContent=error.message||'Could not place the order. Please try again.';}finally{checkoutBusy=false;$('checkoutSubmit').disabled=false;$('checkoutSubmit').innerHTML=`PLACE ORDER ${icons.arrow}`;}});
  function showPurchase(order){const invoice=order.invoiceUrl||'';const simulation=order.simulation||local;$('purchaseContent').innerHTML=`<p class="purchase-mark">✓</p><p class="micro-label">${simulation?'LOCAL PREVIEW / SIMULATION':'PURCHASE RECORD'}</p><h3>${simulation?'Simulated order recorded.':'Order recorded.'}</h3><p>${simulation?'This simulated invoice does not represent a real transaction or payment.':'Staff will verify payment. Keep the invoice for your records.'}</p><div class="order-reference"><span>ORDER NUMBER</span><strong id="purchaseOrderId">${html(order.id)}</strong><small>${html(orderStatusLabel(order.status))}</small></div>${invoice?`<a id="downloadInvoice" class="atelier-button atelier-button-dark" href="${html(invoice)}" download target="_blank" rel="noopener">DOWNLOAD PDF INVOICE ↓</a>`:'<p>The invoice is unavailable. Order status is saved on this device.</p>'}${order.invoiceViewUrl?`<a class="text-action" href="${html(order.invoiceViewUrl)}" target="_blank" rel="noopener">VIEW INVOICE ↗</a>`:''}<p>Total ${money(order.total??order.subtotal+order.shipping)}</p><button type="button" class="text-action" data-close-dialog>BACK TO COLLECTION →</button>`;openDialog('purchaseDialog');}
  function showHistory(){$('historyLines').innerHTML=(state.orders||[]).length?state.orders.map((order,index)=>`<button type="button" class="history-line" data-history-index="${index}"><span><strong>${html(order.id)}</strong><small>${html(order.customer?.name)} · ${new Date(order.createdAt).toLocaleDateString('en-ID')}</small></span><span>${money(order.total??order.subtotal+order.shipping)}<small>${html(orderStatusLabel(order.status))}</small></span><b>↗</b></button>`).join(''):'<div class="empty-selection"><h3>A fresh page.</h3><p>No orders on this device.</p></div>';openDialog('historyDialog');}
  $('historyOpen').addEventListener('click',showHistory);$('historyLines').addEventListener('click',event=>{const button=event.target.closest('[data-history-index]');if(button)showPurchase(state.orders[Number(button.dataset.historyIndex)]);});
  $('trackOpen').addEventListener('click',()=>{$('trackingResult').hidden=true;openDialog('trackDialog');});
  $('helpOpen').addEventListener('click',()=>openDialog('helpDialog'));$('helpTrack').addEventListener('click',()=>{$('trackingResult').hidden=true;openDialog('trackDialog');});$('helpHistory').addEventListener('click',showHistory);
  $('trackingForm').addEventListener('submit',async event=>{event.preventDefault();const data=new FormData(event.currentTarget);$('trackingSubmit').disabled=true;$('trackingResult').hidden=false;$('trackingResult').textContent='Looking up your order…';try{const order=await commerce.track(data.get('orderId'),data.get('phone'));$('trackingResult').innerHTML=order?`<p class="micro-label">${html(order.id)}</p><h3>${html(orderStatusLabel(order.status))}</h3><p>${new Date(order.createdAt).toLocaleString('en-ID')}</p>${order.trackingNumber?`<p>${html(order.expedition)} / ${html(order.trackingNumber)}</p>`:''}`:'<h3>Order not found.</h3><p>Check the order number and WhatsApp number.</p>';}catch(error){$('trackingResult').textContent=error.message;}finally{$('trackingSubmit').disabled=false;}});
  function showLookbook(id){lookbookProduct=products.find(p=>p.id===id)||current;lookbookColor=lookbookProduct.colors[0];lookbookSize='';$('lookbookImage').src=imageForColor(lookbookProduct,lookbookColor);$('lookbookImage').alt=lookbookProduct.name;$('lookbookCategory').textContent=`${categoryLabel(lookbookProduct.category)} / ${lookbookProduct.id}`;$('lookbookTitle').textContent=lookbookProduct.name;$('lookbookPrice').textContent=money(lookbookProduct.price);$('lookbookDescription').textContent=productDescription(lookbookProduct);$('lookbookColorName').textContent=lookbookColor;$('lookbookColors').innerHTML=colorsMarkup(lookbookProduct,lookbookColor,'lookbook');$('lookbookSizes').innerHTML=sizesMarkup(lookbookProduct,'','lookbook');$('lookbookFeedback').textContent='Choose a size to complete your selection.';openDialog('lookbookDialog');}
  function renderCatalog(){const search=$('catalogSearch').value.trim().toLowerCase();const category=$('catalogCategory').value;const sort=$('catalogSort').value;let filtered=products.filter(p=>(category==='all'||(category==='Sepatu'?p.category.startsWith('Sepatu'):p.category===category))&&(!search||`${p.name} ${p.category} ${p.colors.join(' ')} ${p.desc} ${productDescription(p)}`.toLowerCase().includes(search)));if(sort==='price-low')filtered.sort((a,b)=>a.price-b.price);if(sort==='price-high')filtered.sort((a,b)=>b.price-a.price);if(sort==='newest')filtered.sort((a,b)=>(b.badge==='New')-(a.badge==='New'));$('catalogCount').textContent=`${filtered.length} PRODUCTS / YASHBI STORE`;$('catalogItems').innerHTML=filtered.length?filtered.map(p=>`<button type="button" data-catalog-product="${p.id}" class="catalog-entry"><span class="catalog-entry-photo"><img src="${imageForColor(p,p.colors[0])}" alt="${html(p.name)}" loading="lazy"></span><small>${html(categoryLabel(p.category))} / ${p.id}</small><strong>${html(p.name)}</strong><span>${money(p.price)}</span></button>`).join(''):'<p class="catalog-empty">No matching products. Try a different search.</p>';}
  function showCatalog(){$('catalogSearch').value='';$('catalogCategory').value=categories.includes(activeCategory)?activeCategory:'all';$('catalogSort').value='featured';renderCatalog();openDialog('catalogDialog');}
  $('catalogOpen').addEventListener('click',showCatalog);$('catalogSearch').addEventListener('input',renderCatalog);$('catalogCategory').addEventListener('change',renderCatalog);$('catalogSort').addEventListener('change',renderCatalog);$('catalogItems').addEventListener('click',event=>{const b=event.target.closest('[data-catalog-product]');if(b){onSelect(b.dataset.catalogProduct);showLookbook(b.dataset.catalogProduct);}});
  $('lookbookDialog').addEventListener('click',event=>{const c=event.target.closest('[data-lookbook-color]');if(c){lookbookColor=c.dataset.lookbookColor;$('lookbookImage').src=imageForColor(lookbookProduct,lookbookColor);$('lookbookColorName').textContent=lookbookColor;$('lookbookDialog').querySelectorAll('[data-lookbook-color]').forEach(b=>b.setAttribute('aria-pressed',String(b===c)));}const s=event.target.closest('[data-lookbook-size]');if(s){lookbookSize=s.dataset.lookbookSize;$('lookbookDialog').querySelectorAll('[data-lookbook-size]').forEach(b=>b.setAttribute('aria-pressed',String(b===s)));$('lookbookFeedback').textContent=`Size ${lookbookSize} selected.`;}});$('lookbookAdd').addEventListener('click',()=>add(lookbookProduct,lookbookColor,lookbookSize,'lookbookFeedback'));
  const infos = {
    size:['Size guide','<p>Check the sizes listed for each item. For clothing, measure the bust or chest, waist and hips. For shoes, measure foot length. Ask staff for specific measurements before paying.</p>'],
    shipping:['Shipping','<p>Choose J&amp;T Regular, JNE Regular, SiCepat REG or store pickup at checkout. Confirm coverage and timing with staff. Track order shows the shipment number once recorded.</p>'],
    returns:['Exchange policy','<p>Contact staff with your order number, invoice and requested size. Confirm availability, deadlines and shipping costs before returning an item.</p>'],
    about:['About Yashbi','<p>Explore dresses, menswear and shoes from Yashbi Store. Sahabat Yashbi can recommend a look and bring each piece into view.</p>'],
  };
  Object.entries(infos).forEach(([key,entry])=>{const original=$('infoDialog');const distinct=original.cloneNode(true);distinct.id=`info-${key}`;distinct.setAttribute('aria-labelledby',`info-${key}-title`);distinct.querySelector('#infoDialogTitle').id=`info-${key}-title`;distinct.querySelector('h2').textContent=entry[0];distinct.querySelector('#infoContent').id=`info-${key}-content`;distinct.querySelector('.info-content').innerHTML=entry[1];overlay.append(distinct);});$('infoDialog').remove();
  function showInfo(key){if(infos[key])openDialog(`info-${key}`);}
  document.addEventListener('click',event=>{const button=event.target.closest('[data-info]');if(button)showInfo(button.dataset.info);});
  stylist = bindStylist({ $, products, money, openDialog, onStylistFocus, notifyLayout });
  document.addEventListener('keydown',event=>{if(overlay.querySelector('dialog[open]')||['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))return;if(event.key==='Escape'&&mode==='inspect'){event.preventDefault();onOverview();}if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();onStep(event.key==='ArrowLeft'?-1:1);}});
  commerce.subscribe(next=>{state=next;renderCart();});
  if(typeof ResizeObserver!=='undefined')new ResizeObserver(notifyLayout).observe(hud.querySelector('.product-hud'));
  updateProduct(current,{total:8,category:'Gaun Wanita'});
  let statusTimer;
  const status = hud.querySelector('.showroom-status');
  function clearWebglError() {
    if (status.dataset.state !== 'webgl') return;
    status.hidden = true;
    delete status.dataset.state;
    $('sceneStatus').textContent = '';
  }
  return {updateProduct,setMode,setCategory,clearWebglError,setLoading(){ $('sceneStatus').textContent='Preparing the showroom…';hud.querySelector('.showroom-status').hidden=false;},setReady(){ stylist.startGreeting(); if (status.dataset.state === 'webgl') return; clearTimeout(statusTimer); $('sceneStatus').textContent='Showroom ready';statusTimer=setTimeout(()=>status.hidden=true,1600);},setError(message, reason){clearTimeout(statusTimer);status.dataset.state=reason||'error';$('sceneStatus').textContent=`${message} The catalog is still available.`;hud.querySelector('.showroom-status').hidden=false;},showCart,showLookbook,showCatalog,toast,showHistory,showPurchase,closeDialogs,getState(){return{product:current,color,size,mode,garmentView,category:activeCategory,lastOrder};}};
}
