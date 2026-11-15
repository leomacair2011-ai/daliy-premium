import {money,lineKey,normalizeBag,bagTotal,filterProducts} from './cart.mjs';
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const defaultCategories=['Phones','Audio','Smart glasses','Watches','Hair care','Fragrance'];
let cats=[...defaultCategories];
const categoryCover={'Phones':'daily-7720735','Audio':'daily-7730237','Smart glasses':'daily-7730224','Watches':'daily-7720703','Hair care':'daily-7720742','Fragrance':'daily-7720734'};
const displayOrder=['daily-7720735','daily-7730237','daily-7720755','daily-7730224','daily-7720703','daily-7730272','daily-7720742','daily-7730280','daily-7720734'];
const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k))??f}catch{return f}};
let products=[],settings={checkoutEnabled:false,checkoutMessage:'Online checkout is currently unavailable. Please contact us about your selection.'},bag=[],saved=[],timer;
let filters={search:'',category:'All products',sort:'featured',savedOnly:false};
const save=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{toast('Browser storage is unavailable. Keep this page open to retain your bag.')}};
const heart='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/></svg>';
const art=p=>p.images?.length?`<img class="catalogue-photo" src="${esc(p.images[0])}" alt="${esc(p.name)}" loading="lazy">`:'';
function toast(t){$('toast').textContent=t;$('toast').classList.add('visible');clearTimeout(timer);timer=setTimeout(()=>$('toast').classList.remove('visible'),3500)}
function counts(){
  const n=bag.reduce((n,l)=>n+l.qty,0);
  $('bagCount').textContent=n||'';$('bagOpen').setAttribute('aria-label',`Open shopping bag, ${n} items`);
  $('savedCount').textContent=saved.length||'';$('savedToggle').setAttribute('aria-pressed',filters.savedOnly);
  $('savedToggle').setAttribute('aria-label',filters.savedOnly?'Show all products':`Show saved products, ${saved.length} saved`);
}
function persist(){save('daliy-bag-v1',bag);counts()}
function render(){
  if(!$('productGrid')){counts();return}
  const focusedFilter=document.activeElement?.closest('#filters button')?.dataset.category;
  const items=filterProducts(products,{...filters,saved});
  if(filters.sort==='featured')items.sort((a,b)=>displayOrder.indexOf(a.id)-displayOrder.indexOf(b.id));
  $('resultCount').textContent=`${items.length} ${items.length===1?'product':'products'}`;
  $('filters').innerHTML=['All products',...cats].map(c=>`<button class="filter" data-category="${esc(c)}" aria-pressed="${filters.category===c}">${esc(c)}</button>`).join('');
  $('empty').hidden=!!items.length;
  $('productGrid').innerHTML=items.map(p=>`<article class="product-card">
    <button class="save" data-save="${p.id}" aria-label="${saved.includes(p.id)?'Unsave':'Save'} ${esc(p.name)}" aria-pressed="${saved.includes(p.id)}">${heart}</button>
    <a class="card-open" href="/products/${encodeURIComponent(p.id)}" data-product="${p.id}"><p class="card-category">${esc(p.category)}</p><h3>${esc(p.name)}</h3>${art(p)}</a>
    <div class="card-bottom"><div><span class="card-price">From ${money(p.price)}</span><span class="card-option-note">${p.variants.length===1?'One option':p.variants.length+' pack & colour options'}</span></div><button class="primary" data-product="${p.id}" aria-label="Shop ${esc(p.name)}">Shop</button></div>
  </article>`).join('');
  $('activeFilters').hidden=!(filters.search||filters.category!=='All products'||filters.savedOnly);
  $('filterSummary').textContent=[filters.savedOnly?'Saved products':'',filters.category!=='All products'?filters.category:'',filters.search?`“${filters.search}”`:''].filter(Boolean).join(' · ');
  counts();
  if(focusedFilter) [...$('filters').querySelectorAll('button')].find(b=>b.dataset.category===focusedFilter)?.focus({preventScroll:true});
}
function url(){const p=new URLSearchParams();if(filters.search)p.set('q',filters.search);if(filters.category!=='All products')p.set('category',filters.category);if(filters.sort!=='featured')p.set('sort',filters.sort);if(filters.savedOnly)p.set('saved','1');history.replaceState(null,'',location.pathname+(p.size?'?'+p:'')+'#collection')}
function reset(){filters={search:'',category:'All products',sort:'featured',savedOnly:false};$('search').value='';$('sort').value='featured';render();url()}
function show(id){if(!$(id).open){$(id).showModal();document.body.classList.add('dialog-open')}}
function closeMenu(){$('mainNav').classList.remove('open');$('menuToggle').setAttribute('aria-expanded','false');$('menuToggle').setAttribute('aria-label','Open navigation')}
function product(id){
  const p=products.find(p=>p.id===id);if(!p){toast('The collection is still loading. Please try again.');return}
  $('productContent').innerHTML=`<div class="detail-layout"><div class="detail-gallery">
    <div class="detail-image-wrap"><img id="detailImage" class="detail-image" src="${esc(p.images[0])}" alt="${esc(p.name)} — product image 1" width="700" height="700"></div>
    <div class="gallery-thumbs" aria-label="Product photos">${p.images.map((src,i)=>`<button class="gallery-thumb" data-photo="${i}" aria-label="View product photo ${i+1}" aria-pressed="${i===0}"><img src="${esc(src)}" alt="" width="62" height="62"></button>`).join('')}</div>
    <p class="gallery-caption">Product images · <span id="photoNumber">1</span> / ${p.images.length}</p>
  </div><div class="detail-body"><p class="eyebrow">${esc(p.category)}</p><h2 id="productTitle">${esc(p.name)}</h2><p class="detail-price" id="optionPrice">${money(p.variants[0].price)}</p><p class="detail-note">Selected pack price · GBP</p>
    <label class="option-label" for="variant">Choose your option.</label><select id="variant" class="option-select">${p.variants.map(v=>`<option value="${v.id}">${esc(v.label)} — ${money(v.price)}</option>`).join('')}</select>
    <div class="quantity-row"><span>Quantity of packs</span><div class="stepper"><button id="qtyDown" aria-label="Decrease quantity">−</button><input id="quantity" type="number" min="1" max="99" value="1" inputmode="numeric" aria-label="Quantity of packs"><button id="qtyUp" aria-label="Increase quantity">+</button></div></div>
    <button id="addBag" class="primary">Add to bag</button><p class="detail-status">${p.availability==='available'?'Your selected option is saved in your bag. Checkout availability is shown before payment.':'Save your selection now. Stock is awaiting confirmation before orders open.'}</p>
    <details><summary>Product information</summary><p>${esc(p.description||p.name)}</p></details>
    <details><summary>Delivery & returns</summary><p>Estimated delivery: 14 days after dispatch. Final destinations, charges and return terms will be confirmed before checkout opens. Adding to your bag does not reserve stock or place an order.</p></details>
  </div></div>`;
  document.querySelectorAll('[data-photo]').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.photo);$('detailImage').src=p.images[i];$('detailImage').alt=`${p.name} — product image ${i+1}`;$('photoNumber').textContent=i+1;document.querySelectorAll('[data-photo]').forEach(t=>t.setAttribute('aria-pressed',t===b))});
  $('variant').onchange=()=>$('optionPrice').textContent=money(p.variants.find(v=>v.id===$('variant').value).price);
  const qty=()=>Math.min(99,Math.max(1,parseInt($('quantity').value,10)||1));
  $('qtyDown').onclick=()=>$('quantity').value=Math.max(1,qty()-1);$('qtyUp').onclick=()=>$('quantity').value=Math.min(99,qty()+1);$('quantity').onchange=()=>$('quantity').value=qty();
  $('addBag').onclick=()=>{const l={id:p.id,variantId:$('variant').value,qty:qty()},old=bag.find(x=>lineKey(x)===lineKey(l));if((old?.qty||0)+l.qty>99){toast('A maximum of 99 packs can be saved per option.');return}bag=normalizeBag([...bag,l],products);persist();$('productDialog').close();renderBag();show('bagDialog')};
  $('productDialog').scrollTop=0;show('productDialog');
}
function renderBag(){
  $('bagItems').innerHTML=bag.length?bag.map(l=>{const p=products.find(p=>p.id===l.id),v=p.variants.find(v=>v.id===l.variantId);return `<article class="bag-item"><div class="bag-item-top"><div class="bag-art">${art(p)}</div><div><h3>${esc(p.name)}</h3><p>${esc(v.label)}<br>${money(v.price)} per pack</p></div></div><div class="bag-item-bottom"><div class="stepper"><button data-qty="-1" data-key="${lineKey(l)}" aria-label="Decrease ${esc(p.name)} quantity" ${l.qty===1?'disabled':''}>−</button><span aria-label="Quantity">${l.qty}</span><button data-qty="1" data-key="${lineKey(l)}" aria-label="Increase ${esc(p.name)} quantity" ${l.qty===99?'disabled':''}>+</button></div><button class="remove" data-remove="${lineKey(l)}" aria-label="Remove ${esc(p.name)}">Remove</button><strong>${money(Math.round(v.price*100)*l.qty/100)}</strong></div></article>`}).join(''):'<div class="empty"><h3>Your bag is empty.</h3><p>Find something for your everyday.</p><button class="primary" data-close="bagDialog">Continue shopping</button></div>';
  $('bagTotals').innerHTML=bag.length?`<div class="total-row"><span>Subtotal</span><strong>${money(bagTotal(bag,products))}</strong></div><p class="bag-disclaimer">Pack prices in GBP. Delivery and applicable taxes will be confirmed before payment. Saving items does not reserve stock.</p><button class="primary" id="checkout">${settings.checkoutEnabled?'Continue to Stripe':'Checkout availability'} <span aria-hidden="true">→</span></button><p class="checkout-notice" id="checkoutNotice" hidden role="status"></p>`:'';
  if($('checkout'))$('checkout').onclick=startCheckout;
}
function openBag(){renderBag();show('bagDialog')}
const info={
  delivery:['Delivery & returns','Estimated delivery is 14 days after dispatch. Delivery times may vary by destination. Destinations, delivery charges and return terms will be confirmed before online checkout opens. Adding a product to your bag does not reserve stock or place an order.'],
  discount:['A little extra, with your code.','Have a discount code? Discount codes will be available when checkout and promotions are activated. Any eligible discount and its conditions will appear before you pay. No promotional code is currently advertised by this store.'],
  privacy:['Your privacy.','Your shopping bag and saved products are stored locally in this browser. Support chat messages are stored on the store’s server so the owner can reply. Guest chats use a private browser cookie for up to 30 days; signed-in conversations are associated with your account. IP addresses are not used for login. Remove them using the bag and saved-item controls, or by clearing this site’s browser data. When online checkout is available, Stripe processes payment and the store retains order details for fulfilment. The current preview does not collect payments. Support chat stores only the name and messages you choose to send. Do not send card details or sensitive personal information.'],
  contact:['About Mello.','An independent collection of technology, personal care and everyday essentials. Customer support details, product specifications and stock availability are awaiting confirmation before checkout opens. You can browse the collection and save your favourites in the meantime.']
};
document.addEventListener('click',e=>{
  const b=e.target.closest('button,a');if(!b)return;
  if(!$('collection')&&(b.hasAttribute('data-all')||b.dataset.category)){e.preventDefault();location.href='/'+(b.dataset.category?'?category='+encodeURIComponent(b.dataset.category):'')+'#collection';return}
  if(b.hasAttribute('data-all')){e.preventDefault();reset();$('collection').scrollIntoView();closeMenu()}
  if(b.dataset.category){e.preventDefault();filters.category=b.dataset.category;filters.savedOnly=false;filters.search='';$('search').value='';render();$('collection').scrollIntoView({behavior:'auto'});url();closeMenu()}
  if(b.dataset.product){if(b.tagName==='A'&&(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||e.button!==0))return;e.preventDefault();product(b.dataset.product);}
  if(b.dataset.save){const id=b.dataset.save;saved=saved.includes(id)?saved.filter(x=>x!==id):[...saved,id];save('daliy-saved-v1',saved);render();document.querySelector(`[data-save="${id}"]`)?.focus()}
  if(b.dataset.close)$(b.dataset.close).close();
  if(b.dataset.remove){bag=bag.filter(l=>lineKey(l)!==b.dataset.remove);persist();renderBag()}
  if(b.dataset.qty){const l=bag.find(l=>lineKey(l)===b.dataset.key);if(l)l.qty=Math.max(1,Math.min(99,l.qty+Number(b.dataset.qty)));persist();renderBag()}
  if(b.dataset.info){const [t,x]=info[b.dataset.info];$('infoTitle').textContent=t;$('infoText').textContent=x;show('infoDialog')}
});
if($('search'))$('search').oninput=()=>{filters.search=$('search').value;render();url()};
if($('sort'))$('sort').onchange=()=>{filters.sort=$('sort').value;render();url()};
if($('clearFilters'))$('clearFilters').onclick=reset;if($('resetSearch'))$('resetSearch').onclick=reset;$('bagOpen').onclick=openBag;if($('footerBag'))$('footerBag').onclick=openBag;
$('savedToggle').onclick=()=>{if(!$('collection')){location.href='/?saved=1#collection';return}filters.savedOnly=!filters.savedOnly;filters.search='';filters.category='All products';$('search').value='';render();url();$('collection').scrollIntoView({behavior:'auto'})};
$('searchOpen').onclick=()=>{if(!$('collection')){location.href='/#collection';return}closeMenu();$('collection').scrollIntoView({behavior:'auto'});$('search').focus({preventScroll:true})};
$('menuToggle').onclick=()=>{const open=$('mainNav').classList.toggle('open');$('menuToggle').setAttribute('aria-expanded',open);$('menuToggle').setAttribute('aria-label',open?'Close navigation':'Open navigation')};
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu()});
if($('retry'))$('retry').onclick=load;
for(const d of document.querySelectorAll('dialog')){
  d.addEventListener('click',e=>{if(e.target===d&&!d.classList.contains('admin-dialog')){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close()}});
  d.addEventListener('close',()=>{if(!document.querySelector('dialog[open]'))document.body.classList.remove('dialog-open')});
}
async function load(){
  try{
    const r=await Promise.all([fetch('/catalogue.json'),fetch('/settings.json')]);if(r.some(x=>!x.ok))throw Error();
    [products,settings]=await Promise.all(r.map(x=>x.json()));cats=[...new Set([...defaultCategories.filter(c=>products.some(p=>p.category===c)),...products.map(p=>p.category)])];bag=normalizeBag(read('daliy-bag-v1',[]),products);
    const stored=read('daliy-saved-v1',[]);saved=Array.isArray(stored)?[...new Set(stored.filter(id=>products.some(p=>p.id===id)))]:[];
    const q=new URLSearchParams(location.search);filters.search=q.get('q')||'';filters.category=cats.includes(q.get('category'))?q.get('category'):'All products';filters.sort=['featured','price-low','price-high','name'].includes(q.get('sort'))?q.get('sort'):'featured';
    filters.savedOnly=q.get('saved')==='1';
    if($('search'))$('search').value=filters.search;if($('sort'))$('sort').value=filters.sort;
    if($('heroCategories'))$('heroCategories').innerHTML=cats.map(c=>{const p=products.find(p=>p.id===categoryCover[c]&&p.category===c)||products.find(p=>p.category===c);return `<a href="#collection" data-category="${esc(c)}">${p?.images[0]?`<img class="category-image" src="${esc(p.images[0])}" alt="">`:''}<span>${esc(c)}</span></a>`}).join('');
    document.querySelectorAll('.highlight-card[data-product],.feature-tile [data-product]').forEach(el=>{const p=products.find(p=>p.id===el.dataset.product);const tile=el.closest('.feature-tile')||el;tile.hidden=!p;if(p&&el.classList.contains('highlight-card')){el.removeAttribute('aria-label');if(p.managed)el.querySelector('strong').textContent=p.name}});
    document.querySelectorAll('[data-cover-product]').forEach(img=>{const p=products.find(p=>p.id===img.dataset.coverProduct);img.hidden=!p?.images[0];if(p?.images[0]){img.src=p.images[0];if(img.classList.contains('feature-cover'))img.alt=p.name}});
    document.querySelectorAll('[data-price]').forEach(el=>{const p=products.find(p=>p.id===el.dataset.price);if(p)el.textContent=money(p.price)});
    if($('loadError'))$('loadError').hidden=true;render();loadCheckoutConfig();checkPaymentReturn();
  }catch{if($('resultCount'))$('resultCount').textContent='Collection unavailable';if($('loadError'))$('loadError').hidden=false;if($('empty'))$('empty').hidden=true}
}
window.addEventListener('storage',e=>{
  if(e.key==='daliy-bag-v1'){bag=normalizeBag(read(e.key,[]),products);counts();if($('bagDialog').open)renderBag()}
  if(e.key==='daliy-saved-v1'){const a=read(e.key,[]);saved=Array.isArray(a)?a.filter(id=>products.some(p=>p.id===id)):[];render()}
});
load();
async function loadCheckoutConfig(){try{const r=await fetch('/api/checkout-config');if(!r.ok)return;const c=await r.json();settings.checkoutEnabled=c.enabled===true&&c.provider==='stripe';settings.checkoutMessage=c.message;if($('bagDialog').open)renderBag()}catch{}}
async function startCheckout(){
 const notice=$('checkoutNotice');notice.hidden=false;
 if(!settings.checkoutEnabled){notice.textContent=settings.checkoutMessage||'Online checkout is currently unavailable. Contact us about your selection.';return}
 const button=$('checkout');button.disabled=true;notice.textContent='Connecting securely to Stripe…';
 try{const signature=JSON.stringify(bag),previous=read('daliy-checkout-attempt',{});const checkoutId=previous?.signature===signature&&typeof previous.id==='string'?previous.id:crypto.randomUUID();save('daliy-checkout-attempt',{signature,id:checkoutId});
 const items=bag.map(l=>{const p=products.find(p=>p.id===l.id),v=p.variants.find(v=>v.id===l.variantId);return {...l,size:'One size',colour:v.label}});
 const r=await fetch('/api/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items,checkoutId})});const result=await r.json();if(!r.ok)throw Error(result.error||'Checkout is unavailable.');
 const target=new URL(result.url);if(target.protocol!=='https:'||target.hostname!=='checkout.stripe.com')throw Error('The checkout address could not be verified.');
 save('daliy-pending-purchase',{sessionId:result.sessionId,items:bag});location.assign(target.href);
 }catch(e){notice.textContent=e.message||'Could not connect to Stripe. Your bag is saved.';button.disabled=false}
}
async function checkPaymentReturn(){const q=new URLSearchParams(location.search),id=q.get('session_id');if(q.get('checkout')==='cancelled'){toast('Checkout cancelled. Your bag is saved.');return}if(!id||!/^cs_(test|live)_[A-Za-z0-9]+$/.test(id))return;
 $('infoTitle').textContent='Payment status';$('infoText').textContent='Checking your payment with the store…';show('infoDialog');
 try{const r=await fetch('/api/payment-status?session_id='+encodeURIComponent(id));if(!r.ok)throw Error();const data=await r.json();if(data.status==='paid'){$('infoText').textContent='Your payment is confirmed. Your order has been received.';const pending=read('daliy-pending-purchase',{});if(pending?.sessionId===id&&Array.isArray(pending.items)){bag=bag.map(l=>({...l,qty:l.qty-(pending.items.find(x=>lineKey(x)===lineKey(l))?.qty||0)})).filter(l=>l.qty>0);persist();save('daliy-pending-purchase',{});save('daliy-checkout-attempt',{})}}else $('infoText').textContent=data.status==='failed'?'Payment was not completed. Your bag has been kept.':'Your payment is awaiting confirmation. Please check your Stripe receipt before trying to pay again.'}catch{$('infoText').textContent='Payment status could not be checked. Please check your Stripe receipt before trying to pay again.'}
}

// Native horizontal browsing also supports explicit controls and keyboard navigation.
const highlightsRail=$('highlightsRail');
if(highlightsRail){
  const railButtons=[...document.querySelectorAll('[data-rail-step]')];
  const updateRail=()=>{const end=highlightsRail.scrollWidth-highlightsRail.clientWidth;railButtons.forEach(b=>{b.disabled=Number(b.dataset.railStep)<0?highlightsRail.scrollLeft<=2:highlightsRail.scrollLeft>=end-2})};
  const moveRail=direction=>{const card=highlightsRail.querySelector('.highlight-card');const gap=parseFloat(getComputedStyle(highlightsRail).gap)||20;highlightsRail.scrollBy({left:direction*(card.getBoundingClientRect().width+gap),behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})};
  railButtons.forEach(b=>b.addEventListener('click',()=>moveRail(Number(b.dataset.railStep))));
  highlightsRail.addEventListener('scroll',updateRail,{passive:true});
  highlightsRail.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();moveRail(e.key==='ArrowRight'?1:-1)}});
  new ResizeObserver(updateRail).observe(highlightsRail);updateRail();
}
