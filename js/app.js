// ==================== APP DATA ====================
let prods=[
  {id:1,name:'Samsung 65" QLED TV',sku:'SM-Q65-24',cat:'TV & Display',brand:'Samsung',sp:89999,cp:72000,stock:8,alert:3,gst:18,war:24},
  {id:2,name:'iPhone 15 128GB',sku:'APL-IP15-128',cat:'Mobile & Tablets',brand:'Apple',sp:79999,cp:65000,stock:4,alert:5,gst:18,war:12},
  {id:3,name:'Sony WH-1000XM5',sku:'SNY-WH5',cat:'Audio',brand:'Sony',sp:29999,cp:22000,stock:2,alert:3,gst:18,war:12},
  {id:4,name:'Dell Inspiron 15 i5',sku:'DEL-INS15',cat:'Laptops',brand:'Dell',sp:62999,cp:51000,stock:0,alert:2,gst:18,war:12},
  {id:5,name:'Canon EOS R50',sku:'CAN-R50',cat:'Cameras',brand:'Canon',sp:74999,cp:60000,stock:6,alert:2,gst:18,war:24},
  {id:6,name:'boAt Airdopes 141',sku:'BOA-141',cat:'Audio',brand:'boAt',sp:1499,cp:800,stock:22,alert:8,gst:18,war:12},
  {id:7,name:'OnePlus TV 43"',sku:'OP-TV43',cat:'TV & Display',brand:'OnePlus',sp:29999,cp:22000,stock:5,alert:3,gst:18,war:12},
  {id:8,name:'MacBook Air M2',sku:'APL-MBA-M2',cat:'Laptops',brand:'Apple',sp:114999,cp:95000,stock:3,alert:2,gst:18,war:12},
  {id:9,name:'Realme Narzo 60',sku:'RM-N60',cat:'Mobile & Tablets',brand:'Realme',sp:17999,cp:13000,stock:12,alert:5,gst:18,war:12},
  {id:10,name:'JBL Flip 6',sku:'JBL-F6',cat:'Audio',brand:'JBL',sp:11999,cp:8000,stock:1,alert:4,gst:18,war:12},
];
let sales=[];
let adjLog=[];
let nextId=11,nextSaleId=1001;
let billItems=[],selBillProd=null,lastSale=null;
let nextGstBillId=1;
let invPage=1,invPageSz=15,invCatFilter='',invStockFilter='';
let histPage=1,histPageSz=12,histFilter='all',histPay='';
let adjSelProd=null;

// ==================== HELPERS ====================
const D=id=>document.getElementById(id);
const fmt=n=>'₹'+Math.round(n).toLocaleString('en-IN');
const fmtDT=d=>{const x=new Date(d);return x.toLocaleDateString('en-IN')+' '+x.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})};
const fmtD=d=>new Date(d).toLocaleDateString('en-IN');

// ==================== THEME ====================
function applyTheme(theme){
  document.documentElement.setAttribute('data-theme',theme);
  localStorage.setItem('electroshop_theme',theme);
  const btn=D('theme-btn');
  if(btn) btn.innerHTML=theme==='dark'?'&#9788;':'&#9790;';
}
function toggleTheme(){
  const cur=document.documentElement.getAttribute('data-theme')||'light';
  applyTheme(cur==='dark'?'light':'dark');
}
(function(){const saved=localStorage.getItem('electroshop_theme');if(saved)applyTheme(saved);})();

// ==================== TAB NAVIGATION ====================
const tabMap={dash:0,inv:1,bill:2,hist:3,report:4,staff:5,admin:6,perf:7,profile:8};

function showTab(t,el,skipHistory){
  document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(b=>b.classList.remove('active'));
  D('tab-'+t).classList.add('active');
  const tabs=document.querySelectorAll('.tab');
  if(el)el.classList.add('active');
  else if(tabMap[t]!=null && tabs[tabMap[t]]) tabs[tabMap[t]].classList.add('active');
  if(t==='dash')renderDash();
  if(t==='inv'){populateCatFilter();renderInv();}
  if(t==='bill'){genInvNo();}
  if(t==='hist')renderHist();
  if(t==='report'){if(!D('rep-date').value)D('rep-date').value=new Date().toISOString().split('T')[0];renderReport();}
  if(t==='staff'){initStaffTab();}
  if(t==='admin'){renderAdjLog();renderLowStockList();}
  if(t==='perf'){renderStaffPerf();}
  if(t==='profile'){renderProfile();}
  // Push tab into browser history so back/forward buttons work
  if(!skipHistory){
    history.pushState({tab:t},'',' #'+t);
  }
}

// Handle browser back/forward buttons
window.addEventListener('popstate',function(e){
  if(e.state && e.state.tab){
    showTab(e.state.tab,null,true);
  } else {
    showTab('dash',null,true);
  }
});

// ==================== INVENTORY ====================
function stockBadge(p){
  if(p.stock===0)return '<span class="badge bout"><span class="status-dot dot-r"></span>Out of stock</span>';
  if(p.stock<=p.alert)return '<span class="badge blow"><span class="status-dot dot-y"></span>Low stock</span>';
  return '<span class="badge bok"><span class="status-dot dot-g"></span>In stock</span>';
}

function populateCatFilter(){
  const sel=D('icat-sel');
  const cats=[...new Set(prods.map(p=>p.cat))].sort();
  sel.innerHTML='<option value="">All Categories</option>'+cats.map(c=>`<option value="${c}">${c}</option>`).join('');
}

function renderInv(){
  const q=(D('isrch').value||'').toLowerCase();
  let rows=prods.filter(p=>{
    if(invCatFilter&&p.cat!==invCatFilter)return false;
    if(invStockFilter==='ok'&&(p.stock===0||p.stock<=p.alert))return false;
    if(invStockFilter==='low'&&(p.stock===0||p.stock>p.alert))return false;
    if(invStockFilter==='out'&&p.stock!==0)return false;
    if(q&&!p.name.toLowerCase().includes(q)&&!(p.sku||'').toLowerCase().includes(q)&&!(p.brand||'').toLowerCase().includes(q)&&!p.cat.toLowerCase().includes(q))return false;
    return true;
  });
  const total=rows.length,pages=Math.ceil(total/invPageSz)||1;
  if(invPage>pages)invPage=1;
  const slice=rows.slice((invPage-1)*invPageSz,invPage*invPageSz);
  D('inv-body').innerHTML=slice.map(p=>`<tr>
    <td style="max-width:180px" title="${p.name}"><strong>${p.name}</strong></td>
    <td style="color:#64748b">${p.sku||'—'}</td>
    <td>${p.cat}</td><td>${p.brand||'—'}</td>
    <td style="font-weight:600">${fmt(p.sp)}</td>
    <td style="color:#64748b">${fmt(p.cp)}</td>
    <td>${p.gst}%</td>
    <td>${p.war?p.war+'m':'—'}</td>
    <td><input type="number" value="${p.stock}" min="0" style="width:56px;padding:4px 6px;font-size:11px;text-align:center" onchange="inlineStock(${p.id},this.value)"></td>
    <td>${stockBadge(p)}</td>
    <td><button class="btn btd" onclick="delProd(${p.id})" style="padding:3px 8px;font-size:11px">Remove</button></td>
  </tr>`).join('');
  D('inv-pg').innerHTML=`<button class="btn" onclick="invPage=Math.max(1,invPage-1);renderInv()" ${invPage<=1?'disabled':''}>&#8592; Prev</button><span>Page ${invPage} / ${pages} &nbsp;&bull;&nbsp; ${total} products</span><button class="btn" onclick="invPage=Math.min(${pages},invPage+1);renderInv()" ${invPage>=pages?'disabled':''}>Next &#8594;</button>`;
}

function addProd(){
  if(!currentUser||currentUser.role!=='admin'){alert('Only admin can add products.');return;}
  const name=D('pn').value.trim();
  if(!name){alert('Please enter a product name.');return;}
  prods.push({id:nextId++,name,sku:D('psku').value||'—',cat:D('pcat').value,brand:D('pbrand').value||'',
    sp:parseFloat(D('psp').value)||0,cp:parseFloat(D('pcp').value)||0,
    stock:parseInt(D('pst').value)||0,alert:parseInt(D('palt').value)||5,
    gst:parseInt(D('pgst').value)||18,war:parseInt(D('pwar').value)||0});
  clearPF();populateCatFilter();renderInv();autoSave();
}
function clearPF(){['pn','psku','pbrand','psp','pcp','pst','pwar'].forEach(i=>D(i).value='');D('palt').value='5';D('pgst').value='18';}
function inlineStock(id,v){if(!currentUser||currentUser.role!=='admin'){alert('Only admin can edit stock.');renderInv();return;}const p=prods.find(x=>x.id===id);if(p){p.stock=Math.max(0,parseInt(v)||0);autoSave();}}
function delProd(id){if(!currentUser||currentUser.role!=='admin'){alert('Only admin can delete products.');return;}if(confirm('Remove this product from inventory?')){prods=prods.filter(x=>x.id!==id);renderInv();autoSave();}}

// ==================== BILLING ====================
function genInvNo(){
  D('cinv').value='INV-'+nextSaleId;
  D('cgstbill').value='GST-'+String(nextGstBillId).padStart(4,'0');
  // Show sold-by dropdown for admin
  const wrap=D('sold-by-wrap');
  if(wrap) wrap.style.display=(currentUser&&currentUser.role==='admin')?'':'none';
  if(currentUser&&currentUser.role==='admin') populateSoldByDropdown();
}

async function populateSoldByDropdown(){
  const sel=D('csoldby');
  if(!sel)return;
  const users=await getUsers();
  const list=Object.entries(users).map(([u,d])=>({username:u,name:d.name,role:d.role}));
  sel.innerHTML='<option value="">-- Current User ('+((currentUser&&currentUser.name)||'')+') --</option>'+list.map(u=>`<option value="${u.username}">${u.name} (${u.role})</option>`).join('');
}

function toggleGstBillNo(){
  const isGst=D('cbilltype').value==='gst';
  D('gst-billno-wrap').style.display=isGst?'':'none';
}
function filterBillProds(){
  const q=D('bsrch').value.toLowerCase();
  const sugg=D('bsugg');
  if(!q){sugg.style.display='none';return;}
  const res=prods.filter(p=>p.stock>0&&(p.name.toLowerCase().includes(q)||(p.sku||'').toLowerCase().includes(q)||(p.brand||'').toLowerCase().includes(q))).slice(0,8);
  if(!res.length){sugg.style.display='none';return;}
  sugg.style.display='block';
  sugg.innerHTML=res.map(p=>`<div class="sugg-item" onmousedown="selectBillProd(${p.id})">
    <span><strong>${p.name}</strong> <span style="color:#64748b;font-size:11px">${p.sku}</span></span>
    <span style="color:#16a34a;font-weight:600">${fmt(p.sp)} &nbsp;<span style="color:#64748b;font-weight:400">Stock: ${p.stock}</span></span>
  </div>`).join('');
}
function selectBillProd(id){
  selBillProd=prods.find(p=>p.id===id);
  D('bsrch').value=selBillProd.name;
  D('bprice').value=selBillProd.sp;
  D('bgst').value=selBillProd.gst;
  D('bsugg').style.display='none';
}

function itemNet(i){return i.qty*i.price*(1-i.disc/100);}
function itemGSTAmt(i){return itemNet(i)*i.gst/100;}
function itemTotal(i){return itemNet(i)+itemGSTAmt(i);}
function itemProfit(i){return itemNet(i)-i.qty*i.cp;}

function addBillItem(){
  if(!selBillProd){alert('Please select a product first.');return;}
  const qty=parseInt(D('bqty').value)||1;
  if(qty>selBillProd.stock){alert('Only '+selBillProd.stock+' units in stock!');return;}
  const price=parseFloat(D('bprice').value)||selBillProd.sp;
  const disc=parseFloat(D('bdisc').value)||0;
  const ex=billItems.find(i=>i.id===selBillProd.id);
  if(ex){const newQty=ex.qty+qty;if(newQty>selBillProd.stock){alert('Not enough stock.');return;}ex.qty=newQty;}
  else billItems.push({id:selBillProd.id,name:selBillProd.name,qty,price,cp:selBillProd.cp,disc,gst:selBillProd.gst});
  D('bsrch').value='';D('bqty').value=1;D('bdisc').value=0;D('bprice').value='';D('bgst').value='';selBillProd=null;
  renderBill();
}
function removeBillItem(idx){billItems.splice(idx,1);renderBill();}
function renderBill(){
  const el=D('bill-list'),sumEl=D('bill-summary');
  if(!billItems.length){el.innerHTML='<p style="color:#94a3b8;padding:8px 0">No items added yet.</p>';sumEl.style.display='none';return;}
  el.innerHTML=billItems.map((it,i)=>`<div class="bill-row">
    <span title="${it.name}" style="overflow:hidden;text-overflow:ellipsis"><strong>${it.name}</strong>${it.disc>0?` <span style="color:#d97706;font-size:10px">-${it.disc}%</span>`:''}
      <br><span style="font-size:10px;color:#64748b">${fmt(it.price)}/unit &bull; GST: ${it.gst}%</span></span>
    <span style="text-align:center;color:#64748b">x${it.qty}</span>
    <span style="font-weight:600">${fmt(itemTotal(it))}</span>
    <span style="color:#16a34a;font-size:11px">+${fmt(itemProfit(it))}</span>
    <button onclick="removeBillItem(${i})" style="border:none;background:none;cursor:pointer;color:#ef4444;font-size:16px;line-height:1">&times;</button>
  </div>`).join('');
  const sub=billItems.reduce((s,i)=>s+itemNet(i),0);
  const gstAmt=billItems.reduce((s,i)=>s+itemGSTAmt(i),0);
  const total=sub+gstAmt;
  const profit=billItems.reduce((s,i)=>s+itemProfit(i),0);
  sumEl.style.display='block';
  sumEl.innerHTML=`
    <div style="display:flex;justify-content:space-between;font-size:12px;color:#64748b;margin-bottom:3px"><span>Subtotal (before GST)</span><span>${fmt(sub)}</span></div>
    <div style="display:flex;justify-content:space-between;font-size:12px;color:#64748b;margin-bottom:3px"><span>GST Amount</span><span>${fmt(gstAmt)}</span></div>
    <div style="display:flex;justify-content:space-between;font-size:15px;font-weight:700;margin-top:6px;padding-top:8px;border-top:2px solid #e5e7eb"><span>Grand Total</span><span style="color:#1a1a2e">${fmt(total)}</span></div>
    <div style="font-size:11px;color:#16a34a;text-align:right;margin-top:3px">Est. Profit: ${fmt(profit)}</div>`;
}

function completeSale(){
  if(!billItems.length){alert('Please add items to the bill first.');return;}
  const cname=D('cname').value||'Walk-in customer';
  const items=billItems.map(i=>({...i}));
  items.forEach(item=>{const p=prods.find(x=>x.id===item.id);if(p)p.stock=Math.max(0,p.stock-item.qty);});
  const sub=items.reduce((s,i)=>s+itemNet(i),0);
  const gstAmt=items.reduce((s,i)=>s+itemGSTAmt(i),0);
  const total=sub+gstAmt;
  const profit=items.reduce((s,i)=>s+itemProfit(i),0);
  // Determine soldBy
  let soldBy=currentUser?{username:currentUser.username,name:currentUser.name}:{username:'unknown',name:'Unknown'};
  const overrideUser=D('csoldby')?D('csoldby').value:'';
  if(currentUser&&currentUser.role==='admin'&&overrideUser){
    const opt=D('csoldby');
    const name=opt.options[opt.selectedIndex].text.replace(/\s*\(.*\)$/,'');
    soldBy={username:overrideUser,name};
  }
  // GST bill info
  const billType=D('cbilltype').value;
  const gstBillNo=billType==='gst'?(D('cgstbill').value||'GST-'+String(nextGstBillId).padStart(4,'0')):'';
  if(billType==='gst') nextGstBillId++;
  const invoiceId=D('cinv').value||('INV-'+nextSaleId);
  nextSaleId++;
  const sale={id:invoiceId,date:new Date(),customer:cname,phone:D('cphone').value,items,payment:D('cpay').value,notes:D('cnotes').value,sub,gstAmt,total,profit,soldBy,billType,gstBillNo};
  sales.unshift(sale);lastSale=sale;
  D('rcpt-box').style.display='block';
  D('rcpt-box').innerHTML=`
    <div style="text-align:center;font-weight:700;font-size:14px;margin-bottom:10px;color:#1a1a2e">&#9889; ElectroShop &mdash; Receipt</div>
    <div class="rl"><span style="color:#64748b">Invoice</span><span style="font-weight:600;color:#2563eb">${sale.id}</span></div>
    ${sale.gstBillNo?`<div class="rl"><span style="color:#64748b">GST Bill No.</span><span style="font-weight:600;color:#7c3aed">${sale.gstBillNo}</span></div>`:''}
    <div class="rl"><span style="color:#64748b">Bill Type</span><span>${sale.billType==='gst'?'<span style="color:#7c3aed;font-weight:600">GST Bill</span>':'Non-GST Bill'}</span></div>
    <div class="rl"><span style="color:#64748b">Customer</span><span>${cname}</span></div>
    ${sale.phone?`<div class="rl"><span style="color:#64748b">Phone</span><span>${sale.phone}</span></div>`:''}
    <div class="rl"><span style="color:#64748b">Date</span><span>${fmtDT(sale.date)}</span></div>
    <div class="rl"><span style="color:#64748b">Payment</span><span>${sale.payment}</span></div>
    <div class="rl"><span style="color:#64748b">Sold By</span><span>${sale.soldBy?sale.soldBy.name:'—'}</span></div>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:8px 0">
    ${items.map(i=>`<div class="rl"><span>${i.name} x${i.qty}${i.disc>0?' (-'+i.disc+'%)':''}</span><span>${fmt(itemTotal(i))}</span></div>`).join('')}
    <div class="rl" style="color:#64748b"><span>GST Total</span><span>${fmt(gstAmt)}</span></div>
    <div class="rl tot"><span>GRAND TOTAL</span><span style="color:#16a34a">${fmt(total)}</span></div>
    ${sale.notes?`<div style="margin-top:6px;font-size:11px;color:#64748b;background:#f8fafc;padding:6px 8px;border-radius:4px">Note: ${sale.notes}</div>`:''}`;
  D('exp-rcpt').disabled=false;
  billItems=[];renderBill();
  ['cname','cphone','cnotes'].forEach(i=>D(i).value='');
  D('cbilltype').value='non-gst';toggleGstBillNo();
  if(D('csoldby'))D('csoldby').value='';
  genInvNo();
  autoSave();
}
function clearBill(){billItems=[];renderBill();D('rcpt-box').style.display='none';D('exp-rcpt').disabled=true;}

let histStaff='';

// ==================== SALES HISTORY ====================
function renderHist(){
  const q=(D('hsrch').value||'').toLowerCase();
  const now=new Date();
  let rows=sales.filter(s=>{
    if(histFilter==='today'&&s.date.toDateString()!==now.toDateString())return false;
    if(histFilter==='week'&&(now-s.date)>7*86400000)return false;
    if(histFilter==='month'&&(now-s.date)>30*86400000)return false;
    if(histPay&&s.payment!==histPay)return false;
    if(histStaff&&(!s.soldBy||s.soldBy.username!==histStaff))return false;
    if(q&&!s.customer.toLowerCase().includes(q)&&!s.id.toLowerCase().includes(q)&&!(s.phone||'').includes(q)&&!s.items.some(i=>i.name.toLowerCase().includes(q))&&!(s.soldBy&&s.soldBy.name.toLowerCase().includes(q)))return false;
    return true;
  });
  // Populate staff filter dropdown
  const staffNames={};
  sales.forEach(s=>{if(s.soldBy)staffNames[s.soldBy.username]=s.soldBy.name;});
  const staffSel=D('hist-staff-sel');
  if(staffSel){
    const prev=staffSel.value;
    staffSel.innerHTML='<option value="">All Staff</option>'+Object.entries(staffNames).map(([u,n])=>`<option value="${u}">${n}</option>`).join('');
    staffSel.value=prev||'';
  }
  const pages=Math.ceil(rows.length/histPageSz)||1;
  if(histPage>pages)histPage=1;
  const slice=rows.slice((histPage-1)*histPageSz,histPage*histPageSz);
  D('hist-body').innerHTML=slice.map(s=>`<tr>
    <td style="font-weight:600;color:#2563eb">${s.id}</td>
    <td style="font-size:11px">${s.gstBillNo?'<span style="color:#7c3aed;font-weight:600">'+s.gstBillNo+'</span>':'<span style="color:#94a3b8">—</span>'}</td>
    <td>${fmtDT(s.date)}</td>
    <td>${s.customer}</td>
    <td style="color:#64748b">${s.phone||'—'}</td>
    <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis" title="${s.items.map(i=>i.name+' x'+i.qty).join(', ')}">${s.items.map(i=>i.name+(i.qty>1?' x'+i.qty:'')).join(', ')}</td>
    <td><span class="badge" style="background:#eff6ff;color:#1d4ed8">${s.payment}</span></td>
    <td>${fmt(s.sub)}</td>
    <td style="color:#64748b">${fmt(s.gstAmt)}</td>
    <td style="font-weight:700">${fmt(s.total)}</td>
    <td style="color:#16a34a;font-weight:600">${fmt(s.profit)}</td>
    <td style="font-size:11px;min-width:100px">${s.soldBy?s.soldBy.name:'<span style="color:#94a3b8">—</span>'}</td>
    <td style="white-space:nowrap">${currentUser&&currentUser.role==='admin'?`<button class="btn btp" onclick="openEditSale('${s.id}')" style="padding:2px 8px;font-size:10px" title="Edit sale">&#9998;</button> <button class="btn btd" onclick="deleteSale('${s.id}')" style="padding:2px 8px;font-size:10px" title="Delete sale &amp; restore stock">&#128465;</button>`:''}</td>
  </tr>`).join('');
  if(!slice.length)D('hist-body').innerHTML='<tr><td colspan="13" style="text-align:center;color:#94a3b8;padding:24px">No sales found.</td></tr>';
  D('hist-pg').innerHTML=`<button class="btn" onclick="histPage=Math.max(1,histPage-1);renderHist()" ${histPage<=1?'disabled':''}>&#8592; Prev</button><span>Page ${histPage}/${pages} &bull; ${rows.length} sales</span><button class="btn" onclick="histPage=Math.min(${pages},histPage+1);renderHist()" ${histPage>=pages?'disabled':''}>Next &#8594;</button>`;
}

// ==================== EDIT SALE MODAL ====================
let editingSaleId=null;

async function openEditSale(saleId){
  if(!currentUser||currentUser.role!=='admin'){alert('Only admin can edit sales.');return;}
  const sale=sales.find(s=>s.id===saleId);
  if(!sale)return;
  editingSaleId=saleId;
  const overlay=D('edit-sale-overlay');
  overlay.style.display='flex';
  D('edit-sale-id').textContent=saleId;
  D('es-customer').value=sale.customer||'';
  D('es-phone').value=sale.phone||'';
  D('es-payment').value=sale.payment||'Cash';
  D('es-billtype').value=sale.billType||'non-gst';
  D('es-gstbill').value=sale.gstBillNo||'';
  D('es-invno').value=sale.id||'';
  D('es-notes').value=sale.notes||'';
  // Populate sold-by dropdown
  const sel=D('es-soldby');
  try{
    const users=await getUsers();
    const list=Object.entries(users).map(([u,d])=>({username:u,name:d.name,role:d.role}));
    const curUser=sale.soldBy?sale.soldBy.username:'';
    sel.innerHTML='<option value="">-- None --</option>'+list.map(u=>`<option value="${u.username}" ${u.username===curUser?'selected':''}>${u.name} (${u.role})</option>`).join('');
  }catch(e){sel.innerHTML='<option value="">Error loading users</option>';}
}

function closeEditSale(){
  D('edit-sale-overlay').style.display='none';
  editingSaleId=null;
}

function saveEditSale(){
  if(!editingSaleId)return;
  const sale=sales.find(s=>s.id===editingSaleId);
  if(!sale)return;
  const newId=D('es-invno').value.trim();
  if(newId&&newId!==sale.id){
    if(sales.some(s=>s.id===newId&&s!==sale)){alert('Invoice number already exists.');return;}
    sale.id=newId;
  }
  sale.customer=D('es-customer').value.trim()||'Walk-in customer';
  sale.phone=D('es-phone').value.trim();
  sale.payment=D('es-payment').value;
  sale.billType=D('es-billtype').value;
  sale.gstBillNo=D('es-billtype').value==='gst'?D('es-gstbill').value.trim():'';
  sale.notes=D('es-notes').value.trim();
  const selUser=D('es-soldby').value;
  if(!selUser){sale.soldBy=null;}
  else{
    const opt=D('es-soldby');
    const name=opt.options[opt.selectedIndex].text.replace(/\s*\(.*\)$/,'');
    sale.soldBy={username:selUser,name};
  }
  autoSave();
  closeEditSale();
  renderHist();
}

document.addEventListener('click',function(e){
  if(e.target&&e.target.id==='edit-sale-overlay') closeEditSale();
});

// ==================== DELETE SALE ====================
function deleteSale(saleId){
  if(!currentUser||currentUser.role!=='admin'){alert('Only admin can delete sales.');return;}
  const idx=sales.findIndex(s=>s.id===saleId);
  if(idx===-1){alert('Sale not found.');return;}
  const sale=sales[idx];
  const itemList=sale.items.map(i=>i.name+' x'+i.qty).join(', ');
  if(!confirm('Delete sale '+saleId+'?\n\nCustomer: '+sale.customer+'\nTotal: ₹'+Math.round(sale.total).toLocaleString('en-IN')+'\nItems: '+itemList+'\n\nStock will be restored for all items.'))return;
  // Restore stock for each item in the sale
  sale.items.forEach(item=>{
    const prod=prods.find(p=>p.id===item.id);
    if(prod) prod.stock+=item.qty;
  });
  // Log the deletion in adjLog
  adjLog.unshift({time:new Date(),prod:'[SALE DELETED] '+saleId,sku:sale.customer,type:'add',qty:sale.items.reduce((a,i)=>a+i.qty,0),before:'—',after:'Stock restored',note:'Deleted by '+currentUser.name+'. Total was ₹'+Math.round(sale.total)});
  // Remove the sale
  sales.splice(idx,1);
  autoSave();
  renderHist();
  alert('Sale '+saleId+' deleted. Stock has been restored.');
}

// ==================== DAILY REPORTS ====================
function renderReport(){
  const d=D('rep-date').value;if(!d)return;
  const dt=new Date(d);
  const daySales=sales.filter(s=>new Date(s.date).toDateString()===dt.toDateString());
  const rev=daySales.reduce((s,x)=>s+x.total,0);
  const profit=daySales.reduce((s,x)=>s+x.profit,0);
  const gst=daySales.reduce((s,x)=>s+x.gstAmt,0);
  const itemsSold=daySales.reduce((s,x)=>s+x.items.reduce((a,i)=>a+i.qty,0),0);
  D('rep-metrics').innerHTML=`
    <div class="metric"><div class="mlabel">Transactions</div><div class="mval b">${daySales.length}</div></div>
    <div class="metric"><div class="mlabel">Revenue</div><div class="mval">${fmt(rev)}</div></div>
    <div class="metric"><div class="mlabel">Profit</div><div class="mval g">${fmt(profit)}</div></div>
    <div class="metric"><div class="mlabel">GST Collected</div><div class="mval o">${fmt(gst)}</div></div>
    <div class="metric"><div class="mlabel">Items Sold</div><div class="mval b">${itemsSold}</div></div>`;
  if(!daySales.length){D('rep-content').innerHTML='<div class="card" style="text-align:center;color:#94a3b8;padding:32px">No sales recorded on this date.</div>';return;}
  const prodMap={};
  daySales.forEach(s=>s.items.forEach(i=>{if(!prodMap[i.name])prodMap[i.name]={qty:0,rev:0,profit:0};prodMap[i.name].qty+=i.qty;prodMap[i.name].rev+=itemTotal(i);prodMap[i.name].profit+=itemProfit(i);}));
  const sortedProds=Object.entries(prodMap).sort((a,b)=>b[1].rev-a[1].rev);
  const maxRev=sortedProds[0]?sortedProds[0][1].rev:1;
  D('rep-content').innerHTML=`
    <div class="card">
      <div class="card-title">Transactions on ${dt.toLocaleDateString('en-IN',{dateStyle:'long'})}</div>
      <table><thead><tr><th>Invoice</th><th>Customer</th><th>Phone</th><th>Items</th><th>Payment</th><th>Subtotal</th><th>GST</th><th>Total</th><th>Profit</th><th>Sold By</th></tr></thead>
      <tbody>${daySales.map(s=>`<tr>
        <td style="font-weight:600;color:#2563eb">${s.id}</td>
        <td>${s.customer}</td><td style="color:#64748b">${s.phone||'—'}</td>
        <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis">${s.items.map(i=>i.name+'x'+i.qty).join(', ')}</td>
        <td>${s.payment}</td><td>${fmt(s.sub)}</td><td style="color:#64748b">${fmt(s.gstAmt)}</td>
        <td style="font-weight:700">${fmt(s.total)}</td>
        <td style="color:#16a34a;font-weight:600">${fmt(s.profit)}</td>
        <td style="font-size:11px">${s.soldBy?s.soldBy.name:'<span style="color:#94a3b8">&mdash;</span>'}</td>
      </tr>`).join('')}</tbody></table>
    </div>
    <div class="card" style="margin:0">
      <div class="card-title">Product Performance</div>
      ${sortedProds.map(([name,d])=>`<div style="margin-bottom:10px">
        <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px">
          <span style="font-weight:600">${name}</span>
          <span style="color:#64748b">${d.qty} sold &bull; ${fmt(d.rev)} &bull; Profit: <span style="color:#16a34a">${fmt(d.profit)}</span></span>
        </div>
        <div class="prog-bar"><div class="prog-fill" style="width:${Math.round(d.rev/maxRev*100)}%"></div></div>
      </div>`).join('')}
    </div>`;
}

// ==================== DASHBOARD ====================
function renderDash(){
  const totalRev=sales.reduce((s,x)=>s+x.total,0);
  const totalProfit=sales.reduce((s,x)=>s+x.profit,0);
  const tod=new Date().toDateString();
  const todayRev=sales.filter(s=>new Date(s.date).toDateString()===tod).reduce((s,x)=>s+x.total,0);
  const lowCnt=prods.filter(p=>p.stock>0&&p.stock<=p.alert).length;
  const outCnt=prods.filter(p=>p.stock===0).length;
  D('dm').innerHTML=`
    <div class="metric"><div class="mlabel">Total Revenue</div><div class="mval">${fmt(totalRev)}</div></div>
    <div class="metric"><div class="mlabel">Total Profit</div><div class="mval g">${fmt(totalProfit)}</div></div>
    <div class="metric"><div class="mlabel">Today's Revenue</div><div class="mval b">${fmt(todayRev)}</div></div>
    <div class="metric"><div class="mlabel">Total Products</div><div class="mval">${prods.length}</div></div>`;
  let al='';
  if(outCnt)al+=`<div class="alert-box">&#9888; <strong>${outCnt} product(s) are out of stock.</strong> <a href="#" onclick="showTab('inv',document.querySelectorAll('.tab')[1]);return false" style="color:#92400e">View Inventory &rarr;</a></div>`;
  if(lowCnt)al+=`<div class="alert-box">&#128203; <strong>${lowCnt} product(s) are running low on stock.</strong> <a href="#" onclick="showTab('admin',document.querySelectorAll('.tab')[6]);return false" style="color:#92400e">View Alerts &rarr;</a></div>`;
  D('da').innerHTML=al;
  const wdays=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const dayVals=Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-6+i);return sales.filter(s=>new Date(s.date).toDateString()===d.toDateString()).reduce((s,x)=>s+x.total,0);});
  const maxV=Math.max(...dayVals,1);
  D('rev-bars').innerHTML=dayVals.map(v=>`<div class="mini-bar" style="height:${Math.round(v/maxV*90)+4}px" title="${fmt(v)}"></div>`).join('');
  D('rev-labels').innerHTML=Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-6+i);return `<div style="flex:1;font-size:10px;color:#94a3b8;text-align:center">${wdays[d.getDay()]}</div>`;}).join('');
  const catRev={};
  sales.forEach(s=>s.items.forEach(i=>{const p=prods.find(x=>x.id===i.id);if(p){catRev[p.cat]=(catRev[p.cat]||0)+itemTotal(i);}}));
  const catArr=Object.entries(catRev).sort((a,b)=>b[1]-a[1]);
  const maxCat=catArr[0]?catArr[0][1]:1;
  D('cat-breakdown').innerHTML=catArr.length?catArr.map(([cat,rev])=>`<div style="margin-bottom:8px">
    <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:2px"><span style="font-weight:500">${cat}</span><span style="color:#64748b">${fmt(rev)}</span></div>
    <div class="prog-bar"><div class="prog-fill" style="width:${Math.round(rev/maxCat*100)}%"></div></div>
  </div>`).join(''):'<p style="color:#94a3b8;font-size:12px;padding:8px 0">No sales yet. Make your first sale!</p>';
  const prodS={};
  sales.forEach(s=>s.items.forEach(i=>{if(!prodS[i.name])prodS[i.name]={qty:0,rev:0};prodS[i.name].qty+=i.qty;prodS[i.name].rev+=itemTotal(i);}));
  const top=Object.entries(prodS).sort((a,b)=>b[1].rev-a[1].rev).slice(0,5);
  D('top5').innerHTML=top.length?top.map(([n,d],idx)=>`<div style="display:flex;justify-content:space-between;padding:7px 10px;background:${idx%2?'#f9fafb':'#fff'};border-radius:4px;font-size:12px">
    <span><strong style="color:#2563eb">#${idx+1}</strong> &nbsp;${n}</span>
    <span style="color:#64748b">${d.qty} sold &mdash; <strong style="color:#1a1a2e">${fmt(d.rev)}</strong></span>
  </div>`).join(''):'<p style="color:#94a3b8;font-size:12px;padding:8px 0">No sales yet.</p>';
}

// ==================== ADMIN / STOCK ADJUSTMENT ====================
function filterAdjProds(){
  const q=D('adj-srch').value.toLowerCase();
  const sugg=D('adj-sugg');
  if(!q){sugg.style.display='none';return;}
  const res=prods.filter(p=>p.name.toLowerCase().includes(q)||(p.sku||'').toLowerCase().includes(q)).slice(0,8);
  if(!res.length){sugg.style.display='none';return;}
  sugg.style.display='block';
  sugg.innerHTML=res.map(p=>`<div class="sugg-item" onmousedown="selectAdjProd(${p.id})">
    <span>${p.name} <span style="color:#64748b;font-size:11px">${p.sku}</span></span>
    <span style="color:#64748b">Stock: <strong>${p.stock}</strong></span>
  </div>`).join('');
}
function selectAdjProd(id){
  adjSelProd=prods.find(p=>p.id===id);
  D('adj-srch').value=adjSelProd.name;
  D('adj-sugg').style.display='none';
  D('adj-selected').style.display='block';
  D('adj-name').textContent=adjSelProd.name+' — '+adjSelProd.sku;
  D('adj-cur').value=adjSelProd.stock;
  D('adj-qty').value=1;
}
function applyAdj(){
  if(!currentUser||currentUser.role!=='admin'){alert('Only admin can adjust stock.');return;}
  if(!adjSelProd){alert('Select a product.');return;}
  const type=D('adj-type').value,qty=parseInt(D('adj-qty').value)||0,note=D('adj-note').value||'—';
  const before=adjSelProd.stock;
  if(type==='add')adjSelProd.stock+=qty;
  else if(type==='sub')adjSelProd.stock=Math.max(0,adjSelProd.stock-qty);
  else adjSelProd.stock=Math.max(0,qty);
  adjLog.unshift({time:new Date(),prod:adjSelProd.name,sku:adjSelProd.sku,type,qty,before,after:adjSelProd.stock,note});
  D('adj-cur').value=adjSelProd.stock;
  renderAdjLog();renderLowStockList();
  D('adj-note').value='';
  autoSave();
  alert('Stock updated successfully!\n'+adjSelProd.name+': '+before+' → '+adjSelProd.stock);
}
function renderAdjLog(){
  D('adj-log').innerHTML=adjLog.length?adjLog.map(l=>`<div style="padding:7px 0;border-bottom:1px solid #f1f5f9">
    <div style="display:flex;justify-content:space-between">
      <span style="font-weight:600;font-size:12px">${l.prod}</span>
      <span class="badge ${l.type==='add'?'bok':l.type==='sub'?'bout':'blow'}">${l.type==='add'?'+'+l.qty:l.type==='sub'?'-'+l.qty:'Set '+l.qty}</span>
    </div>
    <div style="font-size:11px;color:#64748b">${fmtDT(l.time)} &bull; ${l.before} &rarr; ${l.after}</div>
    <div style="font-size:11px;color:#94a3b8;font-style:italic">${l.note}</div>
  </div>`).join(''):'<p style="color:#94a3b8;font-size:12px;padding:8px 0">No adjustments yet.</p>';
}
function renderLowStockList(){
  const list=prods.filter(p=>p.stock<=p.alert).sort((a,b)=>a.stock-b.stock);
  D('low-stock-list').innerHTML=list.length?list.map(p=>`<div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #f1f5f9;align-items:center">
    <div>
      <div style="font-weight:600;font-size:12px">${p.name}</div>
      <div style="font-size:11px;color:#64748b">${p.sku} &bull; ${p.cat} &bull; ${p.brand}</div>
    </div>
    <div style="text-align:right">${stockBadge(p)}<div style="font-size:10px;color:#64748b;margin-top:2px">Alert: ${p.alert}</div></div>
  </div>`).join(''):'<p style="color:#16a34a;font-size:12px;padding:8px 0">&#10003; All products are well stocked!</p>';
}

// ==================== EXCEL EXPORTS ====================
function xlsxDown(filename,sheets){
  const wb=XLSX.utils.book_new();
  sheets.forEach(({name,data})=>{
    const ws=XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb,ws,name);
  });
  XLSX.writeFile(wb,filename);
}

function exportInventory(){
  const hdr=['ID','Product Name','SKU','Category','Brand','Selling Price (₹)','Cost Price (₹)','Stock Qty','Low Stock Alert','GST %','Warranty (months)','Margin %','Status'];
  xlsxDown('ElectroShop_Inventory.xlsx',[{name:'Inventory',data:[hdr,...prods.map(p=>[p.id,p.name,p.sku,p.cat,p.brand||'',Math.round(p.sp),Math.round(p.cp),p.stock,p.alert,p.gst,p.war||0,(((p.sp-p.cp)/p.sp)*100).toFixed(1)+'%',p.stock===0?'Out of Stock':p.stock<=p.alert?'Low Stock':'In Stock'])]}]);
}

function exportSalesXLSX(){
  const hdr=['Invoice','Date','Time','Customer','Phone','Product','Qty','Unit Price','Discount%','GST%','Item Subtotal','GST Amount','Item Total','Profit','Payment','Notes'];
  const rows=[];
  sales.forEach(s=>s.items.forEach(i=>rows.push([s.id,new Date(s.date).toLocaleDateString('en-IN'),new Date(s.date).toLocaleTimeString('en-IN'),s.customer,s.phone||'',i.name,i.qty,Math.round(i.price),i.disc,i.gst,Math.round(itemNet(i)),Math.round(itemGSTAmt(i)),Math.round(itemTotal(i)),Math.round(itemProfit(i)),s.payment,s.notes||''])));
  xlsxDown('ElectroShop_Sales.xlsx',[{name:'Sales',data:[hdr,...rows]}]);
}

function exportLowStock(){
  const hdr=['Product Name','SKU','Category','Brand','Selling Price','Cost Price','Current Stock','Alert Level','Status'];
  const rows=prods.filter(p=>p.stock<=p.alert);
  xlsxDown('ElectroShop_LowStock.xlsx',[{name:'Low Stock',data:[hdr,...rows.map(p=>[p.name,p.sku,p.cat,p.brand||'',Math.round(p.sp),Math.round(p.cp),p.stock,p.alert,p.stock===0?'Out of Stock':'Low Stock'])]}]);
}

function exportProfit(){
  const pm={};
  sales.forEach(s=>s.items.forEach(i=>{if(!pm[i.id])pm[i.id]={name:i.name,sold:0,rev:0,profit:0};pm[i.id].sold+=i.qty;pm[i.id].rev+=itemTotal(i);pm[i.id].profit+=itemProfit(i);}));
  const hdr=['Product','Category','Brand','Selling Price','Cost Price','Margin%','Units Sold','Total Revenue','Total Profit'];
  xlsxDown('ElectroShop_Profit.xlsx',[{name:'Profit Report',data:[hdr,...prods.map(p=>{const s=pm[p.id]||{sold:0,rev:0,profit:0};return[p.name,p.cat,p.brand||'',Math.round(p.sp),Math.round(p.cp),(((p.sp-p.cp)/p.sp)*100).toFixed(1)+'%',s.sold,Math.round(s.rev),Math.round(s.profit)];})]}]);
}

function exportLastReceipt(){
  if(!lastSale)return;
  const hdr=['Invoice','Date','Customer','Phone','Product','Qty','Unit Price','Discount%','GST%','Item Total','Payment','Notes'];
  xlsxDown('Receipt_'+lastSale.id+'.xlsx',[{name:'Receipt',data:[hdr,...lastSale.items.map(i=>[lastSale.id,fmtDT(lastSale.date),lastSale.customer,lastSale.phone||'',i.name,i.qty,Math.round(i.price),i.disc,i.gst,Math.round(itemTotal(i)),lastSale.payment,lastSale.notes||''])]}]);
}

function exportDayXLSX(){
  const d=D('rep-date').value;if(!d)return;
  const dt=new Date(d);
  const daySales=sales.filter(s=>new Date(s.date).toDateString()===dt.toDateString());
  if(!daySales.length){alert('No sales on this date.');return;}
  const hdr=['Invoice','Time','Customer','Phone','Product','Qty','Unit Price','Disc%','GST%','Item Total','Payment','Profit','Notes'];
  const rows=[];
  daySales.forEach(s=>s.items.forEach(i=>rows.push([s.id,fmtDT(s.date),s.customer,s.phone||'',i.name,i.qty,Math.round(i.price),i.disc,i.gst,Math.round(itemTotal(i)),s.payment,Math.round(itemProfit(i)),s.notes||''])));
  xlsxDown('DayReport_'+d+'.xlsx',[{name:'Day Report',data:[hdr,...rows]}]);
}

function exportMonthXLSX(){
  const d=D('rep-date').value;if(!d)return;
  const dt=new Date(d);
  const mSales=sales.filter(s=>{const sd=new Date(s.date);return sd.getMonth()===dt.getMonth()&&sd.getFullYear()===dt.getFullYear();});
  if(!mSales.length){alert('No sales in this month.');return;}
  const hdr=['Invoice','Date','Customer','Phone','Items','Payment','Subtotal','GST','Total','Profit','Notes'];
  xlsxDown('MonthReport_'+dt.getFullYear()+'_'+(dt.getMonth()+1)+'.xlsx',[{name:'Month Report',data:[hdr,...mSales.map(s=>[s.id,fmtDT(s.date),s.customer,s.phone||'',s.items.map(i=>i.name+' x'+i.qty).join('; '),s.payment,Math.round(s.sub),Math.round(s.gstAmt),Math.round(s.total),Math.round(s.profit),s.notes||''])]}]);
}

function exportAdjLog(){
  const hdr=['Date & Time','Product','SKU','Adjustment Type','Quantity','Stock Before','Stock After','Reason'];
  xlsxDown('StockAdjustmentLog.xlsx',[{name:'Adjustment Log',data:[hdr,...adjLog.map(l=>[fmtDT(l.time),l.prod,l.sku||'',l.type==='add'?'Add Stock':l.type==='sub'?'Remove Stock':'Set Exact',l.qty,l.before,l.after,l.note])]}]);
}

// ==================== STAFF & ATTENDANCE ====================
let attData = {}; // { 'YYYY-MM-DD': { username: 'present'|'absent'|'half'|'leave', ... } }

function todayStr() { return new Date().toISOString().split('T')[0]; }

function initStaffTab() {
  if (!D('att-date').value) D('att-date').value = todayStr();
  renderStaffList();
  renderAttendance();
  renderAttSummary();
  populateAttHistMonths();
  renderAttHistory();
}

async function getStaffUsers() {
  const users = await getUsers();
  return Object.entries(users).filter(([k, v]) => v.role === 'staff').map(([username, data]) => ({ username, ...data }));
}

async function renderStaffList() {
  const staffList = await getStaffUsers();
  const el = D('staff-list');
  if (!staffList.length) {
    el.innerHTML = '<p style="color:#94a3b8;font-size:12px;padding:8px 0">No staff members yet. Add one below.</p>';
    return;
  }
  el.innerHTML = staffList.map(s => `<div class="staff-card">
    <div class="staff-info">
      <div class="sname">${s.name}</div>
      <div class="smeta">@${s.username}${s.phone ? ' &bull; ' + s.phone : ''} &bull; Joined ${new Date(s.createdAt).toLocaleDateString('en-IN')}</div>
    </div>
    <button class="btn btd" onclick="removeStaff('${s.username}')" style="padding:3px 10px;font-size:11px">Remove</button>
  </div>`).join('');
}

async function addStaff() {
  if(!currentUser||currentUser.role!=='admin'){alert('Only admin can add staff.');return;}
  const msgEl = D('staff-msg');
  const name = D('new-staff-name').value.trim();
  const username = D('new-staff-user').value.trim().toLowerCase();
  const password = D('new-staff-pass').value;
  const phone = D('new-staff-phone').value.trim();
  if (!name || !username || !password) { msgEl.className = 'auth-msg err'; msgEl.textContent = 'Name, username, and password are required.'; return; }
  if (username.length < 3) { msgEl.className = 'auth-msg err'; msgEl.textContent = 'Username must be at least 3 characters.'; return; }
  if (!/^[a-z0-9_]+$/.test(username)) { msgEl.className = 'auth-msg err'; msgEl.textContent = 'Username: lowercase letters, numbers, underscores only.'; return; }
  if (password.length < 6) { msgEl.className = 'auth-msg err'; msgEl.textContent = 'Password must be at least 6 characters.'; return; }
  try {
    const users = await getUsers();
    if (users[username]) { msgEl.className = 'auth-msg err'; msgEl.textContent = 'Username already taken.'; return; }
    const hash = await hashPassword(password);
    await saveUser(username, { name, role: 'staff', passHash: hash, phone: phone || '', createdAt: new Date().toISOString() });
    msgEl.className = 'auth-msg ok'; msgEl.textContent = 'Staff "' + name + '" added successfully!';
    D('new-staff-name').value = ''; D('new-staff-user').value = ''; D('new-staff-pass').value = ''; D('new-staff-phone').value = '';
    renderStaffList();
    renderAttendance();
  } catch(e) {
    msgEl.className = 'auth-msg err'; msgEl.textContent = 'Failed to add staff. Check connection.';
  }
}

async function removeStaff(username) {
  if(!currentUser||currentUser.role!=='admin'){alert('Only admin can remove staff.');return;}
  if (!confirm('Remove staff "' + username + '"? They will no longer be able to log in.')) return;
  try {
    await dbRef.users.child(username).remove();
    renderStaffList();
    renderAttendance();
  } catch(e) { alert('Failed to remove staff.'); }
}

async function renderAttendance() {
  const date = D('att-date').value || todayStr();
  D('att-date-label').textContent = new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const staffList = await getStaffUsers();
  const el = D('att-list');
  if (!staffList.length) {
    el.innerHTML = '<p style="color:#94a3b8;font-size:12px;padding:8px 0">No staff to show. Add staff members first.</p>';
    return;
  }
  // Load attendance for this date from Firebase
  try {
    const snap = await dbRef.attendance.child(date).once('value');
    attData[date] = snap.val() || {};
  } catch(e) { attData[date] = attData[date] || {}; }

  const dayAtt = attData[date];
  el.innerHTML = staffList.map(s => {
    const status = dayAtt[s.username] || '';
    return `<div class="att-row">
      <span class="att-name">${s.name} <span style="color:#94a3b8;font-size:10px">@${s.username}</span></span>
      <div class="att-status">
        <button class="att-btn ${status==='present'?'sel-present':''}" onclick="setAtt('${date}','${s.username}','present',this)">Present</button>
        <button class="att-btn ${status==='absent'?'sel-absent':''}" onclick="setAtt('${date}','${s.username}','absent',this)">Absent</button>
        <button class="att-btn ${status==='half'?'sel-half':''}" onclick="setAtt('${date}','${s.username}','half',this)">Half Day</button>
        <button class="att-btn ${status==='leave'?'sel-leave':''}" onclick="setAtt('${date}','${s.username}','leave',this)">Leave</button>
      </div>
    </div>`;
  }).join('');
}

function setAtt(date, username, status, btnEl) {
  if (!attData[date]) attData[date] = {};
  attData[date][username] = status;
  // Update button styles in the row
  const row = btnEl.closest('.att-row');
  row.querySelectorAll('.att-btn').forEach(b => b.className = 'att-btn');
  btnEl.classList.add('sel-' + status);
}

async function saveAttendance() {
  const date = D('att-date').value || todayStr();
  const msgEl = D('att-msg');
  const dayAtt = attData[date];
  if (!dayAtt || !Object.keys(dayAtt).length) { msgEl.className = 'auth-msg err'; msgEl.textContent = 'No attendance marked yet.'; return; }
  try {
    await dbRef.attendance.child(date).set(dayAtt);
    msgEl.className = 'auth-msg ok'; msgEl.textContent = 'Attendance saved for ' + date + '!';
    renderAttSummary();
    setTimeout(() => { msgEl.className = 'auth-msg'; }, 2000);
  } catch(e) {
    msgEl.className = 'auth-msg err'; msgEl.textContent = 'Failed to save. Check connection.';
  }
}

async function renderAttSummary() {
  const el = D('att-summary');
  const now = new Date();
  const year = now.getFullYear(), month = now.getMonth();
  const staffList = await getStaffUsers();
  if (!staffList.length) { el.innerHTML = '<p style="color:#94a3b8;font-size:12px">No staff.</p>'; return; }

  // Load all attendance for this month
  const startKey = `${year}-${String(month+1).padStart(2,'0')}-01`;
  const endKey = `${year}-${String(month+1).padStart(2,'0')}-31`;
  let monthData = {};
  try {
    const snap = await dbRef.attendance.orderByKey().startAt(startKey).endAt(endKey).once('value');
    monthData = snap.val() || {};
  } catch(e) {}

  const summary = {};
  staffList.forEach(s => { summary[s.username] = { name: s.name, present: 0, absent: 0, half: 0, leave: 0 }; });
  Object.values(monthData).forEach(dayData => {
    Object.entries(dayData).forEach(([user, status]) => {
      if (summary[user] && summary[user][status] !== undefined) summary[user][status]++;
    });
  });

  const monthName = now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  el.innerHTML = `<div style="font-size:11px;color:#64748b;margin-bottom:6px">${monthName}</div>` +
    Object.values(summary).map(s => `<div class="att-summary-row">
      <span style="font-weight:600">${s.name}</span>
      <div>
        <span class="att-count" style="background:#dcfce7;color:#15803d">${s.present}P</span>
        <span class="att-count" style="background:#fee2e2;color:#b91c1c">${s.absent}A</span>
        <span class="att-count" style="background:#fef9c3;color:#a16207">${s.half}H</span>
        <span class="att-count" style="background:#eff6ff;color:#1d4ed8">${s.leave}L</span>
      </div>
    </div>`).join('');
}

function populateAttHistMonths() {
  const sel = D('att-hist-month');
  const now = new Date();
  sel.innerHTML = '';
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const val = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    const label = d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    sel.innerHTML += `<option value="${val}">${label}</option>`;
  }
}

async function renderAttHistory() {
  const el = D('att-history');
  const monthVal = D('att-hist-month').value;
  if (!monthVal) { el.innerHTML = ''; return; }
  const startKey = monthVal + '-01';
  const endKey = monthVal + '-31';
  let monthData = {};
  try {
    const snap = await dbRef.attendance.orderByKey().startAt(startKey).endAt(endKey).once('value');
    monthData = snap.val() || {};
  } catch(e) {}
  const dates = Object.keys(monthData).sort().reverse();
  if (!dates.length) { el.innerHTML = '<p style="color:#94a3b8;font-size:12px;padding:8px 0">No attendance records.</p>'; return; }
  const staffList = await getStaffUsers();
  const nameMap = {};
  staffList.forEach(s => { nameMap[s.username] = s.name; });

  el.innerHTML = dates.map(date => {
    const dayData = monthData[date];
    const entries = Object.entries(dayData);
    const dateLabel = new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
    return `<div style="margin-bottom:8px">
      <div style="font-weight:600;font-size:11px;color:#1a1a2e;margin-bottom:3px;padding:4px 0;border-bottom:1px solid #e5e7eb">${dateLabel}</div>
      ${entries.map(([user, status]) => {
        const colors = { present:'color:#15803d', absent:'color:#b91c1c', half:'color:#a16207', leave:'color:#1d4ed8' };
        const labels = { present:'Present', absent:'Absent', half:'Half Day', leave:'Leave' };
        return `<div style="display:flex;justify-content:space-between;padding:2px 8px;font-size:11px"><span>${nameMap[user]||user}</span><span style="${colors[status]||''};font-weight:600">${labels[status]||status}</span></div>`;
      }).join('')}
    </div>`;
  }).join('');
}

async function exportAttendanceXLSX() {
  const date = D('att-date').value || todayStr();
  const staffList = await getStaffUsers();
  let dayData = {};
  try { const snap = await dbRef.attendance.child(date).once('value'); dayData = snap.val() || {}; } catch(e) {}
  const hdr = ['Staff Name', 'Username', 'Status'];
  const rows = staffList.map(s => [s.name, s.username, (dayData[s.username] || 'Not Marked').toUpperCase()]);
  xlsxDown('Attendance_' + date + '.xlsx', [{name: 'Attendance', data: [hdr, ...rows]}]);
}

async function exportMonthAttXLSX() {
  const monthVal = D('att-hist-month').value;
  if (!monthVal) return;
  const startKey = monthVal + '-01';
  const endKey = monthVal + '-31';
  let monthData = {};
  try { const snap = await dbRef.attendance.orderByKey().startAt(startKey).endAt(endKey).once('value'); monthData = snap.val() || {}; } catch(e) {}
  const staffList = await getStaffUsers();
  const dates = Object.keys(monthData).sort();
  if (!dates.length) { alert('No attendance data for this month.'); return; }
  const hdr = ['Date', ...staffList.map(s => s.name)];
  const rows = dates.map(date => {
    const dayData = monthData[date];
    return [date, ...staffList.map(s => (dayData[s.username] || '-').toUpperCase())];
  });
  // Summary row
  const summary = staffList.map(s => {
    let p=0,a=0,h=0,l=0;
    dates.forEach(date => { const st = (monthData[date]||{})[s.username]; if(st==='present')p++; if(st==='absent')a++; if(st==='half')h++; if(st==='leave')l++; });
    return `P:${p} A:${a} H:${h} L:${l}`;
  });
  rows.push(['TOTAL', ...summary]);
  xlsxDown('Attendance_' + monthVal + '.xlsx', [{name: 'Monthly Attendance', data: [hdr, ...rows]}]);
}

// ==================== STAFF SALES PERFORMANCE ====================
let perfPeriod='all';

function renderStaffPerf(){
  const now=new Date();
  // Gather all staff who have sold
  const staffMap={};
  sales.forEach(s=>{
    if(!s.soldBy)return;
    // Period filter
    if(perfPeriod==='today'&&new Date(s.date).toDateString()!==now.toDateString())return;
    if(perfPeriod==='week'&&(now-new Date(s.date))>7*86400000)return;
    if(perfPeriod==='month'&&(now-new Date(s.date))>30*86400000)return;
    const u=s.soldBy.username;
    if(!staffMap[u])staffMap[u]={name:s.soldBy.name,username:u,count:0,revenue:0,profit:0,items:0};
    staffMap[u].count++;
    staffMap[u].revenue+=s.total;
    staffMap[u].profit+=s.profit;
    staffMap[u].items+=s.items.reduce((a,i)=>a+i.qty,0);
  });
  const arr=Object.values(staffMap).sort((a,b)=>b.revenue-a.revenue);
  const maxRev=arr[0]?arr[0].revenue:1;
  const el=D('perf-content');

  if(!arr.length){
    el.innerHTML='<div class="card" style="text-align:center;color:#94a3b8;padding:32px">No sales data found for this period.</div>';
    return;
  }

  el.innerHTML=`
    <div class="metric-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:12px">
      <div class="metric"><div class="mlabel">Total Staff Sellers</div><div class="mval b">${arr.length}</div></div>
      <div class="metric"><div class="mlabel">Total Transactions</div><div class="mval">${arr.reduce((s,x)=>s+x.count,0)}</div></div>
      <div class="metric"><div class="mlabel">Total Revenue</div><div class="mval">${fmt(arr.reduce((s,x)=>s+x.revenue,0))}</div></div>
      <div class="metric"><div class="mlabel">Total Profit</div><div class="mval g">${fmt(arr.reduce((s,x)=>s+x.profit,0))}</div></div>
    </div>
    <div class="card">
      <div class="card-title">&#127942; Staff Ranking by Revenue</div>
      <table><thead><tr>
        <th>Rank</th><th>Staff Name</th><th>Username</th><th>Sales Count</th><th>Items Sold</th><th>Revenue</th><th>Profit</th><th>Performance</th>
      </tr></thead>
      <tbody>${arr.map((s,i)=>`<tr>
        <td style="font-weight:700;color:${i===0?'#d97706':i===1?'#64748b':i===2?'#b45309':'#1a1a2e'};font-size:14px">${i===0?'&#129351;':i===1?'&#129352;':i===2?'&#129353;':'#'+(i+1)}</td>
        <td style="font-weight:600">${s.name}</td>
        <td style="color:#64748b">@${s.username}</td>
        <td style="text-align:center">${s.count}</td>
        <td style="text-align:center">${s.items}</td>
        <td style="font-weight:600">${fmt(s.revenue)}</td>
        <td style="color:#16a34a;font-weight:600">${fmt(s.profit)}</td>
        <td style="width:140px"><div class="prog-bar"><div class="prog-fill" style="width:${Math.round(s.revenue/maxRev*100)}%"></div></div></td>
      </tr>`).join('')}</tbody></table>
    </div>
    <div class="card" style="margin:0">
      <div class="card-title">&#128202; Individual Sales Breakdown</div>
      ${arr.map(s=>{
        const mySales=sales.filter(x=>x.soldBy&&x.soldBy.username===s.username);
        const recent=mySales.slice(0,5);
        return `<div style="margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid #f1f5f9">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
            <span style="font-weight:700;font-size:13px">${s.name} <span style="color:#94a3b8;font-size:11px;font-weight:400">@${s.username}</span></span>
            <span style="font-size:11px;color:#64748b">${s.count} sales &bull; ${fmt(s.revenue)} revenue</span>
          </div>
          <div style="font-size:11px;color:#64748b;margin-bottom:4px">Recent sales:</div>
          ${recent.map(x=>`<div style="display:flex;justify-content:space-between;padding:3px 8px;font-size:11px;background:#f9fafb;border-radius:3px;margin-bottom:2px">
            <span><strong style="color:#2563eb">${x.id}</strong> &mdash; ${x.customer} &mdash; ${x.items.map(i=>i.name).join(', ')}</span>
            <span style="font-weight:600">${fmt(x.total)}</span>
          </div>`).join('')}
        </div>`;
      }).join('')}
    </div>`;
}

function exportStaffPerfXLSX(){
  const now=new Date();
  const staffMap={};
  sales.forEach(s=>{
    if(!s.soldBy)return;
    if(perfPeriod==='today'&&new Date(s.date).toDateString()!==now.toDateString())return;
    if(perfPeriod==='week'&&(now-new Date(s.date))>7*86400000)return;
    if(perfPeriod==='month'&&(now-new Date(s.date))>30*86400000)return;
    const u=s.soldBy.username;
    if(!staffMap[u])staffMap[u]={name:s.soldBy.name,username:u,count:0,revenue:0,profit:0,items:0};
    staffMap[u].count++;
    staffMap[u].revenue+=s.total;
    staffMap[u].profit+=s.profit;
    staffMap[u].items+=s.items.reduce((a,i)=>a+i.qty,0);
  });
  const arr=Object.values(staffMap).sort((a,b)=>b.revenue-a.revenue);
  const hdr=['Rank','Staff Name','Username','Sales Count','Items Sold','Revenue','Profit'];
  const rows=arr.map((s,i)=>[i+1,s.name,s.username,s.count,s.items,Math.round(s.revenue),Math.round(s.profit)]);
  xlsxDown('Staff_Performance.xlsx',[{name:'Staff Performance',data:[hdr,...rows]}]);
}

// ==================== USER PROFILE ====================
async function renderProfile(){
  const el=D('profile-content');
  if(!currentUser){el.innerHTML='<p style="color:#94a3b8">Not logged in.</p>';return;}
  // Fetch user data from Firebase
  let userData={};
  try{
    const snap=await dbRef.users.child(currentUser.username).once('value');
    userData=snap.val()||{};
  }catch(e){}

  // My sales stats
  const mySales=sales.filter(s=>s.soldBy&&s.soldBy.username===currentUser.username);
  const myRev=mySales.reduce((s,x)=>s+x.total,0);
  const myProfit=mySales.reduce((s,x)=>s+x.profit,0);
  const myItems=mySales.reduce((s,x)=>s+x.items.reduce((a,i)=>a+i.qty,0),0);
  const tod=new Date().toDateString();
  const todaySales=mySales.filter(s=>new Date(s.date).toDateString()===tod);
  const todayRev=todaySales.reduce((s,x)=>s+x.total,0);

  // Attendance stats this month
  const now=new Date();
  const startKey=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`;
  const endKey=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-31`;
  let attStats={present:0,absent:0,half:0,leave:0};
  try{
    const snap=await dbRef.attendance.orderByKey().startAt(startKey).endAt(endKey).once('value');
    const monthData=snap.val()||{};
    Object.values(monthData).forEach(day=>{
      const st=day[currentUser.username];
      if(st&&attStats[st]!==undefined)attStats[st]++;
    });
  }catch(e){}

  const joinDate=userData.createdAt?new Date(userData.createdAt).toLocaleDateString('en-IN',{dateStyle:'long'}):'Unknown';
  const monthName=now.toLocaleDateString('en-IN',{month:'long',year:'numeric'});
  const initials=currentUser.name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);

  el.innerHTML=`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
      <div>
        <div class="card">
          <div style="display:flex;align-items:center;gap:16px;margin-bottom:14px">
            <div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#2563eb,#7c3aed);display:flex;align-items:center;justify-content:center;color:#fff;font-size:22px;font-weight:700;flex-shrink:0">${initials}</div>
            <div>
              <div style="font-size:18px;font-weight:700;color:#1a1a2e">${currentUser.name}</div>
              <div style="font-size:12px;color:#64748b">@${currentUser.username}</div>
              <span class="badge" style="background:${currentUser.role==='admin'?'rgba(245,158,11,.15);color:#d97706':'rgba(59,130,246,.15);color:#2563eb'};font-size:10px;font-weight:700;text-transform:uppercase;padding:2px 10px;border-radius:99px;margin-top:4px;display:inline-block">${currentUser.role}</span>
            </div>
          </div>
          <div style="border-top:1px solid #e5e7eb;padding-top:10px">
            <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:12px"><span style="color:#64748b">Full Name</span><span style="font-weight:600">${currentUser.name}</span></div>
            <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:12px"><span style="color:#64748b">Username</span><span style="font-weight:600">@${currentUser.username}</span></div>
            <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:12px"><span style="color:#64748b">Role</span><span style="font-weight:600;text-transform:capitalize">${currentUser.role}</span></div>
            <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:12px"><span style="color:#64748b">Phone</span><span style="font-weight:600">${userData.phone||'\u2014'}</span></div>
            <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:12px"><span style="color:#64748b">Joined</span><span style="font-weight:600">${joinDate}</span></div>
          </div>
        </div>
        <div class="card" style="margin:0">
          <div class="card-title">&#128197; Attendance This Month (${monthName})</div>
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;text-align:center">
            <div style="background:#dcfce7;border-radius:8px;padding:10px"><div style="font-size:20px;font-weight:700;color:#15803d">${attStats.present}</div><div style="font-size:10px;color:#15803d">Present</div></div>
            <div style="background:#fee2e2;border-radius:8px;padding:10px"><div style="font-size:20px;font-weight:700;color:#b91c1c">${attStats.absent}</div><div style="font-size:10px;color:#b91c1c">Absent</div></div>
            <div style="background:#fef9c3;border-radius:8px;padding:10px"><div style="font-size:20px;font-weight:700;color:#a16207">${attStats.half}</div><div style="font-size:10px;color:#a16207">Half Day</div></div>
            <div style="background:#eff6ff;border-radius:8px;padding:10px"><div style="font-size:20px;font-weight:700;color:#1d4ed8">${attStats.leave}</div><div style="font-size:10px;color:#1d4ed8">Leave</div></div>
          </div>
        </div>
      </div>
      <div>
        <div class="card">
          <div class="card-title">&#128200; My Sales Overview</div>
          <div class="metric-grid" style="grid-template-columns:repeat(2,1fr);margin-bottom:0">
            <div class="metric"><div class="mlabel">Total Sales</div><div class="mval b">${mySales.length}</div></div>
            <div class="metric"><div class="mlabel">Items Sold</div><div class="mval">${myItems}</div></div>
            <div class="metric"><div class="mlabel">Revenue Generated</div><div class="mval">${fmt(myRev)}</div></div>
            <div class="metric"><div class="mlabel">Profit Earned</div><div class="mval g">${fmt(myProfit)}</div></div>
            <div class="metric"><div class="mlabel">Today's Sales</div><div class="mval b">${todaySales.length}</div></div>
            <div class="metric"><div class="mlabel">Today's Revenue</div><div class="mval">${fmt(todayRev)}</div></div>
          </div>
        </div>
        <div class="card" style="margin:0">
          <div class="card-title">&#128221; My Recent Sales</div>
          <div style="max-height:280px;overflow-y:auto">
          ${mySales.length?mySales.slice(0,10).map(s=>`<div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #f1f5f9;font-size:12px">
            <div>
              <span style="font-weight:600;color:#2563eb">${s.id}</span>
              <span style="color:#64748b;margin-left:6px">${fmtDT(s.date)}</span>
              <div style="font-size:11px;color:#64748b;margin-top:2px">${s.customer} &mdash; ${s.items.map(i=>i.name).join(', ')}</div>
            </div>
            <div style="text-align:right;white-space:nowrap">
              <div style="font-weight:700">${fmt(s.total)}</div>
              <div style="font-size:11px;color:#16a34a">${fmt(s.profit)} profit</div>
            </div>
          </div>`).join(''):'<p style="color:#94a3b8;font-size:12px;padding:8px 0">No sales yet. Complete your first sale!</p>'}
          </div>
        </div>
      </div>
    </div>`;
}
// ==================== INIT ====================
async function appInit() {
  const session = getSession();
  if (session) {
    // Session exists — show app immediately, load data in background
    document.getElementById('app-shell').classList.add('visible');
    enterApp();
  } else {
    // No session — show login
    document.getElementById('auth-overlay').style.display = 'flex';
  }
  // Init default admin in background (doesn't block UI)
  initDefaultAdmin();
  D('rep-date').value=new Date().toISOString().split('T')[0];
  // Restore tab from URL hash, or default to dashboard
  const hash=(location.hash||'').replace('#','').trim();
  const tab=(hash && tabMap[hash]!=null)?hash:'dash';
  history.replaceState({tab},'',' #'+tab);
  if(session) showTab(tab,null,true);
}
appInit();
