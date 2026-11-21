import {products, money, imageForColor, imageSources, installImageFallback} from './catalog.js';
import {createCommerce} from './commerce.js';
import {createUI} from './ui.js';
import {Showroom} from './showroom.js';
import './showroom.css';

installImageFallback();
const commerce = createCommerce(products);
let engine;
let selected = products[0];
let activeCategory = 'Gaun Wanita';
const ui = createUI({
  products, money, imageForColor, commerce,
  onCategory(category) {
    activeCategory=category;
    engine?.setCategory(category);
  },
  onSelect(id) {engine?.select(id);},
  onStep(delta) {engine?.step(delta);},
  onInspect(id) {engine?.inspect(typeof id==='string'?id:selected.id);},
  onColor(color) {engine?.setColor(selected.id,color);},
  onOverview() {engine?.overview();},
  onStylistFocus(sku, detailView) {
    if (!engine || engine.contextLost) return false;
    return engine.inspect(sku, detailView ? 'detail' : 'full');
  },
  onGarmentView(view) {engine?.setGarmentView(view);}
});

function selection(product,meta={}) {
  selected=product;
  ui.updateProduct(product,{...meta,total:meta.total??meta.count??products.length,category:meta.category??activeCategory});
  ui.setMode(meta.mode==='focus'?'inspect':'overview');
}
selection(selected,{index:0,total:8,category:activeCategory,mode:'runway'});
try {
  engine = new Showroom({
    canvas:document.getElementById('showroomCanvas'), products, imageForColor, imageSources,
    onSelect:selection,
    onInspect:selection,
    onReady() {ui.setReady();},
    onContextRecovered() {ui.clearWebglError();},
    onError(error, reason) {ui.setError(error.message || 'The 3D showroom could not open.', reason);}
  });
} catch(error) {
  ui.setError(error.message || 'WebGL is unavailable on this device.');
}

// Public coordination surface for accessible HUD actions, deep links and QA.
window.YASHBI_3D = {engine,commerce,ui,products};
const query = new URLSearchParams(location.search);
const linked = products.find(product=>product.id===String(query.get('product')||'').toUpperCase());
if(linked) {
  selected=linked;
  engine?.select(linked.id);
  ui.showLookbook(linked.id);
}
commerce.syncQueue().catch(()=>{});
window.addEventListener('online',()=>commerce.syncQueue().catch(()=>{}));
window.addEventListener('pagehide',event=>{if(!event.persisted)engine?.dispose();});
