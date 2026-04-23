// ======================================


// UTILS


// ======================================

// HTML escape function to prevent XSS attacks
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function calcInvoice(inv) {
  let subtotal = 0, gstTotal = 0;
  (inv.items||[]).forEach(item => {
    const price = parseFloat(item.price) || 0;
    const qty = parseFloat(item.qty) || 0;
    const gstRate = parseFloat(item.gst) || 0;
    const base = price * qty;
    subtotal += base;
    gstTotal += base * gstRate / 100;
  });
  return { subtotal, gstTotal, total: subtotal + gstTotal };
}





function fmtMoney(n) {
  const val = Number(n);
  if (isNaN(val)) return '\u20B90.00';
  return '\u20B9' + val.toLocaleString('en-IN', {minimumFractionDigits:2, maximumFractionDigits:2});
}


function fmtMoneyShort(n) {
  const val = Number(n);
  if (isNaN(val)) return '\u20B90';
  if (val>=100000) return '\u20B9'+(val/100000).toFixed(1)+'L';
  if (val>=1000) return '\u20B9'+(val/1000).toFixed(1)+'k';
  return '\u20B9'+val;
}





function toast(msg, type='success') {


  const el = document.getElementById('toastEl');


  el.textContent = msg;


  el.className = `toast ${type} show`;


  clearTimeout(el._t);


  el._t = setTimeout(() => el.classList.remove('show'), 3200);


}





function openModal(id) { document.getElementById(id).classList.add('open'); }


function closeModal(id) { document.getElementById(id).classList.remove('open'); }





// ======================================


// LOGIN / NAVIGATION


// ======================================


// Autofill credentials when role dropdown changes
function prefillLoginCreds(role) {
  const map = { admin: USERS[0], cashier: USERS[1], viewer: USERS[2] };
  const u = map[role];
  if (u) {
    document.getElementById('loginEmail').value = u.email;
    document.getElementById('loginPassword').value = u.password;
  }
}

async function doLogin() {
  const email = document.getElementById('loginEmail').value.trim().toLowerCase();
  const password = document.getElementById('loginPassword').value;

  if (!email || !password) {
    toast('❌ Please enter email and password', 'error');
    return;
  }

  // Get login button for status updates
  const loginBtn = document.querySelector('.login-btn');
  const originalBtnText = loginBtn ? loginBtn.textContent : '';
  
  if (loginBtn) {
    loginBtn.textContent = '⏳ Authenticating…';
    loginBtn.disabled = true;
    loginBtn.style.opacity = '0.75';
  }

  try {
    // Call login API
    const loginRes = await fetch(API_BASE + '/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!loginRes.ok) {
      throw new Error(`Login failed: ${loginRes.status}`);
    }

    const user = await loginRes.json();
    
    if (user.error) {
      if (loginBtn) {
        loginBtn.textContent = originalBtnText;
        loginBtn.disabled = false;
        loginBtn.style.opacity = '';
      }
      toast('❌ Invalid credentials', 'error');
      return;
    }

    currentUser = user;
    localStorage.setItem('billforge_user', JSON.stringify(currentUser));

    // Now fetch all the data
    const ls = document.getElementById('loginScreen');
    ls.style.transition = 'opacity 0.5s';
    ls.style.opacity = '0';

    if (loginBtn) {
      loginBtn.textContent = '⏳ Loading data…';
    }

    console.log('API_BASE:', API_BASE);
    const [pRes, cRes, iRes, eRes, qRes, poRes] = await Promise.all([
      fetch(API_BASE + '/products'), 
      fetch(API_BASE + '/customers'), 
      fetch(API_BASE + '/invoices'),
      fetch(API_BASE + '/expenses'), 
      fetch(API_BASE + '/quotations'), 
      fetch(API_BASE + '/purchases')
    ]);

    // Check if all responses are OK
    if (!pRes.ok) throw new Error(`Products API error: ${pRes.status}`);
    if (!cRes.ok) throw new Error(`Customers API error: ${cRes.status}`);
    if (!iRes.ok) throw new Error(`Invoices API error: ${iRes.status}`);
    if (!eRes.ok) throw new Error(`Expenses API error: ${eRes.status}`);
    if (!qRes.ok) throw new Error(`Quotations API error: ${qRes.status}`);
    if (!poRes.ok) throw new Error(`Purchases API error: ${poRes.status}`);

    products = await pRes.json();
    customers = await cRes.json();
    invoices = await iRes.json();
    expenses = await eRes.json();
    quotations = await qRes.json();
    purchases = await poRes.json();

  } catch(e) {
    console.error('Login/Data fetch error:', e.message);
    
    if (loginBtn) {
      loginBtn.textContent = originalBtnText;
      loginBtn.disabled = false;
      loginBtn.style.opacity = '';
    }
    const ls = document.getElementById('loginScreen');
    ls.style.opacity = '1';
    toast('❌ Error: ' + e.message, 'error');
    return;
  }

  setTimeout(() => {
    const ls = document.getElementById('loginScreen');
    ls.style.display = 'none';
    document.getElementById('appShell').style.display = 'flex';

    // Update sidebar user info
    const sbAvatar = document.getElementById('sbAvatar');
    const sbName = document.getElementById('sbUserName');
    const sbRole = document.getElementById('sbUserRole');

    if (sbAvatar) sbAvatar.textContent = currentUser.avatar;
    if (sbName) sbName.textContent = currentUser.name;
    if (sbRole) sbRole.textContent = currentUser.role;

    applyRoleRestrictions(currentUser.role);
    initAll();
  }, 500);
}





function doLogout() {

  const ls = document.getElementById('loginScreen');

  // Close all open modals

  document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));

  // Reset all sidebar active states

  document.querySelectorAll('.sb-item').forEach(i => i.classList.remove('active'));

  const dashItem = document.querySelector('.sb-item[data-page="dashboard"]');

  if (dashItem) dashItem.classList.add('active');

  // Clear stored user data
  currentUser = null;
  localStorage.removeItem('billforge_user');

  ls.style.display = '';

  ls.style.opacity = '0';

  document.getElementById('appShell').style.display = 'none';

  // Clear login form
  document.getElementById('loginEmail').value = '';
  document.getElementById('loginPassword').value = '';

  setTimeout(() => { ls.style.transition = 'opacity 0.4s'; ls.style.opacity = '1'; }, 10);

}





function toggleMobileMenu() {
  const sb = document.getElementById('sidebar');
  const ov = document.getElementById('sbOverlay');
  if (sb) sb.classList.toggle('open');
  if (ov) ov.classList.toggle('open');
}

function nav(page, el) {
  // Auto-close mobile menu if open
  const sb = document.getElementById('sidebar');
  const ov = document.getElementById('sbOverlay');
  if (sb && sb.classList.contains('open')) {
    sb.classList.remove('open');
    if (ov) ov.classList.remove('open');
  }

  // Close any open modals first (fixes sidebar glitch after modals)


  document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));





  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));


  document.querySelectorAll('.sb-item').forEach(i => i.classList.remove('active'));


  const pg = document.getElementById('page-' + page);


  if (pg) pg.classList.add('active');


  if (el) el.classList.add('active');


  else {


    document.querySelectorAll('.sb-item').forEach(i => {


      if (i.dataset.page === page) i.classList.add('active');


    });


  }


  const titles = { dashboard:'Dashboard', pos:'POS Billing', invoices:'Invoices', customers:'Customers', quotations:'Quotations', products:'Products', stock:'Stock', purchases:'Purchases', reports:'Reports & Analytics', gst:'GST Returns', expenses:'Expenses', settings:'Settings' };


  document.getElementById('tbTitle').textContent = titles[page] || page;


  // ── QUICK SUGGESTION #1: Update browser tab title per page ──────
  document.title = (titles[page] || page) + ' — BillForge';
  // ────────────────────────────────────────────────────────────────


  // Dynamic topbar CTA button per page


  const ctaMap = {


    dashboard:   { label: '+ New Invoice',    action: "nav('pos',null)" },


    pos:         { label: '\u26A1 Complete Sale',  action: 'checkout()' },


    invoices:    { label: '+ Create Invoice',  action: "nav('pos',null)" },


    customers:   { label: '+ Add Customer',    action: 'openAddCustomerModal()' },


    quotations:  { label: '+ New Quotation',   action: "openModal('addQuoteModal')" },


    products:    { label: '+ Add Product',     action: 'openAddProductModal()' },


    stock:       { label: '+ Adjust Stock',    action: 'openAdjustStockModal()' },


    purchases:   { label: '+ New PO',          action: "openModal('addPOModal')" },


    expenses:    { label: '+ Add Expense',     action: "openModal('addExpModal')" },


    reports:     { label: '\uD83D\uDCC4 Download Report',action: 'window.print()' },


    settings:    { label: '\uD83D\uDCBE Save Settings',  action: "toast('Settings saved','success')" },


  };


  const cta = ctaMap[page] || { label: '+ New Invoice', action: "nav('pos',null)" };


  const ctaBtn = document.getElementById('tbCtaBtn');


  if (ctaBtn) { ctaBtn.textContent = cta.label; ctaBtn.setAttribute('onclick', cta.action); }





  window.scrollTo(0,0);

  // Trigger page-specific renders


  if (page === 'reports') {


    setTimeout(() => renderReportData(), 50);


  }


  if (page === 'gst') {


    setTimeout(() => renderGSTPage(), 50);


  }


}





function closeGS() {
  const dd = document.getElementById('globalSearchDropdown');
  if (dd) dd.classList.remove('open');
}

document.addEventListener('click', (e) => {
  if (!e.target.closest('.sb-search')) closeGS();
});

function globalSearch(v) {
  const q = v.toLowerCase().trim();
  const dd = document.getElementById('globalSearchDropdown');
  if (!dd) return;
  if (q.length < 2) {
    dd.classList.remove('open');
    return;
  }
  
  let h = '';
  let count = 0;
  
  // Customers
  const cMatches = customers.filter(c => c.name.toLowerCase().includes(q) || c.phone.includes(q)).slice(0, 5);
  if (cMatches.length > 0) {
    h += `<div style="font-size:10px;font-weight:700;color:var(--ash);padding:8px 12px 2px;text-transform:uppercase;">Customers</div>`;
    cMatches.forEach(c => {
      h += `<div class="cust-opt" onclick="closeGS(); viewCustomer(${c.id})">
              <div class="cust-opt-name">${c.name}</div>
              <div class="cust-opt-meta">Phone: ${c.phone}</div>
            </div>`;
    });
    count += cMatches.length;
  }
  
  // Products
  const pMatches = products.filter(p => p.name.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q))).slice(0, 5);
  if (pMatches.length > 0) {
    h += `<div style="font-size:10px;font-weight:700;color:var(--ash);padding:8px 12px 2px;text-transform:uppercase;">Products</div>`;
    pMatches.forEach(p => {
      h += `<div class="cust-opt" onclick="closeGS(); gotoProduct(${p.id})">
              <div class="cust-opt-name">${p.name}</div>
              <div class="cust-opt-meta">SKU: ${p.sku||'—'} • ₹${p.price}</div>
            </div>`;
    });
    count += pMatches.length;
  }

  // Invoices
  const iMatches = invoices.filter(i => i.num.toLowerCase().includes(q) || i.customer.toLowerCase().includes(q)).slice(0, 5);
  if (iMatches.length > 0) {
    h += `<div style="font-size:10px;font-weight:700;color:var(--ash);padding:8px 12px 2px;text-transform:uppercase;">Invoices</div>`;
    iMatches.forEach(i => {
      h += `<div class="cust-opt" onclick="closeGS(); viewInvoice(${i.id})">
              <div class="cust-opt-name">${i.num}</div>
              <div class="cust-opt-meta">Cust: ${i.customer}</div>
            </div>`;
    });
    count += iMatches.length;
  }
  
  if (count === 0) {
    h = `<div style="padding:15px;text-align:center;font-size:12px;color:var(--ash);">No matching elements found.</div>`;
  }
  
  dd.innerHTML = h;
  dd.classList.add('open');
}

function gotoProduct(id) {
  const el = document.querySelector('.sb-item[data-page="products"]');
  nav('products', el);
  const p = products.find(x => x.id === id);
  if (p && typeof filterProducts === 'function') {
    const fld = document.getElementById('filterProd');
    if (fld) {
      fld.value = p.name;
      filterProducts(p.name);
    }
  }
}





// ======================================


// INIT ALL


// ======================================


function initAll() {


  // Set date


  const now = new Date();


  const opts = { weekday:'long', year:'numeric', month:'long', day:'numeric' };


  document.getElementById('dashDate').textContent = now.toLocaleDateString('en-IN', opts);


  document.getElementById('tbDate').textContent = now.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });


  // today's date for pos


  document.getElementById('posDate').value = now.toISOString().split('T')[0];





  renderDashStats();


  renderDashLowStock();


  renderDashRecentInv();


  renderDashActivity();


  renderStockAlerts();


  updateInvoiceCount();


  initCharts();


  buildPOS();


  renderInvTable(invoices);


  renderCustTable();


  renderProdTable(products);


  renderStockTable(products);


  renderReportData();


  renderExpTable(expenses);


  renderPOTable(purchases);


  renderQuoteTable(quotations);


  // Show keyboard shortcut hint on first load
  showShortcutHint();


}





function renderDashStats() {
  const now = new Date();
  // Build month check values — en-IN locale gives "Apr 2026" style
  const curMonth = now.toLocaleString('en-IN', { month: 'short' }); // e.g. "Apr"
  const curYear  = now.getFullYear().toString();                     // e.g. "2026"

  let monthRev   = 0;
  let monthCount = 0;
  let totalRev   = 0;
  let totalCount = 0;

  invoices.forEach(inv => {
    if (inv.status === 'Paid') {
      const comp = calcInvoice(inv);
      totalRev   += comp.total;
      totalCount++;
      // Date stored as "7 Apr 2026" — check both month and year appear in string
      if (inv.date.includes(curMonth) && inv.date.includes(curYear)) {
        monthRev   += comp.total;
        monthCount++;
      }
    }
  });

  // Fall back to all-time totals if current month has no data yet
  const displayRev   = monthRev   > 0 ? monthRev   : totalRev;
  const displayCount = monthCount > 0 ? monthCount : totalCount;
  const displayLabel = monthRev   > 0 ? 'This month' : 'All time';

  const lowPts = products.filter(p => p.stock < p.min).length;

  const vals = document.querySelectorAll('.stat-val');
  if (vals.length >= 4) {
    vals[0].textContent = fmtMoneyShort(displayRev);
    vals[1].textContent = displayCount;
    vals[2].textContent = lowPts;
    vals[3].textContent = customers.length;
  }

  // Update trend lines with real data
  const trends = document.querySelectorAll('.stat-trend');
  if (trends.length >= 4) {
    trends[0].textContent = displayLabel + ' · Paid invoices only';
    trends[1].textContent = '↑ ' + displayLabel + ': ' + displayCount + ' invoices';
    trends[2].textContent = lowPts > 0 ? '↑ ' + lowPts + ' need restocking' : '✅ All stock healthy';
    trends[3].textContent = '↑ Total: ' + customers.length + ' customers';
  }
}






// ======================================


// CHARTS


// ======================================


const GRID = 'rgba(14,17,23,0.05)';


const TEXT = '#8896a8';


const chartDefaults = {

  plugins: { legend: { labels: { color: TEXT, font: { family: 'Outfit', size: 11 } } } },

  scales: {

    x: { grid: { color: GRID }, ticks: { color: TEXT, font: { family: 'IBM Plex Mono', size: 10 } } },

    y: { beginAtZero: true, grid: { color: GRID }, ticks: { color: TEXT, font: { family: 'IBM Plex Mono', size: 10 },
         callback: (v) => v >= 1000 ? '₹' + (v/1000).toFixed(0) + 'k' : '₹' + v } }

  },

  datasets: { bar: { maxBarThickness: 42 } }, responsive: true, maintainAspectRatio: false

};





let chartInstances = {};





function getChartData() {


  const revByMonthMap = {};


  const monthLabels = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];


  invoices.forEach(inv => {


    if (inv.status === 'Paid') {


       const dateParts = inv.date.split(' ');


       if (dateParts.length === 3) {


         const m = dateParts[1];


         revByMonthMap[m] = (revByMonthMap[m] || 0) + calcInvoice(inv).total;


       }


    }


  });


  const revData = monthLabels.map(m => revByMonthMap[m] || 0);


  


  const catValMap = {};


  products.forEach(p => {


    catValMap[p.cat] = (catValMap[p.cat] || 0) + (p.stock * p.price);


  });


  const catLabels = Object.keys(catValMap);


  const catData = Object.values(catValMap);


  const catColors = ['#1a56db','#0694a2','#f59e0b','#10b981','#8b5cf6', '#ef4444', '#3b82f6'];





  const days = [];


  const dailyData = [];


  for(let i=13; i>=0; i--) {


     const d = new Date();


     d.setDate(d.getDate() - i);


     const dStr = d.toLocaleDateString('en-IN', {day:'numeric', month:'short', year:'numeric'});


     const shortD = `${d.getDate()}/${d.getMonth()+1}`;


     days.push(shortD);


     let dTotal = 0;


     invoices.filter(inv => inv.date === dStr && inv.status === 'Paid').forEach(inv => {


         dTotal += calcInvoice(inv).total;


     });


     dailyData.push(dTotal);


  }


  


  const topStock = [...products].sort((a,b) => (b.stock*b.price) - (a.stock*a.price)).slice(0,8);


  


  const itemCounts = {};


  invoices.forEach(inv => {


    if (inv.status === 'Paid') {


      (inv.items || []).forEach(it => {


         itemCounts[it.name] = (itemCounts[it.name] || 0) + it.qty;


      });


    }


  });


  const sortedItems = Object.entries(itemCounts).sort((a,b) => b[1]-a[1]).slice(0,5);





  const payMap = {};


  invoices.forEach(inv => {


    if (inv.status === 'Paid') {


      payMap[inv.payment] = (payMap[inv.payment] || 0) + 1;


    }


  });


  const payTotal = Object.values(payMap).reduce((a,b)=>a+b, 0) || 1;


  const payLabels = Object.keys(payMap).map(k => `${k} (${Math.round(payMap[k]/payTotal*100)}%)`);


  


  return { revData, catLabels, catData, catColors, days, dailyData, topStock, sortedItems, payMap, payLabels };


}





function initCharts() {


  Chart.defaults.font.family = 'Outfit';


  const d = getChartData();


  const destroyChart = (id) => {
    if (chartInstances[id]) {
      chartInstances[id].destroy();
      delete chartInstances[id];
    }
    // Do NOT reset canvas height — let parent container control it
  };





  destroyChart('dashRevenueChart');


  chartInstances['dashRevenueChart'] = new Chart('dashRevenueChart', {


    type: 'bar',


    data: {


      labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],


      datasets: [{ label: 'Revenue', data: d.revData, backgroundColor: '#1a56db', borderRadius: 4, borderSkipped: false }]


    },


    options: { ...chartDefaults, plugins: { ...chartDefaults.plugins } }


  });





  destroyChart('dashCatChart');


  chartInstances['dashCatChart'] = new Chart('dashCatChart', {


    type: 'doughnut',


    data: {


      labels: d.catLabels.length ? d.catLabels : ['No Data'],


      datasets: [{ data: d.catData.length ? d.catData : [1], backgroundColor: d.catColors, borderWidth: 0, hoverOffset: 6 }]


    },


    options: { plugins: { legend: { position: 'bottom', labels: { color: TEXT, boxWidth: 10, padding: 14, font: { size: 11 } } } }, cutout: '62%', datasets: { bar: { maxBarThickness: 42 } }, responsive: true, maintainAspectRatio: false }


  });





  destroyChart('dashDailyChart');


  chartInstances['dashDailyChart'] = new Chart('dashDailyChart', {


    type: 'line',


    data: {


      labels: d.days,


      datasets: [{ label: 'Daily Revenue \u20B9', data: d.dailyData, borderColor: '#1a56db', backgroundColor: 'rgba(26,86,219,0.06)', fill: true, tension: 0.4, pointRadius: 3, borderWidth: 2 }]


    },


    options: { ...chartDefaults }


  });





  destroyChart('stockDistChart');


  chartInstances['stockDistChart'] = new Chart('stockDistChart', {


    type: 'bar',


    data: {


      labels: d.topStock.map(p => p.name.length > 14 ? p.name.slice(0,13)+'\u2026' : p.name),


      datasets: [{ label: 'Current Stock', data: d.topStock.map(p=>p.stock), backgroundColor: d.topStock.map(p => p.stock < p.min ? (p.stock < 3 ? '#c81e1e' : '#b45309') : '#1a56db'), borderRadius: 4 }]


    },


    options: { ...chartDefaults, indexAxis: 'y' }


  });





  destroyChart('fastMovingChart');


  chartInstances['fastMovingChart'] = new Chart('fastMovingChart', {


    type: 'bar',


    data: {


      labels: d.sortedItems.map(i => i[0].length > 10 ? i[0].slice(0,10)+'\u2026' : i[0]),


      datasets: [{ label: 'Units Sold', data: d.sortedItems.map(i => i[1]), backgroundColor: ['#1a56db','#0694a2','#10b981','#f59e0b','#8b5cf6'], borderRadius: 4 }]


    },


    options: { ...chartDefaults, plugins: { legend: { display: false } } }


  });





  destroyChart('rptRevExpChart');


  chartInstances['rptRevExpChart'] = new Chart('rptRevExpChart', {


    type: 'bar',


    data: {


      labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],


      datasets: [{ label: 'Revenue', data: d.revData, backgroundColor: 'rgba(26,86,219,0.8)', borderRadius: 3 }]


    },


    options: { ...chartDefaults }


  });





  destroyChart('rptPayChart');


  chartInstances['rptPayChart'] = new Chart('rptPayChart', {


    type: 'pie',


    data: {


      labels: d.payLabels.length ? d.payLabels : ['None'],


      datasets: [{ data: Object.values(d.payMap).length ? Object.values(d.payMap) : [1], backgroundColor: ['#1a56db','#10b981','#f59e0b','#8b5cf6'], borderWidth: 0 }]


    },


    options: { plugins: { legend: { position: 'bottom', labels: { color: TEXT, boxWidth: 12, padding: 14, font: { size: 11 } } } }, datasets: { bar: { maxBarThickness: 42 } }, responsive: true, maintainAspectRatio: false }


  });


}





// ======================================


// DASHBOARD


// ======================================


function renderDashLowStock() {


  const low = products.filter(p => p.stock < p.min).sort((a,b) => a.stock - b.stock);


  document.getElementById('dashLowStock').innerHTML = low.map(p => {


    const cls = p.stock < 3 ? 'red' : 'amber';


    const label = p.stock < 3 ? 'Critical' : 'Low';


    return `<tr>


      <td>${p.emoji} ${p.name}</td>


      <td><span class="mono" style="font-weight:700;color:var(--${cls})">${p.stock}</span></td>


      <td class="mono dim">${p.min}</td>


      <td><span class="badge ${cls}">${label}</span></td>


      <td><button class="btn btn-sm btn-ghost" onclick="toast('\uD83D\uDCE6 Reorder placed for ${p.name}','success')">Reorder</button></td>


    </tr>`;


  }).join('');


}


// Update invoice count badge in sidebar
function updateInvoiceCount() {
  const invoicesBadge = document.getElementById('invoicesBadge');
  if (invoicesBadge) {
    invoicesBadge.textContent = invoices.length.toLocaleString('en-IN');
  }
}

// Render dynamic stock alerts on the Stock page
function renderStockAlerts() {
  const critical = products.filter(p => p.stock < 3).sort((a,b) => a.stock - b.stock);
  const low = products.filter(p => p.stock >= 3 && p.stock < p.min).sort((a,b) => a.stock - b.stock);
  const healthy = products.filter(p => p.stock >= p.min).length;
  const alertCount = critical.length + low.length;

  // Update sidebar badge
  const stockBadge = document.getElementById('stockBadge');
  if (stockBadge) {
    stockBadge.textContent = alertCount;
    stockBadge.style.display = alertCount > 0 ? 'inline-block' : 'none';
  }

  const criticalAlert = document.getElementById('criticalAlert');
  const lowAlert = document.getElementById('lowAlert');
  const healthyAlert = document.getElementById('healthyAlert');

  // Show/hide critical alert
  if (critical.length > 0) {
    criticalAlert.style.display = 'block';
    const criticalList = critical.map(p => `${p.emoji} ${p.name} — ${p.stock} units`).join(', ');
    document.getElementById('criticalBody').textContent = criticalList + '. Reorder immediately!';
  } else {
    criticalAlert.style.display = 'none';
  }

  // Show/hide low stock alert
  if (low.length > 0) {
    lowAlert.style.display = 'block';
    const lowList = low.map(p => `${p.emoji} ${p.name} (${p.stock}/${p.min})`).join(', ');
    document.getElementById('lowBody').textContent = lowList + ' below minimum threshold. Consider restocking.';
  } else {
    lowAlert.style.display = 'none';
  }

  // Show healthy status if no critical or low stock
  if (critical.length === 0 && low.length === 0) {
    healthyAlert.style.display = 'block';
    document.getElementById('healthyBody').textContent = `All ${healthy} products are well-stocked above minimum levels. ✨`;
  } else {
    healthyAlert.style.display = 'block';
    document.getElementById('healthyBody').textContent = `${healthy} products are well-stocked above minimum levels.`;
  }
}





function renderDashRecentInv() {


  const payIco = {Cash:'\uD83D\uDCB5',UPI:'\uD83D\uDCF2',Card:'\uD83D\uDCB3',Credit:'\uD83D\uDD12'};


  document.getElementById('dashRecentInv').innerHTML = invoices.slice(0,5).map(inv => {


    const {total} = calcInvoice(inv);


    return `<tr>


      <td class="mono dim">${inv.num}</td>


      <td>${inv.customer}</td>


      <td class="mono" style="color:var(--blue)">${fmtMoney(total)}</td>


      <td>${payIco[inv.payment]||''} ${inv.payment}</td>


      <td><span class="badge ${inv.status==='Paid'?'green':'amber'}">${inv.status}</span></td>


    </tr>`;


  }).join('');


}





function renderDashActivity() {

  // Build activity feed from database data (invoices, products)
  const activities = [];
  
  // Add recent invoices
  (invoices || []).slice(0, 3).forEach(inv => {
    const {total} = calcInvoice(inv);
    activities.push({
      dot: 'green',
      text: `Invoice #${inv.num} — ${inv.customer} — ${fmtMoney(total)}`,
      time: inv.date || 'Today'
    });
  });
  
  // Add low stock alerts
  (products || []).forEach(p => {
    if (p.stock <= p.min) {
      const color = p.stock <= 2 ? 'red' : 'amber';
      const msg = p.stock <= 2 ? 'Stock out' : 'Low stock';
      activities.push({
        dot: color,
        text: `${msg}: ${p.name} — ${p.stock} unit${p.stock !== 1 ? 's' : ''} remaining`,
        time: 'Alert'
      });
    }
  });
  
  // If no activities, show placeholder
  if (activities.length === 0) {
    activities.push({
      dot: 'gray',
      text: 'No recent activity',
      time: 'Today'
    });
  }

  document.getElementById('dashActivity').innerHTML = activities.slice(0, 6).map(a => `

    <div class="tl-item">

      <div class="tl-dot ${a.dot}"></div>

      <div class="tl-content"><div class="tl-text">${a.text}</div><div class="tl-time">${a.time}</div></div>

    </div>`).join('');

}





// ======================================


// POS


// ======================================


let posCatFilter = 'All';





function buildPOS() {


  // Cat filters


  const cats = ['All', ...new Set(products.map(p=>p.cat))];


  document.getElementById('posCatFilters').innerHTML = cats.map(c =>


    `<div class="cat-pill ${c===posCatFilter?'active':''}" onclick="setPOSCat('${c}',this)">${c}</div>`


  ).join('');


  renderPOSGrid('');


}





function setPOSCat(cat, el) {


  posCatFilter = cat;


  document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));


  el.classList.add('active');


  renderPOSGrid(document.querySelector('#page-pos .fld-input').value || '');


}





function filterPOSProducts(q) { renderPOSGrid(q); }





function renderPOSGrid(q='') {


  let list = products;


  if (posCatFilter !== 'All') list = list.filter(p => p.cat === posCatFilter);


  if (q) list = list.filter(p => p.name.toLowerCase().includes(q.toLowerCase()) || p.hsn.includes(q));


  document.getElementById('posProductGrid').innerHTML = list.map(p => `


    <div class="prod-card ${p.stock<=0?'oos':''}" onclick="addToCart(${p.id})">


      <div class="prod-gst-tag">${p.gst}%</div>


      <div class="prod-emoji">${p.emoji}</div>


      <div class="prod-name">${p.name}</div>


      <div class="prod-price">${fmtMoney(p.price)}</div>


      <div class="prod-stock">Stock: ${p.stock} ${p.unit}</div>


    </div>


  `).join('');


}





function addToCart(id) {


  const p = products.find(x => x.id === id);


  if (!p || p.stock <= 0) { toast('\u274C Out of stock', 'error'); return; }


  if (cart[id]) {


    if (cart[id].qty >= p.stock) { toast('\u26A0\uFE0F Max stock reached', 'warning'); return; }


    cart[id].qty++;


  } else {


    cart[id] = { ...p, qty: 1 };


  }


  renderCart();


}





function changeQty(id, delta) {


  if (!cart[id]) return;


  cart[id].qty += delta;


  if (cart[id].qty <= 0) delete cart[id];


  renderCart();


}





function removeFromCart(id) { delete cart[id]; renderCart(); }


function clearCart() { cart = {}; renderCart(); }





function renderCart() {


  const items = Object.values(cart);


  const count = items.reduce((s,i) => s+i.qty, 0);


  document.getElementById('cartBadge').textContent = count;





  if (!items.length) {


    document.getElementById('cartBody').innerHTML = `<div class="cart-empty"><div class="ico">\uD83D\uDED2</div><p>Tap any product to add it</p></div>`;


    document.getElementById('cSubtotal').textContent = '\u20B90.00';


    document.getElementById('cGST').textContent = '\u20B90.00';


    document.getElementById('cTotal').textContent = '\u20B90.00';


    return;


  }





  document.getElementById('cartBody').innerHTML = items.map(item => {


    const lineBase = item.price * item.qty;


    const lineGST = lineBase * item.gst / 100;


    return `<div class="ci">


      <div class="ci-icon">${item.emoji}</div>


      <div class="ci-info">


        <div class="ci-name">${item.name}</div>


        <div class="ci-price">${fmtMoney(item.price)} + ${item.gst}% GST</div>


      </div>


      <div class="ci-qty">


        <button class="ci-qty-btn" onclick="changeQty(${item.id},-1)">\u2212</button>


        <span class="ci-qty-num">${item.qty}</span>


        <button class="ci-qty-btn" onclick="changeQty(${item.id},1)">+</button>


      </div>


      <div class="ci-total">${fmtMoney(lineBase+lineGST)}</div>


      <div class="ci-del" onclick="removeFromCart(${item.id})">\u2715</div>


    </div>`;


  }).join('');





  updateCartTotals();


}





function updateCartTotals() {


  const items = Object.values(cart);


  const disc = parseFloat(document.getElementById('discountInput').value) || 0;


  let sub = 0, gst = 0;


  items.forEach(i => { const b = i.price*i.qty; sub+=b; gst += b*i.gst/100; });


  document.getElementById('cSubtotal').textContent = fmtMoney(sub);


  document.getElementById('cGST').textContent = fmtMoney(gst);


  document.getElementById('cTotal').textContent = fmtMoney(sub + gst - disc);


}





function selectPay(el) {


  selectedPayment = el.dataset.pay;


  document.querySelectorAll('.pay-opt').forEach(o => o.classList.remove('selected'));


  el.classList.add('selected');


  const notes = {cash:'', upi:'Share UPI QR code with customer', card:'Swipe/tap card on POS terminal', credit:'Outstanding amount will be added to customer ledger', cheque:'Collect cheque from customer before saving', netbank:'Generate net banking payment link'};


  document.getElementById('payNote').textContent = notes[selectedPayment] || '';


}





function searchCustomer(v) {


  const dd = document.getElementById('custDropdown');


  if (!v.trim()) { dd.classList.remove('open'); return; }


  const matches = customers.filter(c => c.name.toLowerCase().includes(v.toLowerCase()) || c.phone.includes(v));


  if (!matches.length) { dd.classList.remove('open'); return; }


  dd.innerHTML = matches.slice(0,4).map(c => `


    <div class="cust-opt" onclick="selectCustomer(${c.id})">


      <div class="cust-opt-name">${c.name}</div>


      <div class="cust-opt-meta">${c.phone} \u00B7 ${c.city}</div>


    </div>`).join('');


  dd.classList.add('open');


}





function selectCustomer(id) {


  const c = customers.find(x => x.id === id);


  if (!c) return;


  document.getElementById('posCustomerInput').value = c.name;


  document.getElementById('posPhone').value = c.phone;


  document.getElementById('posGSTIN').value = c.gstin || '';


  document.getElementById('custDropdown').classList.remove('open');


}





async function checkout() {


  const custName = document.getElementById('posCustomerInput').value.trim();


  if (!custName) { toast('\u26A0\uFE0F Please enter customer name', 'warning'); return; }


  if (!Object.keys(cart).length) { toast('\u26A0\uFE0F Cart is empty', 'warning'); return; }





  // Build invoice


  const items = Object.values(cart);


  const nextId = invoices.length ? (parseInt(invoices[0].num.split('-')[1]) || invoices[0].id) + 1 : 1285;


  const newInv = {


    num: 'INV-' + nextId,


    customer: custName,


    phone: document.getElementById('posPhone').value,


    date: new Date().toLocaleDateString('en-IN', {day:'numeric', month:'short', year:'numeric'}),


    items: items.map(i => ({name:i.name, qty:i.qty, price:i.price, gst:i.gst, hsn:i.hsn})),


    payment: selectedPayment.charAt(0).toUpperCase() + selectedPayment.slice(1),


    status: selectedPayment === 'credit' ? 'Pending' : 'Paid'


  };





  try {


    const res = await fetch(API_BASE + '/invoices', {


      method: 'POST', headers: { 'Content-Type': 'application/json' },


      body: JSON.stringify(newInv)


    });


    const savedInv = await res.json();


    if (!res.ok) throw new Error(savedInv.error || 'Failed to create invoice');


    invoices.unshift(savedInv);


    updateInvoiceCount();


    


    // Refresh products to reflect inventory deduction


    const pRes = await fetch(API_BASE + '/products');


    products = await pRes.json();


    


    // Refresh customers to reflect automatic creation / stat updates (orders, spent)


    const cRes = await fetch(API_BASE + '/customers');


    customers = await cRes.json();


    if (typeof renderCustTable === 'function') renderCustTable();



    clearCart();


    document.getElementById('posCustomerInput').value = '';


    document.getElementById('posPhone').value = '';


    const posGst = document.getElementById('posGSTIN');


    if (posGst) posGst.value = '';


    


    renderInvTable(invoices);


    updateInvoiceCount();


    renderDashStats(); // refresh dashboard stats


    renderDashLowStock();


    renderStockTable(products);


    buildPOS(); // visual refresh of product grid stock


    


    toast(`\u2705 Invoice ${savedInv.num} created for ${custName}`, 'success');


    setTimeout(() => {


      viewInvoice(savedInv.id);


    }, 400);


    setTimeout(() => {


      printInvoice(savedInv.id);


    }, 900);


  } catch(e) {


    toast('Failed to create invoice: ' + e.message, 'error');


  }


}





// ======================================


// INVOICES


// ======================================


function renderInvTable(list) {


  const canEdit = currentUser.role === 'Super Admin' || currentUser.role === 'Admin' || currentUser.role === 'Cashier';


  const payIco = {Cash:'💵',Upi:'📱',UPI:'📱',Card:'💳',Credit:'🔓',Cheque:'🏦',Netbank:'🌐'};


  document.getElementById('invTableBody').innerHTML = list.map(inv => {


    const {subtotal, gstTotal, total} = calcInvoice(inv);


    return `<tr>


      <td class="mono" style="color:var(--blue);font-weight:700;cursor:pointer;" onclick="viewInvoice(${inv.id})">${inv.num}</td>


      <td><span style="font-weight:600;">${inv.customer}</span><br><span class="mono dim" style="font-size:10px;">${inv.phone}</span></td>


      <td class="mono dim">${inv.date}</td>


      <td style="text-align:center;">${inv.items.length}</td>


      <td class="mono">${fmtMoney(subtotal)}</td>


      <td class="mono dim">${fmtMoney(gstTotal)}</td>


      <td class="mono" style="font-weight:700;color:var(--blue)">${fmtMoney(total)}</td>


      <td>${payIco[inv.payment]||''} ${inv.payment}</td>


      <td><span class="badge ${inv.status==='Paid'?'green':'amber'}">${inv.status}</span></td>


      <td style="display:flex;gap:5px;">
        <button class="btn btn-sm btn-ghost" onclick="viewInvoice(${inv.id})">View</button>
        <button class="btn btn-sm btn-ghost" onclick="printInvoice(${inv.id})">Print</button>
        ${canEdit ? `<button class="btn btn-sm btn-ghost" onclick="editInvoiceStatus(${inv.id})">Edit</button>` : ''}
      </td>


    </tr>`;


  }).join('');

  document.getElementById('invCount').textContent = list.length + ' records';
}

async function editInvoiceStatus(id) {
  const inv = invoices.find(x => x.id === id);
  if (!inv) return;
  const newStatus = inv.status === 'Paid' ? 'Pending' : 'Paid';
  if (!confirm(`Change status of Invoice ${inv.num} to ${newStatus}?`)) return;

  try {
    const res = await fetch(API_BASE + '/invoices/' + id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    if (!res.ok) throw new Error('Failed to update status');
    
    inv.status = newStatus;
    renderInvTable(invoices);
    
    // Refresh customers since outstanding balance might have changed
    const cRes = await fetch(API_BASE + '/customers');
    customers = await cRes.json();
    if (typeof renderCustTable === 'function') renderCustTable();
    
    toast(`✅ Invoice ${inv.num} status changed to ${newStatus}`, 'success');
  } catch(e) {
    toast('Error updating invoice status', 'error');
  }
}






function filterInvoices(q) {


  if (!q && q !== '') { renderInvTable(invoices); return; }


  const filtered = invoices.filter(inv =>


    inv.customer.toLowerCase().includes(q.toLowerCase()) ||


    inv.num.toLowerCase().includes(q.toLowerCase()) ||


    inv.phone.includes(q)


  );


  renderInvTable(filtered);


}





function viewInvoice(id) {


  const inv = invoices.find(i => i.id === id);


  if (!inv) return;


  const {subtotal, gstTotal, total} = calcInvoice(inv);


  document.getElementById('invModalNum').textContent = inv.num;


  document.getElementById('invPreviewContent').innerHTML = buildInvoiceHTML(inv, subtotal, gstTotal, total);


  openModal('invModal');


}





function buildInvoiceHTML(inv, subtotal, gstTotal, total) {


  const rows = inv.items.map((item, i) => {


    const base = item.price * item.qty;


    const gstAmt = base * item.gst / 100;


    return `<tr>


      <td>${i+1}</td>


      <td>${item.name}</td>


      <td style="color:#6b7280;font-size:11px;font-family:'IBM Plex Mono',monospace;">${item.hsn}</td>


      <td style="text-align:center;">${item.qty}</td>


      <td style="text-align:right;font-family:'IBM Plex Mono',monospace;">${fmtMoney(item.price)}</td>


      <td style="text-align:center;">${item.gst}%</td>


      <td style="text-align:right;font-family:'IBM Plex Mono',monospace;">${fmtMoney(gstAmt)}</td>


      <td style="text-align:right;font-family:'IBM Plex Mono',monospace;font-weight:700;">${fmtMoney(base+gstAmt)}</td>


    </tr>`;


  }).join('');





  // GST breakup


  const gstBreak = {};


  inv.items.forEach(item => {


    const r = item.gst + '%';


    if (!gstBreak[r]) gstBreak[r] = {taxable:0, cgst:0, sgst:0};


    const base = item.price * item.qty;


    gstBreak[r].taxable += base;


    gstBreak[r].cgst += base * item.gst / 200;


    gstBreak[r].sgst += base * item.gst / 200;


  });


  const gstBreakHTML = Object.entries(gstBreak).map(([rate, v]) =>


    `<div class="inv-gst-row"><span>GST @${rate} \u2014 Taxable: ${fmtMoney(v.taxable)}</span><span>CGST ${fmtMoney(v.cgst)} + SGST ${fmtMoney(v.sgst)}</span></div>`


  ).join('');





  return `


  <div style="position:relative;">


    ${inv.status==='Paid' ? '<div class="inv-paid-stamp">PAID</div>' : ''}


    <div class="inv-top">


      <div>


        <div class="inv-brand-name">BillForge</div>


        <div class="inv-brand-gst">GSTIN: 24AAAAA0000A1Z5 | admin@billforge.in</div>


        <div style="font-size:12px;color:#6b7280;margin-top:2px;">123 Main Market, Ring Road, Surat, Gujarat \u2014 395001</div>


        <div style="font-size:12px;color:#6b7280;">+91 98765 43210</div>


      </div>


      <div style="text-align:right;">


        <div class="inv-num-label">Tax Invoice</div>


        <div class="inv-num-val">${inv.num}</div>


        <div class="inv-date">Date: ${inv.date}</div>


        <div style="margin-top:6px;"><span class="badge ${inv.status==='Paid'?'green':'amber'}" style="font-size:12px;">${inv.status==='Paid'?'\u2713 ':''}${inv.status}</span></div>


      </div>


    </div>


    <div class="inv-parties">


      <div>


        <div class="inv-party-lbl">Bill To</div>


        <div class="inv-party-name">${inv.customer}</div>


        <div class="inv-party-detail">${inv.phone}<br>Customer</div>


      </div>


      <div style="text-align:right;">


        <div class="inv-party-lbl">Payment Method</div>


        <div class="inv-party-name" style="font-size:14px;">${inv.payment}</div>


        <div class="inv-party-detail">${inv.date}</div>


      </div>


    </div>


    <table class="inv-tbl">


      <thead><tr><th>#</th><th>Description</th><th>HSN</th><th style="text-align:center;">Qty</th><th style="text-align:right;">Unit Price</th><th style="text-align:center;">GST</th><th style="text-align:right;">Tax</th><th style="text-align:right;">Amount</th></tr></thead>


      <tbody>${rows}</tbody>


    </table>


    <div style="display:grid;grid-template-columns:1fr 280px;gap:16px;margin-bottom:16px;">


      <div class="inv-gst-breakdown">


        <div class="inv-gst-title">GST Breakup (CGST + SGST)</div>


        ${gstBreakHTML}


        <div class="inv-gst-row" style="font-weight:700;border-top:1px solid #e5e7eb;margin-top:5px;padding-top:5px;color:#374151;"><span>Total GST</span><span>${fmtMoney(gstTotal)}</span></div>


      </div>


      <div>


        <div class="inv-sum-row"><span>Subtotal</span><span class="v mono">${fmtMoney(subtotal)}</span></div>


        <div class="inv-sum-row"><span>CGST</span><span class="v mono">${fmtMoney(gstTotal/2)}</span></div>


        <div class="inv-sum-row"><span>SGST</span><span class="v mono">${fmtMoney(gstTotal/2)}</span></div>


        <div class="inv-sum-row grand"><span>Grand Total</span><span class="v mono">${fmtMoney(total)}</span></div>


        <div style="margin-top:8px;background:#f9fafb;border-radius:6px;padding:8px 10px;font-size:11px;color:#6b7280;">


          <strong style="color:#374151;">Amount in Words:</strong><br>


          ${numberToWords(Math.round(total))} Rupees Only


        </div>


      </div>


    </div>


    <div class="inv-foot">


      <div class="inv-terms"><strong>Terms & Conditions:</strong><br>1. Goods once sold will not be taken back.<br>2. Subject to Surat jurisdiction only.<br>3. E. & O.E.</div>


      <div class="inv-sign"><div class="inv-sign-line"></div>Authorised Signatory<br><strong>BillForge Store</strong></div>


    </div>


  </div>`;


}





function numberToWords(n) {


  if (n >= 100000) return (n/100000).toFixed(1) + ' Lakh';


  if (n >= 1000) return (n/1000).toFixed(1) + ' Thousand';


  return n;


}





// ======================================


// CUSTOMERS


// ======================================


let editingCustomerId = null;

function renderCustTable() {
  const canEdit = currentUser.role === 'Super Admin' || currentUser.role === 'Admin' || currentUser.role === 'Cashier';


  document.getElementById('custTableBody').innerHTML = customers.map(c => `


    <tr>


      <td class="mono dim">#C-${String(c.id).padStart(3,'0')}</td>


      <td><div style="font-weight:600;">${c.name}</div><div style="font-size:11px;color:var(--ash);">${c.email}</div></td>


      <td class="mono dim">${c.phone}</td>


      <td>${c.city}</td>


      <td class="mono" style="font-size:11px;color:var(--ash);">${c.gstin||'\u2014'}</td>


      <td style="text-align:center;">${c.orders}</td>


      <td class="mono" style="color:var(--blue);font-weight:700;">${fmtMoneyShort(c.spent)}</td>


      <td class="mono" style="color:${c.outstanding>0?'var(--red)':'var(--ash)'}">${c.outstanding>0?fmtMoney(c.outstanding):'\u2014'}</td>


      <td class="dim">${c.lastOrder}</td>


      <td style="display:flex;gap:5px;">
        <button class="btn btn-sm btn-ghost" onclick="viewCustomer(${c.id})">View</button>
        <button class="btn btn-sm btn-ghost" onclick="invoiceCustomer(${c.id})">Invoice</button>
        ${canEdit ? `<button class="btn btn-sm btn-ghost" onclick="editCustomer(${c.id})">Edit</button>` : ''}
      </td>
    </tr>`).join('');


  // Update live count in page subtitle


  const cc = document.getElementById('custCount');


  if (cc) cc.textContent = customers.length + ' registered customers';


}



function viewCustomer(id) {


  const c = customers.find(x => x.id === id);


  if (!c) return;


  const h = `


    <div style="font-size:20px;font-weight:800;color:var(--blue);margin-bottom:4px;">${c.name}</div>


    <div style="color:var(--ash);font-size:12px;margin-bottom:20px;letter-spacing:1px;">#C-${String(c.id).padStart(3,'0')}</div>


    <div class="form-row cols-2" style="margin-bottom:12px;">


      <div><span style="font-size:11px;color:var(--ash);text-transform:uppercase;">Phone</span><div class="mono" style="font-size:14px;">${c.phone}</div></div>


      <div><span style="font-size:11px;color:var(--ash);text-transform:uppercase;">Email</span><div style="font-size:14px;">${c.email||'—'}</div></div>


    </div>


    <div class="form-row cols-2" style="margin-bottom:20px;">


      <div><span style="font-size:11px;color:var(--ash);text-transform:uppercase;">City</span><div style="font-size:14px;">${c.city}</div></div>


      <div><span style="font-size:11px;color:var(--ash);text-transform:uppercase;">GSTIN</span><div class="mono" style="font-size:14px;">${c.gstin||'—'}</div></div>


    </div>


    <div style="border-top:1px solid var(--mist);padding-top:16px;display:flex;justify-content:space-between;">


      <div><span style="font-size:11px;color:var(--ash);text-transform:uppercase;">Total Orders</span><div class="mono" style="font-size:18px;font-weight:700;">${c.orders}</div></div>


      <div><span style="font-size:11px;color:var(--ash);text-transform:uppercase;">Total Spent</span><div class="mono" style="font-size:18px;font-weight:700;color:var(--blue);">${fmtMoney(c.spent)}</div></div>


      <div><span style="font-size:11px;color:var(--ash);text-transform:uppercase;">Outstanding</span><div class="mono" style="font-size:18px;font-weight:700;color:${c.outstanding>0?'var(--red)':'var(--green)'};">${fmtMoney(c.outstanding||0)}</div></div>


    </div>


  `;


  document.getElementById('vc-details').innerHTML = h;


  openModal('viewCustModal');


}



function invoiceCustomer(id) {


  const c = customers.find(x => x.id === id);


  if (!c) return;


  nav('pos', null);


  document.getElementById('posCustomerInput').value = c.name;


  document.getElementById('posPhone').value = c.phone || '';


  document.getElementById('posGSTIN').value = c.gstin || '';


  toast('\u2705 Customer info loaded for checkout', 'success');


}





function openAddCustomerModal() {
  editingCustomerId = null;
  const mod = document.getElementById('addCustModal');
  if (mod.querySelector('.modal-title')) mod.querySelector('.modal-title').innerText = 'Add New Customer';
  if (document.getElementById('saveCustBtn')) document.getElementById('saveCustBtn').innerText = 'Add Customer';
  document.getElementById('nc-name').value = '';
  document.getElementById('nc-phone').value = '';
  document.getElementById('nc-email').value = '';
  document.getElementById('nc-city').value = '';
  document.getElementById('nc-gstin').value = '';
  openModal('addCustModal');
}

function editCustomer(id) {
  const c = customers.find(x => x.id === id);
  if (!c) return;
  editingCustomerId = id;
  const mod = document.getElementById('addCustModal');
  if (mod.querySelector('.modal-title')) mod.querySelector('.modal-title').innerText = 'Edit Customer';
  if (document.getElementById('saveCustBtn')) document.getElementById('saveCustBtn').innerText = 'Save Changes';
  document.getElementById('nc-name').value = c.name || '';
  document.getElementById('nc-phone').value = c.phone || '';
  document.getElementById('nc-email').value = c.email || '';
  document.getElementById('nc-city').value = c.city || '';
  document.getElementById('nc-gstin').value = c.gstin || '';
  openModal('addCustModal');
}

async function addCustomer() {
  const name = document.getElementById('nc-name').value.trim();
  const phone = document.getElementById('nc-phone').value.trim();
  if (!name || !phone) { toast('⚠️ Name and Phone required', 'warning'); return; }

  const payload = { 
    name, phone, 
    email: document.getElementById('nc-email').value, 
    city: document.getElementById('nc-city').value, 
    gstin: document.getElementById('nc-gstin').value, 
    type: 'Retail' 
  };

  try {
    if (editingCustomerId) {
      await fetch(API_BASE + '/customers/' + editingCustomerId, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const c = customers.find(x => x.id === editingCustomerId);
      if (c) {
        c.name = name; c.phone = phone; c.email = payload.email; c.city = payload.city; c.gstin = payload.gstin;
      }
      toast(`✅ Customer "${name}" updated`, 'success');
    } else {
      // For new customers, add initial stat fields
      payload.orders = 0; payload.spent = 0; payload.outstanding = 0; payload.lastOrder = '—';
      const res = await fetch(API_BASE + '/customers', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const saved = await res.json();
      customers.push(saved);
      toast(`✅ Customer "${name}" added`, 'success');
    }
    renderCustTable();
    closeModal('addCustModal');
  } catch(e) { toast('Error saving customer', 'error'); }
}





// ======================================


// PRODUCTS


// ======================================


let editingProductId = null;





function renderProdTable(list) {


  const catColors = {Grocery:'blue',Dairy:'green',Beverages:'amber',Snacks:'purple','Personal Care':'ash'};


  const canEdit = currentUser.role === 'Super Admin' || currentUser.role === 'Admin' || currentUser.role === 'Cashier';


  document.getElementById('prodTableBody').innerHTML = list.map(p => {


    const stockCls = p.stock < 3 ? 'red' : p.stock < p.min ? 'amber' : 'green';


    const stockLabel = p.stock < 3 ? 'Critical' : p.stock < p.min ? 'Low' : 'In Stock';


    const btnHtml = canEdit ? `<button class="btn btn-sm btn-ghost" onclick="editProduct(${p.id})">Edit</button>


        <button class="btn btn-sm btn-ghost" style="color:var(--red);" onclick="deleteProduct(${p.id})">Del</button>` : '';


    return `<tr>


      <td class="mono dim" style="font-size:11px;">${p.sku}</td>


      <td><div style="font-weight:600;">${p.emoji} ${p.name}</div></td>


      <td><span class="badge ${catColors[p.cat]||'ash'}">${p.cat}</span></td>


      <td class="mono dim">${p.hsn}</td>


      <td class="mono" style="font-weight:700;">${fmtMoney(p.price)}</td>


      <td><span class="gst-chip">${p.gst}%</span></td>


      <td class="mono" style="font-weight:700;color:var(--${stockCls})">${p.stock}</td>


      <td class="dim">${p.unit}</td>


      <td class="mono dim">${p.min}</td>


      <td><span class="badge ${stockCls}">${stockLabel}</span></td>


      <td style="display:flex;gap:5px;">${btnHtml}</td>


    </tr>`;


  }).join('');


  document.getElementById('prodCount').textContent = list.length + ' products';


}





function editProduct(id) {


  const p = products.find(x => x.id === id);


  if (!p) return;


  editingProductId = id;


  const mod = document.getElementById('addProdModal');


  if (mod.querySelector('.modal-title')) mod.querySelector('.modal-title').innerText = 'Edit Product';


  document.getElementById('np-name').value = p.name;


  document.getElementById('np-price').value = p.price;


  document.getElementById('np-hsn').value = p.hsn;


  document.getElementById('np-buy').value = p.buyPrice || 0;


  document.getElementById('np-stock').value = p.stock;


  document.getElementById('np-min').value = p.min;


  document.getElementById('np-cat').value = p.cat;


  document.getElementById('np-gst').value = p.gst;


  document.getElementById('np-unit').value = p.unit;


  openModal('addProdModal');


}





async function deleteProduct(id) {


  if (!confirm("Are you sure you want to permanently delete this product?")) return;


  try {


    await fetch(API_BASE + '/products/' + id, { method: 'DELETE' });


    products = products.filter(x => x.id !== id);


    renderProdTable(products);


    buildPOS();


    renderStockTable(products);


    initAll();


    toast('\uD83D\uDDD1\uFE0F Product deleted', 'success');


  } catch(e) { toast('Error deleting product', 'error'); }


}





function filterProducts(q) {


  renderProdTable(products.filter(p => p.name.toLowerCase().includes(q.toLowerCase()) || p.sku.toLowerCase().includes(q.toLowerCase()) || p.hsn.includes(q)));


}


function filterProductsCat(cat) {


  renderProdTable(cat ? products.filter(p=>p.cat===cat) : products);


}





function openAddProductModal() { 


  editingProductId = null;


  const mod = document.getElementById('addProdModal');


  if (mod.querySelector('.modal-title')) mod.querySelector('.modal-title').innerText = 'Add New Product';


  document.getElementById('np-name').value = '';


  document.getElementById('np-price').value = '';


  document.getElementById('np-hsn').value = '';


  document.getElementById('np-buy').value = '';


  document.getElementById('np-stock').value = '';


  document.getElementById('np-min').value = '';


  openModal('addProdModal'); 


}





async function addProduct() {


  const name = document.getElementById('np-name').value.trim();


  const price = parseFloat(document.getElementById('np-price').value) || 0;


  if (!name || !price) { toast('\u26A0\uFE0F Name and Price required', 'warning'); return; }


  const emojiMap = {Grocery:'\uD83D\uDED2',Dairy:'\uD83E\uDD5B',Beverages:'\u2615',Snacks:'\uD83C\uDF6A','Personal Care':'\uD83E\uDDF4'};


  const cat = document.getElementById('np-cat').value;


  const newProd = {


    name, cat,


    hsn: document.getElementById('np-hsn').value || '\u2014',


    price,


    buyPrice: parseFloat(document.getElementById('np-buy').value)||0,


    gst: parseInt(document.getElementById('np-gst').value)||18,


    stock: parseInt(document.getElementById('np-stock').value)||0,


    min: parseInt(document.getElementById('np-min').value)||5,


    unit: document.getElementById('np-unit').value,


    emoji: emojiMap[cat]||'\uD83D\uDCE6'


  };





  try {


    if (editingProductId) {


       await fetch(API_BASE + '/products/' + editingProductId, {


         method: 'PUT', headers: { 'Content-Type': 'application/json' },


         body: JSON.stringify(newProd)


       });


       const p = products.find(x => x.id === editingProductId);


       if(p) Object.assign(p, newProd);


       toast(`\u2705 "${name}" updated successfully`, 'success');


    } else {


       const nextId = products.length ? Math.max(...products.map(p=>p.id)) + 1 : 1;


       newProd.sku = 'SKU-' + String(nextId).padStart(3,'0');


       const res = await fetch(API_BASE + '/products', {


         method: 'POST', headers: { 'Content-Type': 'application/json' },


         body: JSON.stringify(newProd)


       });


       const saved = await res.json();


       products.push(saved);


       toast(`\u2705 "${name}" added to catalog`, 'success');


    }


    renderProdTable(products);


    buildPOS();


    renderStockTable(products);


    initAll();


    closeModal('addProdModal');


  } catch(e) { toast('Error saving product', 'error'); }


}








// ======================================


// STOCK


// ======================================


function renderStockTable(list) {


  document.getElementById('stockTableBody').innerHTML = list.map(p => {


    const pct = Math.min(100, Math.round(p.stock / Math.max(p.min*2,1) * 100));


    const cls = p.stock < 3 ? 'red' : p.stock < p.min ? 'amber' : 'green';


    const label = p.stock < 3 ? 'Critical' : p.stock < p.min ? 'Low' : 'OK';


    const colorMap = {red:'#c81e1e',amber:'#b45309',green:'#057a55'};


    const stockVal = p.stock * p.price;


    return `<tr>


      <td class="mono dim" style="font-size:11px;">${p.sku}</td>


      <td>${p.emoji} ${p.name}</td>


      <td><span class="badge blue" style="font-size:10px;">${p.cat}</span></td>


      <td class="mono">${fmtMoney(p.price)}</td>


      <td class="mono" style="font-weight:700;color:${colorMap[cls]}">${p.stock}</td>


      <td class="mono dim">${p.min}</td>


      <td style="min-width:80px;"><div class="stock-track"><div class="stock-fill" style="width:${pct}%;background:${colorMap[cls]};"></div></div><div style="font-size:10px;color:var(--ash);margin-top:2px;">${pct}%</div></td>


      <td class="mono dim">${fmtMoney(stockVal)}</td>


      <td class="mono dim">Today</td>


      <td><span class="badge ${cls}">${label}</span></td>


      <td>${(p.stock < p.min) ? `<button class="btn btn-sm btn-ghost" style="color:var(--blue);" onclick="reorderStock(${p.id})">Reorder</button>` : `<span class="dim" style="font-size:12px;">\u2014</span>`}</td>


    </tr>`;


  }).join('');


}





function reorderStock(id) {


  const p = products.find(x => x.id === id);


  if (!p) return;





  // Calculate how many units needed to reach 2\u00D7 minimum threshold


  const deficit = Math.max(p.min * 2 - p.stock, p.min);


  const estimatedCost = Math.round(deficit * p.price * 0.75); // 75% of sell price as buy price estimate





  // Pre-fill the PO modal


  const today = new Date().toISOString().split('T')[0];


  document.getElementById('npo-supplier').value = p.cat + ' Supplier';


  document.getElementById('npo-date').value = today;


  document.getElementById('npo-items').value = `${deficit}x ${p.name} (${p.unit}) \u2014 Restock from ${p.stock} to ${p.min * 2}`;


  document.getElementById('npo-amount').value = estimatedCost;


  document.getElementById('npo-status').value = 'In Transit';





  openModal('addPOModal');


  toast(`\uD83D\uDCE6 Reorder suggestion ready for "${p.name}"`, 'info');


}





// ======================================


// ADJUST STOCK MODAL


// ======================================


function openAdjustStockModal() {


  // Populate product dropdown from live products array


  const sel = document.getElementById('adj-product');


  sel.innerHTML = '<option value="">-- Choose a product --</option>' +


    products.map(p => `<option value="${p.id}">${p.emoji} ${p.name} (Current: ${p.stock} ${p.unit})</option>`).join('');


  document.getElementById('adj-qty').value = '';


  document.getElementById('adj-reason').value = '';


  document.getElementById('adjPreview').style.display = 'none';


  openModal('adjustStockModal');


}





function updateAdjPreview() {


  const id = parseInt(document.getElementById('adj-product').value);


  const qty = parseInt(document.getElementById('adj-qty').value) || 0;


  const type = document.getElementById('adj-type').value;


  const p = products.find(x => x.id === id);


  const preview = document.getElementById('adjPreview');


  if (!p || !qty) { preview.style.display = 'none'; return; }





  let newStock = p.stock;


  if (type === 'add')    newStock = p.stock + qty;


  if (type === 'remove') newStock = Math.max(0, p.stock - qty);


  if (type === 'set')    newStock = qty;





  document.getElementById('adjCurrent').textContent = p.stock + ' ' + p.unit;


  document.getElementById('adjNew').textContent = newStock + ' ' + p.unit;





  const badge = document.getElementById('adjBadge');


  if (newStock < 3)      { badge.className = 'badge red';   badge.textContent = 'Critical'; }


  else if (newStock < p.min) { badge.className = 'badge amber'; badge.textContent = 'Low'; }


  else                   { badge.className = 'badge green'; badge.textContent = 'Healthy'; }





  preview.style.display = 'block';


}





async function saveStockAdjustment() {


  const id = parseInt(document.getElementById('adj-product').value);


  const qty = parseInt(document.getElementById('adj-qty').value) || 0;


  const type = document.getElementById('adj-type').value;


  const p = products.find(x => x.id === id);


  if (!p) { toast('\u26A0\uFE0F Please select a product', 'warning'); return; }


  if (!qty) { toast('\u26A0\uFE0F Please enter a quantity', 'warning'); return; }





  let newStock = p.stock;


  if (type === 'add')    newStock = p.stock + qty;


  if (type === 'remove') newStock = Math.max(0, p.stock - qty);


  if (type === 'set')    newStock = qty;





  try {


    await fetch(API_BASE + '/products/' + id, {


      method: 'PUT',


      headers: { 'Content-Type': 'application/json' },


      body: JSON.stringify({ ...p, stock: newStock })


    });


    p.stock = newStock;


    renderStockTable(products);


    renderProdTable(products);


    renderDashStats();


    renderDashLowStock();


    closeModal('adjustStockModal');


    toast(`\u2705 Stock adjusted: ${p.name} is now ${newStock} ${p.unit}`, 'success');


  } catch(e) { toast('Error saving adjustment', 'error'); }


}





// ======================================


// REPORTS


// ======================================


function renderReportData() {

  // Calculate current month revenue, GST, and profit
  const now = new Date();
  const curMonth = now.toLocaleString('en-IN', { month: 'short' });
  const curYear = now.getFullYear().toString();
  
  let monthRev = 0, monthGST = 0, monthExpense = 0;
  const paidInvoices = invoices.filter(i => i.status === 'Paid');
  
  paidInvoices.forEach(inv => {
    if (inv.date.includes(curMonth) && inv.date.includes(curYear)) {
      const calc = calcInvoice(inv);
      monthRev += calc.total;
      monthGST += calc.gstTotal;
    }
  });
  
  // Calculate expenses for current month
  (expenses || []).forEach(e => {
    const eDate = e.date || '';
    if (eDate.includes(curMonth) && eDate.includes(curYear)) {
      monthExpense += parseFloat(e.amount) || 0;
    }
  });
  
  const monthProfit = monthRev - monthExpense - monthGST;
  const profitMargin = monthRev > 0 ? ((monthProfit / monthRev) * 100).toFixed(1) : 0;
  
  // Update KPI cards
  const revEl = document.getElementById('rptMonthRevenue');
  const profitEl = document.getElementById('rptGrossProfit');
  const gstEl = document.getElementById('rptGSTCollected');
  const trendEl = document.getElementById('rptMonthTrend');
  const profitTrendEl = document.getElementById('rptProfitTrend');
  const gstBreakdownEl = document.getElementById('rptGSTBreakdown');
  
  if (revEl) revEl.textContent = fmtMoney(monthRev);
  if (profitEl) profitEl.textContent = fmtMoney(monthProfit);
  if (gstEl) gstEl.textContent = fmtMoney(monthGST);
  if (trendEl) trendEl.textContent = `↑ This month · ${paidInvoices.filter(i => i.date.includes(curMonth) && i.date.includes(curYear)).length} invoices`;
  if (profitTrendEl) profitTrendEl.textContent = `↑ Margin: ${profitMargin}%`;
  if (gstBreakdownEl) gstBreakdownEl.textContent = `CGST: ${fmtMoney(monthGST/2)} · SGST: ${fmtMoney(monthGST/2)}`;

  const monthlyMap = {};


  invoices.filter(i => i.status === 'Paid').forEach(inv => {


    const parts = inv.date.split(' ');


    if (parts.length === 3) {


      const mn = parts[1] + ' ' + parts[2];


      if (!monthlyMap[mn]) monthlyMap[mn] = { m: mn, inv: 0, cust: new Set(), rev: 0 };


      monthlyMap[mn].inv++;


      monthlyMap[mn].cust.add(inv.customer);


      monthlyMap[mn].rev += calcInvoice(inv).total;


    }


  });

  const months = Object.values(monthlyMap);


  if (months.length === 0) {


    document.getElementById('rptMonthlySummary').innerHTML = '<tr><td colspan="9" style="text-align:center;padding:20px;">No actual sales data available</td></tr>';


  } else {


    document.getElementById('rptMonthlySummary').innerHTML = months.map(data => {


      const rev = data.rev;


      const gst = Math.round(rev*0.16); 


      const exp = Math.round(rev*0.62); 


      const profit = rev - exp - gst; 


      const margin = rev ? ((profit/rev)*100).toFixed(1) : 0;


      return `<tr><td>${data.m}</td><td style="text-align:center;">${data.inv}</td><td style="text-align:center;">${data.cust.size}</td><td class="mono">${fmtMoneyShort(rev)}</td><td class="mono">${fmtMoneyShort(gst)}</td><td class="mono">${fmtMoneyShort(rev-gst)}</td><td class="mono">${fmtMoneyShort(exp)}</td><td class="mono" style="color:var(--green);font-weight:700;">${fmtMoneyShort(profit)}</td><td style="color:var(--green)">${margin}%</td></tr>`;


    }).join('');


  }





  const itemCounts = {};


  invoices.filter(i => i.status === 'Paid').forEach(inv => {


    (inv.items||[]).forEach(it => {


       if(!itemCounts[it.name]) itemCounts[it.name] = { name: it.name, units: 0, rev: 0 };


       itemCounts[it.name].units += it.qty;


       itemCounts[it.name].rev += (it.price * it.qty);


    });


  });


  


  const topProds = Object.values(itemCounts).sort((a,b)=>b.units-a.units).slice(0,5);


  if (topProds.length === 0) {


     document.getElementById('rptTopProducts').innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;">No product sales data</td></tr>';


  } else {


    document.getElementById('rptTopProducts').innerHTML = topProds.map((d,i) => {


      const p = products.find(prod => prod.name === d.name);


      const cat = p ? p.cat : 'Unknown';


      const ico = p ? p.emoji : '\uD83D\uDCE6';


      const rank = ['\uD83E\uDD47','\uD83E\uDD48','\uD83E\uDD49','4','5'][i] || (i+1);


      const avg = d.units ? d.rev / d.units : 0;


      return `<tr><td>${rank}</td><td style="font-weight:600;">${ico} ${d.name}</td><td><span class="badge blue" style="font-size:10px;">${cat}</span></td><td style="text-align:center;font-family:var(--mono);">${d.units}</td><td class="mono" style="color:var(--blue)">${fmtMoney(d.rev)}</td><td class="mono">${fmtMoney(avg)}</td><td style="color:var(--green);font-weight:700;">Computed</td></tr>`;


    }).join('');


  }





  const custStats = {};


  invoices.filter(i => i.status === 'Paid').forEach(inv => {


      if (!custStats[inv.customer]) custStats[inv.customer] = { name: inv.customer, orders: 0, spent: 0 };


      custStats[inv.customer].orders++;


      custStats[inv.customer].spent += calcInvoice(inv).total;


  });


  


  const topCust = Object.values(custStats).sort((a,b)=>b.spent-a.spent).slice(0,5);


  if(topCust.length === 0) {


    document.getElementById('rptTopCust').innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;">No customer sales data</td></tr>';


  } else {


    document.getElementById('rptTopCust').innerHTML = topCust.map((c,i) => {


      const rank = ['\uD83E\uDD47','\uD83E\uDD48','\uD83E\uDD49','4','5'][i] || (i+1);


      return `<tr><td>${rank}</td><td style="font-weight:600;">${c.name}</td><td style="text-align:center;">${c.orders}</td><td class="mono" style="color:var(--blue);font-weight:700;">${fmtMoney(c.spent)}</td><td class="mono">${fmtMoney(c.orders?c.spent/c.orders:0)}</td><td class="dim">Recent</td></tr>`;


    }).join('');


  }

  // Render GST summary table
  renderGSTSummary();
}

// Render GST summary table dynamically
function renderGSTSummary() {
  const paidInvoices = invoices.filter(i => i.status === 'Paid');
  const rateMap = {};
  
  paidInvoices.forEach(inv => {
    (inv.items || []).forEach(item => {
      const base = item.price * item.qty;
      const gstAmt = base * item.gst / 100;
      const rate = item.gst + '%';
      
      if (!rateMap[rate]) {
        rateMap[rate] = { rate: item.gst, taxable: 0, cgst: 0, sgst: 0, total: 0, count: 0 };
      }
      
      rateMap[rate].taxable += base;
      rateMap[rate].cgst += gstAmt / 2;
      rateMap[rate].sgst += gstAmt / 2;
      rateMap[rate].total += gstAmt;
      rateMap[rate].count++;
    });
  });
  
  const tbody = document.getElementById('rptGSTSummary');
  if (!tbody) return;
  
  const rates = Object.values(rateMap).sort((a, b) => a.rate - b.rate);
  
  if (rates.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;">No GST data available</td></tr>';
    return;
  }
  
  let totalTaxable = 0, totalCGST = 0, totalSGST = 0, totalGST = 0, totalCount = 0;
  
  tbody.innerHTML = rates.map(r => {
    totalTaxable += r.taxable;
    totalCGST += r.cgst;
    totalSGST += r.sgst;
    totalGST += r.total;
    totalCount += r.count;
    
    return `<tr>
      <td><span class="gst-chip">${r.rate}%</span></td>
      <td class="mono">${fmtMoney(r.taxable)}</td>
      <td class="mono">${fmtMoney(r.cgst)}</td>
      <td class="mono">${fmtMoney(r.sgst)}</td>
      <td class="mono dim">—</td>
      <td class="mono" style="color:var(--blue)">${fmtMoney(r.total)}</td>
      <td style="text-align:center;">${r.count}</td>
    </tr>`;
  }).join('');
  
  // Add totals row
  const tfoot = tbody.parentElement.querySelector('tfoot');
  if (tfoot) {
    tfoot.innerHTML = `<tr style="font-weight:700;background:var(--paper);">
      <td><strong>TOTAL</strong></td>
      <td class="mono">${fmtMoney(totalTaxable)}</td>
      <td class="mono">${fmtMoney(totalCGST)}</td>
      <td class="mono">${fmtMoney(totalSGST)}</td>
      <td class="mono dim">—</td>
      <td class="mono" style="color:var(--red)">${fmtMoney(totalGST)}</td>
      <td style="text-align:center;">${totalCount}</td>
    </tr>`;
  }
  
  // Update KPI cards in Reports > GST tab
  const cgstEl = document.getElementById('rptGSTCGST');
  const sgstEl = document.getElementById('rptGSTSGST');
  const totalEl = document.getElementById('rptGSTTotal');
  
  if (cgstEl) cgstEl.textContent = fmtMoney(totalCGST);
  if (sgstEl) sgstEl.textContent = fmtMoney(totalSGST);
  if (totalEl) totalEl.textContent = fmtMoney(totalGST);
}

function switchReportTab(id, el) {


  ['sales','products','customers','gst'].forEach(t => {


    const el2 = document.getElementById('rt-'+t);


    if (el2) el2.style.display = t===id?'':'none';


  });


  document.querySelectorAll('#page-reports .tab').forEach(t => t.classList.remove('active'));


  el.classList.add('active');


}





// Settings tabs


function switchSettingsTab(id, el) {


  ['biz','inv','tax','usr','notif'].forEach(t => {


    const el2 = document.getElementById('settings-'+t);


    if (el2) el2.style.display = t===id?'':'none';


  });


  document.querySelectorAll('#page-settings .tab').forEach(t => t.classList.remove('active'));


  el.classList.add('active');


}





// Close dropdown on outside click


document.addEventListener('click', e => {


  if (!e.target.closest('.cust-search-wrap')) {


    document.getElementById('custDropdown').classList.remove('open');


  }


});





// Keyboard shortcut: N = new invoice


document.addEventListener('keydown', e => {


  if (e.key === 'n' && !e.target.matches('input,textarea,select') && document.getElementById('appShell').style.display !== 'none') {


    nav('pos', null);


  }


});


// ======================================


// EXPORTS


// ======================================


function exportCSV(type) {


  let csvContent = "data:text/csv;charset=utf-8,";


  


  if (type === 'invoices') {


    csvContent += "ID,Num,Customer,Phone,Date,Payment,Status\n";


    invoices.forEach(i => csvContent += `${i.id},${i.num},${i.customer},${i.phone},${i.date},${i.payment},${i.status}\n`);


  } else if (type === 'products' || type === 'stock') {


    csvContent += "ID,SKU,Name,Category,HSN,Price,BuyPrice,GST,Stock,Min,Unit\n";


    products.forEach(p => csvContent += `${p.id},${p.sku},${p.name},${p.cat},${p.hsn},${p.price},${p.buyPrice},${p.gst},${p.stock},${p.min},${p.unit}\n`);


  }


  


  const encodedUri = encodeURI(csvContent);


  const link = document.createElement("a");


  link.setAttribute("href", encodedUri);


  link.setAttribute("download", `billforge_${type}_export.csv`);


  document.body.appendChild(link);


  link.click();


  document.body.removeChild(link);


  toast(`\uD83D\uDD25 Downloaded ${type} CSV successfully`, 'success');


}








// ======================================


// NEW MODULES (EXPENSES, PO, QUOTES)


// ======================================


function renderExpTable(list) {


  const el = document.getElementById('expTableBody');


  if (!el) return;


  if (!list || list.length === 0) {


    el.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:20px;">No expenses recorded</td></tr>';


    return;


  }


  el.innerHTML = list.map(e => `<tr><td class="mono dim">${escapeHtml(e.date || '')}</td><td><span class="badge blue">${escapeHtml(e.cat || 'General')}</span></td><td>${escapeHtml(e.desc || '')}</td><td>${escapeHtml(e.vendor || '')}</td><td class="mono">₹${Number(e.amount).toLocaleString('en-IN')}</td><td class="mono dim">₹${e.gst||0}</td><td>${escapeHtml(e.paidBy || 'Cash')}</td><td><span class="badge ash">Recorded</span></td></tr>`).join('');


}





async function addExpense() {


  const n = {


    date: document.getElementById('ne-date').value || new Date().toISOString().split('T')[0],


    cat: document.getElementById('ne-cat').value,


    amount: parseFloat(document.getElementById('ne-amount').value) || 0,


    gst: parseFloat(document.getElementById('ne-gst').value) || 0,


    desc: document.getElementById('ne-desc').value,


    vendor: document.getElementById('ne-vendor').value,


    paidBy: document.getElementById('ne-paidBy').value,


    receipt: 'None'


  };


  if(!n.amount) { toast('Amount required', 'warning'); return; }


  try {


    const res = await fetch(API_BASE + '/expenses', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(n) });


    const saved = await res.json();


    expenses.unshift(saved);


    renderExpTable(expenses);


    closeModal('addExpModal');


    toast('\u2705 Expense saved', 'success');


  } catch(e) { toast('Error saving expense', 'error'); }


}





function renderPOTable(list) {


  const el = document.getElementById('poTableBody');


  if (!el) return;


  if (!list || list.length === 0) {


    el.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:20px;">No actual Purchase Orders</td></tr>';


    return;


  }


  el.innerHTML = list.map(p => {


    const isTrans = p.status === 'In Transit';


    const btnParams = isTrans 


      ? `class="btn btn-sm" style="background:#057a55;color:#fff;border:none;" onclick="receivePO(${p.id})">Receive` 


      : `class="btn btn-sm btn-ghost" onclick="viewPO(${p.id})">View`;


    const statusColor = p.status === 'Received' ? 'green' : (p.status === 'In Transit' ? 'amber' : 'blue');


    return `<tr><td class="mono dim">${p.num}</td><td>${p.supplier}</td><td class="mono dim">${p.date}</td><td>${p.items}</td><td class="mono" style="color:var(--blue)">\u20B9${Number(p.amount).toLocaleString('en-IN')}</td><td><span class="badge ${statusColor}">${p.status}</span></td><td class="mono dim">${p.received||'Pending'}</td><td><button ${btnParams}</button></td></tr>`;


  }).join('');


}





function viewPO(id) {
  const po = purchases.find(p => p.id === id);
  if (!po) return;
  const statusColor = po.status === 'Received' ? 'green' : (po.status === 'In Transit' ? 'amber' : 'blue');
  const h = `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;">
      <div>
        <div class="mono" style="font-size:22px;font-weight:800;color:var(--blue);">${po.num}</div>
        <div style="font-size:12px;color:var(--ash);margin-top:4px;">Date: ${po.date}</div>
      </div>
      <span class="badge ${statusColor}" style="font-size:12px;">${po.status}</span>
    </div>
    <div style="background:var(--paper);padding:16px;border-radius:8px;border:1px solid var(--mist);margin-bottom:16px;">
      <div style="font-size:11px;color:var(--ash);text-transform:uppercase;margin-bottom:4px;">Supplier Details</div>
      <div style="font-size:16px;font-weight:700;">${po.supplier}</div>
    </div>
    <div style="margin-bottom:16px;">
      <div style="font-size:11px;color:var(--ash);text-transform:uppercase;margin-bottom:8px;">Purchased Items</div>
      <div style="font-size:14px;line-height:1.5;">${po.items}</div>
    </div>
    <div style="border-top:1px solid var(--mist);padding-top:16px;display:flex;justify-content:space-between;align-items:center;">
      <div style="font-size:11px;color:var(--ash);text-transform:uppercase;">Total PO Value</div>
      <div class="mono" style="font-size:20px;font-weight:800;color:var(--blue);">₹${Number(po.amount).toLocaleString('en-IN')}</div>
    </div>
  `;
  document.getElementById('vpo-details').innerHTML = h;
  openModal('viewPOModal');
}





async function receivePO(id) {


  if(!confirm("Mark this Purchase Order as received and automatically update inventory stock?")) return;


  try {


    const res = await fetch(API_BASE + '/purchases/' + id + '/receive', {


      method: 'PUT'


    });


    const result = await res.json();


    if(result.error) throw new Error(result.error);


    


    const po = purchases.find(x => x.id === id);


    if(po) {


      po.status = 'Received';


      po.received = new Date().toISOString().split('T')[0];


    }


    


    // Refresh products catalog from DB after receiving stock


    const pRes = await fetch(API_BASE + '/products');


    products = await pRes.json();


    


    renderPOTable(purchases);


    renderProdTable(products);


    renderStockTable(products);


    renderDashStats();


    renderDashLowStock();


    buildPOS();


    


    toast('\u2705 Stock successfully received and catalog updated!', 'success');


  } catch(e) {


    toast('Error receiving PO: ' + e.message, 'error');


  }


}





async function addPurchaseOrder() {


  const n = {


    num: '#PO-' + String(purchases.length+1).padStart(3,'0'),


    supplier: document.getElementById('npo-supplier').value,


    date: document.getElementById('npo-date').value || new Date().toISOString().split('T')[0],


    status: document.getElementById('npo-status').value,


    amount: parseFloat(document.getElementById('npo-amount').value) || 0,


    items: document.getElementById('npo-items').value,


    received: ''


  };


  try {


    const res = await fetch(API_BASE + '/purchases', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(n) });


    const saved = await res.json();


    purchases.unshift(saved);


    renderPOTable(purchases);


    closeModal('addPOModal');


    toast('\u2705 PO saved', 'success');


  } catch(e) { toast('Error saving PO', 'error'); }


}





function renderQuoteTable(list) {


  const el = document.getElementById('quoteTableBody');


  if (!el) return;


  if (!list || list.length === 0) {


    el.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;">No active quotations</td></tr>';


    return;


  }


  el.innerHTML = list.map(q => {


    return `<tr><td class="mono dim">${q.num}</td><td>${q.customer}</td><td class="mono dim">${q.date}</td><td class="mono dim">${q.valid}</td><td class="mono" style="color:var(--blue)">\u20B9${Number(q.amount).toLocaleString('en-IN')}</td><td><span class="badge ${q.status==='Accepted'?'green':'amber'}">${q.status}</span></td><td><button class="btn btn-sm btn-ghost">Convert</button></td></tr>`;


  }).join('');


}





async function addQuotation() {


  const n = {


    num: '#Q-' + String(quotations.length+1).padStart(4,'0'),


    customer: document.getElementById('nq-customer').value,


    date: document.getElementById('nq-date').value || new Date().toISOString().split('T')[0],


    valid: document.getElementById('nq-valid').value,


    amount: parseFloat(document.getElementById('nq-amount').value) || 0,


    items: document.getElementById('nq-items').value,


    status: 'Awaiting'


  };


  try {


    const res = await fetch(API_BASE + '/quotations', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(n) });


    const saved = await res.json();


    quotations.unshift(saved);


    renderQuoteTable(quotations);


    closeModal('addQuoteModal');


    toast('\u2705 Quotation saved', 'success');


  } catch(e) { toast('Error saving Quotation', 'error'); }


}














// ======================================


// GST RETURNS MODULE


// ======================================





let gstFilings = [


  { period:'2026-02', type:'GSTR-1',  taxable:294200, taxpay:36800, itc:11200, netpay:25600, filedOn:'2026-03-11', status:'Filed'   },


  { period:'2026-02', type:'GSTR-3B', taxable:294200, taxpay:36800, itc:11200, netpay:25600, filedOn:'2026-03-18', status:'Filed'   },


  { period:'2026-01', type:'GSTR-1',  taxable:268400, taxpay:32400, itc:9800,  netpay:22600, filedOn:'2026-02-11', status:'Filed'   },


  { period:'2026-01', type:'GSTR-3B', taxable:268400, taxpay:32400, itc:9800,  netpay:22600, filedOn:'2026-02-20', status:'Filed'   },


];





function initGSTPeriodSelect() {


  const sel = document.getElementById('gstPeriodSelect');


  if (!sel || sel.options.length > 1) return;


  const now = new Date();


  for (let i = 0; i < 12; i++) {


    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);


    const val = d.toISOString().slice(0,7);


    const label = d.toLocaleDateString('en-IN', { month:'long', year:'numeric' });


    const opt = document.createElement('option');


    opt.value = val; opt.textContent = label;


    sel.appendChild(opt);


  }


}





function getMonthStr(offsetMonths) {


  offsetMonths = offsetMonths || 0;


  const d = new Date();


  d.setDate(1);


  d.setMonth(d.getMonth() + offsetMonths);


  return d.toISOString().slice(0,7);


}





function fmtPeriod(ym) {


  const parts = ym.split('-');


  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];


  return months[parseInt(parts[1])-1] + ' ' + parts[0];


}





function calcGSTForPeriod(ym) {


  const parts = ym.split('-');


  const yr = parseInt(parts[0]), mo = parseInt(parts[1]);


  const monthNames = {Jan:1,Feb:2,Mar:3,Apr:4,May:5,Jun:6,Jul:7,Aug:8,Sep:9,Oct:10,Nov:11,Dec:12};


  const paidInv = invoices.filter(function(inv) {


    if (inv.status !== 'Paid') return false;


    const dp = inv.date.split(' ');


    if (dp.length !== 3) return false;


    return parseInt(dp[2]) === yr && monthNames[dp[1]] === mo;


  });


  const rateMap = {};


  let totalTaxable = 0, totalGST = 0;


  paidInv.forEach(function(inv) {


    (inv.items || []).forEach(function(item) {


      const base = item.price * item.qty;


      const gstAmt = base * item.gst / 100;


      const rate = item.gst + '%';


      if (!rateMap[rate]) rateMap[rate] = { rate: item.gst, taxable:0, cgst:0, sgst:0, total:0, count:0 };


      rateMap[rate].taxable += base;


      rateMap[rate].cgst   += gstAmt / 2;


      rateMap[rate].sgst   += gstAmt / 2;


      rateMap[rate].total  += gstAmt;


      rateMap[rate].count++;


      totalTaxable += base;


      totalGST     += gstAmt;


    });


  });


  const itcEst = Math.round(totalGST * 0.3);


  return { rateMap:rateMap, totalTaxable:totalTaxable, totalGST:totalGST, itcEst:itcEst, invoiceCount:paidInv.length, invoices:paidInv };


}





function renderGSTPage() {


  initGSTPeriodSelect();


  const sel = document.getElementById('gstPeriodSelect');


  const ym  = (sel && sel.value) ? sel.value : getMonthStr(-1);


  const currYm = getMonthStr(0);


  const periodLabel = fmtPeriod(ym);


  const el = document.getElementById('gstPeriodLabel');


  if (el) el.textContent = periodLabel;





  const data = calcGSTForPeriod(ym);





  // Alert banner


  const banner = document.getElementById('gstAlertBanner');


  const nextMonth = new Date();


  nextMonth.setDate(1);


  nextMonth.setMonth(nextMonth.getMonth() + 1);


  const dueDate = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 11);


  const today   = new Date();


  const daysLeft = Math.round((dueDate - today) / 86400000);


  const hasFiled = gstFilings.some(function(f){ return f.period === currYm && f.type === 'GSTR-1' && f.status === 'Filed'; });





  if (banner) {


    if (hasFiled) {


      banner.innerHTML = '<div style="background:#f0fdf4;border-left:4px solid #057a55;padding:14px 18px;border-radius:8px;display:flex;gap:12px;align-items:flex-start;margin-bottom:20px;">&#127963;<div><div style="font-weight:700;color:#057a55;">GSTR-1 filed for ' + fmtPeriod(currYm) + '</div><div style="font-size:13px;color:#6b7280;margin-top:2px;">All returns submitted. Next filing due 11th of next month.</div></div></div>';


    } else if (daysLeft < 0) {


      banner.innerHTML = '<div class="alert warning" style="margin-bottom:20px;">&#9888;<div><div class="alert-title">GSTR-1 OVERDUE for ' + fmtPeriod(currYm) + '</div><div class="alert-body">Due date has passed. File immediately to avoid penalties.</div></div></div>';


    } else {


      banner.innerHTML = '<div class="alert warning" style="margin-bottom:20px;">&#127963;<div><div class="alert-title">GSTR-1 due in ' + daysLeft + ' days</div><div class="alert-body">For the period ' + fmtPeriod(currYm) + '. Due: ' + dueDate.toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) + '. Est. liability: ' + fmtMoney(data.totalGST) + '</div></div></div>';


    }


  }





  // KPI cards


  const gstr1Filed  = gstFilings.some(function(f){ return f.period === ym && f.type === 'GSTR-1'  && f.status === 'Filed'; });


  const gstr3bFiled = gstFilings.some(function(f){ return f.period === ym && f.type === 'GSTR-3B' && f.status === 'Filed'; });


  const gstr1Rec    = gstFilings.find(function(f){ return f.period === ym && f.type === 'GSTR-1';  });


  const gstr3bRec   = gstFilings.find(function(f){ return f.period === ym && f.type === 'GSTR-3B'; });





  var s1 = document.getElementById('gstr1Status');


  var d1 = document.getElementById('gstr1Due');


  var b1 = document.getElementById('gstr1FileBtn');


  if (s1) { s1.textContent = gstr1Filed ? 'Filed' : 'Pending'; s1.style.color = gstr1Filed ? 'var(--green)' : 'var(--amber)'; }


  if (d1) { d1.className = 'kpi-trend ' + (gstr1Filed ? 'up' : 'dn'); d1.textContent = gstr1Filed ? ('Filed: ' + (gstr1Rec ? gstr1Rec.filedOn : '')) : ('Due: 11 ' + fmtPeriod(getMonthStr(1))); }


  if (b1) { b1.style.display = gstr1Filed ? 'none' : 'inline-block'; }





  var s3 = document.getElementById('gstr3bStatus');


  var d3 = document.getElementById('gstr3bDue');


  var b3 = document.getElementById('gstr3bFileBtn');


  if (s3) { s3.textContent = gstr3bFiled ? 'Filed' : 'Pending'; s3.style.color = gstr3bFiled ? 'var(--green)' : 'var(--amber)'; }


  if (d3) { d3.className = 'kpi-trend ' + (gstr3bFiled ? 'up' : 'dn'); d3.textContent = gstr3bFiled ? ('Filed: ' + (gstr3bRec ? gstr3bRec.filedOn : '')) : 'Due: 20th of next month'; }


  if (b3) { b3.style.display = gstr3bFiled ? 'none' : 'inline-block'; }





  var itcEl = document.getElementById('gstITC');


  if (itcEl) itcEl.textContent = fmtMoney(data.itcEst);





  // GST breakup table


  var breakupBody = document.getElementById('gstBreakupBody');


  var breakupFoot = document.getElementById('gstBreakupFoot');


  if (breakupBody) {


    var rates = Object.values(data.rateMap).sort(function(a,b){ return a.rate - b.rate; });


    if (rates.length === 0) {


      breakupBody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--ash);">No paid invoices for ' + periodLabel + '</td></tr>';


    } else {


      breakupBody.innerHTML = rates.map(function(r) {


        return '<tr>' +


          '<td><span class="gst-chip">' + r.rate + '%</span></td>' +


          '<td class="mono">' + fmtMoney(r.taxable) + '</td>' +


          '<td class="mono">' + fmtMoney(r.cgst) + '</td>' +


          '<td class="mono">' + fmtMoney(r.sgst) + '</td>' +


          '<td class="mono" style="font-weight:700;color:var(--blue)">' + fmtMoney(r.total) + '</td>' +


          '<td style="text-align:center;">' + r.count + '</td>' +


          '</tr>';


      }).join('');


    }


    if (breakupFoot) {


      breakupFoot.innerHTML = '<tr style="background:#eff6ff;font-weight:700;">' +


        '<td>TOTAL</td>' +


        '<td class="mono">' + fmtMoney(data.totalTaxable) + '</td>' +


        '<td class="mono">' + fmtMoney(data.totalGST/2) + '</td>' +


        '<td class="mono">' + fmtMoney(data.totalGST/2) + '</td>' +


        '<td class="mono" style="color:var(--blue)">' + fmtMoney(data.totalGST) + '</td>' +


        '<td style="text-align:center;">' + data.invoiceCount + '</td>' +


        '</tr>';


    }


  }





  // B2B invoice ledger


  var invBody  = document.getElementById('gstInvBody');


  var invCount = document.getElementById('gstInvCount');


  if (invBody) {


    if (data.invoices.length === 0) {


      invBody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:20px;color:var(--ash);">No paid invoices for ' + periodLabel + '</td></tr>';


    } else {


      invBody.innerHTML = data.invoices.map(function(inv) {


        var tax     = (inv.items || []).reduce(function(s,i){ return s + (i.price*i.qty*i.gst/100); }, 0);


        var taxable = (inv.items || []).reduce(function(s,i){ return s + i.price*i.qty; }, 0);


        var total   = taxable + tax;


        var isB2B   = customers.find(function(c){ return c.name === inv.customer && c.gstin; }) ? 'B2B' : 'B2C';


        return '<tr>' +


          '<td class="mono" style="color:var(--blue);font-weight:700;">' + inv.num + '</td>' +


          '<td>' + inv.customer + '</td>' +


          '<td class="mono dim">' + inv.date + '</td>' +


          '<td class="mono">' + fmtMoney(taxable) + '</td>' +


          '<td class="mono dim">' + fmtMoney(tax/2) + '</td>' +


          '<td class="mono dim">' + fmtMoney(tax/2) + '</td>' +


          '<td class="mono" style="color:var(--blue)">' + fmtMoney(tax) + '</td>' +


          '<td class="mono" style="font-weight:700;">' + fmtMoney(total) + '</td>' +


          '<td><span class="badge ' + (isB2B === 'B2B' ? 'blue' : 'ash') + '">' + isB2B + '</span></td>' +


          '</tr>';


      }).join('');


    }


    if (invCount) invCount.textContent = data.invoices.length + ' invoices';


  }





  renderGSTHistory();


}





function renderGSTHistory() {


  var tbody = document.getElementById('gstHistoryBody');


  if (!tbody) return;


  if (gstFilings.length === 0) {


    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:20px;color:var(--ash);">No filing records yet.</td></tr>';


    return;


  }


  tbody.innerHTML = gstFilings.map(function(f) {


    var actionBtn = f.status === 'Filed'


      ? '<span class="dim" style="font-size:12px;">Submitted</span>'


      : '<button class="btn btn-sm" style="background:var(--green);color:#fff;border:none;" onclick="markFiled(\'' + f.period + '\',\'' + f.type + '\')">Mark Filed</button>';


    return '<tr>' +


      '<td>' + fmtPeriod(f.period) + '</td>' +


      '<td class="mono">' + f.type + '</td>' +


      '<td class="mono">' + fmtMoney(f.taxable) + '</td>' +


      '<td class="mono">' + fmtMoney(f.taxpay) + '</td>' +


      '<td class="mono" style="color:var(--green)">' + fmtMoney(f.itc) + '</td>' +


      '<td class="mono" style="font-weight:700;color:var(--blue)">' + fmtMoney(f.netpay) + '</td>' +


      '<td class="mono dim">' + f.filedOn + '</td>' +


      '<td><span class="badge ' + (f.status === 'Filed' ? 'green' : 'amber') + '">' + f.status + '</span></td>' +


      '<td>' + actionBtn + '</td>' +


      '</tr>';


  }).join('');


}





function fileReturn(type) {


  var sel = document.getElementById('gstPeriodSelect');


  var ym  = (sel && sel.value) ? sel.value : getMonthStr(-1);


  var existing = gstFilings.find(function(f){ return f.period === ym && f.type === type; });


  var data = calcGSTForPeriod(ym);


  var today = new Date().toISOString().split('T')[0];


  if (existing) {


    existing.status  = 'Filed';


    existing.filedOn = today;


  } else {


    gstFilings.unshift({


      period:ym, type:type,


      taxable:Math.round(data.totalTaxable),


      taxpay:Math.round(data.totalGST),


      itc:data.itcEst,


      netpay:Math.max(0, Math.round(data.totalGST - data.itcEst)),


      filedOn:today,


      status:'Filed'


    });


  }


  renderGSTPage();


  toast('\u2705 ' + type + ' filed for ' + fmtPeriod(ym), 'success');


}





function markFiled(period, type) {


  var f = gstFilings.find(function(x){ return x.period === period && x.type === type; });


  if (f) { f.status = 'Filed'; f.filedOn = new Date().toISOString().split('T')[0]; }


  renderGSTPage();


  toast('\u2705 ' + type + ' marked as filed', 'success');


}





function saveGSTFiling() {


  var period = document.getElementById('gf-period').value;


  if (!period) { toast('Please select a period', 'warning'); return; }


  var rec = {


    period:  period,


    type:    document.getElementById('gf-type').value,


    taxable: parseFloat(document.getElementById('gf-taxable').value) || 0,


    taxpay:  parseFloat(document.getElementById('gf-taxpay').value)  || 0,


    itc:     parseFloat(document.getElementById('gf-itc').value)     || 0,


    filedOn: document.getElementById('gf-filedon').value || new Date().toISOString().split('T')[0],


    status:  document.getElementById('gf-status').value


  };


  rec.netpay = Math.max(0, rec.taxpay - rec.itc);


  gstFilings.unshift(rec);


  renderGSTHistory();


  closeModal('addGSTFilingModal');


  toast('\u2705 Filing record saved', 'success');


}





function exportGSTReport() {


  var sel = document.getElementById('gstPeriodSelect');


  var ym  = (sel && sel.value) ? sel.value : getMonthStr(-1);


  var data = calcGSTForPeriod(ym);


  var csv = 'Invoice No,Customer,Date,Taxable Amount,CGST,SGST,Total GST,Invoice Total,Type\n';


  data.invoices.forEach(function(inv) {


    var tax     = (inv.items||[]).reduce(function(s,i){ return s + (i.price*i.qty*i.gst/100); }, 0);


    var taxable = (inv.items||[]).reduce(function(s,i){ return s + i.price*i.qty; }, 0);


    var total   = taxable + tax;


    var isB2B   = customers.find(function(c){ return c.name === inv.customer && c.gstin; }) ? 'B2B' : 'B2C';


    csv += inv.num + ',' + inv.customer + ',' + inv.date + ',' + taxable.toFixed(2) + ',' + (tax/2).toFixed(2) + ',' + (tax/2).toFixed(2) + ',' + tax.toFixed(2) + ',' + total.toFixed(2) + ',' + isB2B + '\n';


  });


  var link = document.createElement('a');


  link.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv);


  link.download = 'GSTR1_' + ym + '.csv';


  document.body.appendChild(link); link.click(); document.body.removeChild(link);


  toast('\u2705 GSTR-1 CSV exported for ' + fmtPeriod(ym), 'success');


}




// ══════════════════════════════════════
// PRINT INVOICE
// ══════════════════════════════════════
function printInvoice(id) {
  const inv = invoices.find(function(i){ return i.id === id; });
  if (!inv) { toast('Invoice not found', 'error'); return; }
  const calc = calcInvoice(inv);
  const html = buildInvoiceHTML(inv, calc.subtotal, calc.gstTotal, calc.total);

  // Hidden print routing for adblocker-friendly seamless printing
  let pFrame = document.getElementById('invPrintFrame');
  if (!pFrame) {
    pFrame = document.createElement('iframe');
    pFrame.id = 'invPrintFrame';
    pFrame.style.display = 'none';
    pFrame.name = 'invPrintFrame';
    document.body.appendChild(pFrame);
  }

  const fdoc = pFrame.contentWindow.document;
  fdoc.open();
  fdoc.write('<!DOCTYPE html><html><head><meta charset="UTF-8">');
  fdoc.write('<title>Invoice ' + inv.num + '</title>');
  // Include main app styling
  fdoc.write('<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">');
  fdoc.write('<link rel="stylesheet" href="css/style.css">');
  fdoc.write('<style>');
  fdoc.write('body { background: white; margin: 0; padding: 0; font-family: "Outfit", sans-serif; color: #000; }');
  fdoc.write('* { box-sizing: border-box; }');
  fdoc.write('@page { size: A4; margin: 15mm 10mm; }');
  fdoc.write('html { margin: 0; padding: 0; }');
  fdoc.write('#invModal { position: static !important; width: 100% !important; padding: 0 !important; margin: 0 !important; }');
  fdoc.write('.inv-preview { max-width: 100% !important; border: none !important; margin: 0 !important; padding: 0 !important; box-shadow: none !important; background: white !important; color: #000 !important; }');
  fdoc.write('.inv-top { page-break-inside: avoid; }');
  fdoc.write('.inv-parties { page-break-inside: avoid; }');
  fdoc.write('.inv-tbl { page-break-inside: avoid; width: 100%; }');
  fdoc.write('.inv-summary { page-break-inside: avoid; }');
  fdoc.write('.inv-foot { page-break-inside: avoid; }');
  fdoc.write('table, tr, td { page-break-inside: avoid; }');
  fdoc.write('.modal-close, .inv-actions { display: none !important; }');
  fdoc.write('</style></head><body>');
  
  // Wrapped in #invModal so @media print visibility rules in style.css trigger correctly
  fdoc.write('<div id="invModal">');
  fdoc.write('<div class="inv-preview">');
  fdoc.write(html);
  fdoc.write('</div></div>');
  fdoc.write('</body></html>');
  fdoc.close();

  // Wait briefly for CSS and fonts to load before triggering print dialog
  setTimeout(function() {
    pFrame.contentWindow.focus();
    pFrame.contentWindow.print();
  }, 500);
}


// Alias: print whichever invoice is currently open in the modal
function printCurrentInvoice() {
  var numEl = document.getElementById('invModalNum');
  if (!numEl) return;
  var num = numEl.textContent.trim();
  var inv = invoices.find(function(i){ return i.num === num; });
  if (inv) printInvoice(inv.id);
  else toast('No invoice open', 'warning');
}

// EXPORT STOCK
function exportStockCSV() {
  let csv = 'SKU,Product,Category,Price,Stock,Min,Status\n';
  products.forEach(p => {
    let stat = p.stock <= 0 ? 'Out of Stock' : (p.stock <= p.min ? 'Low Stock' : 'OK');
    csv += `${p.sku},${p.name},${p.cat},${p.price},${p.stock},${p.min},${stat}\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('hidden', '');
  a.setAttribute('href', url);
  a.setAttribute('download', 'inventory_export.csv');
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  toast('\u2705 Inventory exported to CSV', 'success');
}


// ════════════════════════════════════════════════════════════════
// QUICK SUGGESTION #3: Role-based UI restrictions
// Hides write-action buttons from Cashier and Viewer roles
// ════════════════════════════════════════════════════════════════
function applyRoleRestrictions(role) {
  // Roles: 'Super Admin' = full access | 'Cashier' = POS + sales only | 'Viewer' = read-only
  const isAdmin    = role === 'Super Admin';
  const isCashier  = role === 'Cashier';
  const isViewer   = role === 'Viewer';

  // Helper: show/hide elements matching a CSS selector
  const setVisible = (selector, show) => {
    document.querySelectorAll(selector).forEach(el => {
      el.style.display = show ? '' : 'none';
    });
  };

  // ── Sidebar nav items restricted by role ──────────────────────
  // Cashier & Viewer: hide Products, Stock, Purchases, Expenses management nav
  setVisible('.sb-item[data-page="products"]',  isAdmin || isCashier);
  setVisible('.sb-item[data-page="stock"]',     isAdmin || isCashier);
  setVisible('.sb-item[data-page="purchases"]', isAdmin);
  setVisible('.sb-item[data-page="expenses"]',  isAdmin);
  setVisible('.sb-item[data-page="quotations"]',isAdmin || isCashier);
  setVisible('.sb-item[data-page="reports"]',   isAdmin);
  setVisible('.sb-item[data-page="gst"]',       isAdmin);
  setVisible('.sb-item[data-page="settings"]',  isAdmin);

  // ── Viewer: hide ALL write-action buttons throughout the app ──
  if (isViewer) {
    // Topbar CTA button
    const ctaBtn = document.getElementById('tbCtaBtn');
    if (ctaBtn) ctaBtn.style.display = 'none';

    // POS page: disable checkout
    const checkoutBtn = document.querySelector('.checkout-btn');
    if (checkoutBtn) { checkoutBtn.disabled = true; checkoutBtn.style.opacity = '0.4'; checkoutBtn.title = 'Read-only access'; }

    // + Add / + New buttons in page headers
    setVisible('[onclick="openAddCustomerModal()"]', false);
    setVisible('[onclick="openAddProductModal()"]',  false);
    setVisible('[onclick="openModal(\'addPOModal\')"]', false);
    setVisible('[onclick="openModal(\'addExpModal\')"]', false);
    setVisible('[onclick="openModal(\'addQuoteModal\')"]', false);

    // Show a subtle viewer badge in the topbar
    const tbDate = document.getElementById('tbDate');
    if (tbDate && !document.getElementById('viewerBadge')) {
      const badge = document.createElement('span');
      badge.id = 'viewerBadge';
      badge.textContent = '\uD83D\uDC41\uFE0F Read-Only';
      badge.style.cssText = 'font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;background:#fef3c7;color:#b45309;padding:3px 10px;border-radius:999px;margin-left:8px;';
      tbDate.after(badge);
    }
  }

  // ── Cashier: hide admin-only sections, allow POS ──────────────
  if (isCashier) {
    // Redirect to POS if they somehow land on a restricted page
    const restrictedPages = ['reports', 'gst', 'purchases', 'expenses', 'settings'];
    restrictedPages.forEach(p => {
      const el = document.querySelector(`.sb-item[data-page="${p}"]`);
      if (el) el.onclick = () => toast('\u26A0\uFE0F Access restricted. Contact Admin.', 'warning');
    });
  }
}


// ════════════════════════════════════════════════════════════════
// QUICK SUGGESTION #4: Keyboard shortcuts
// Ctrl+N  → open POS Billing
// Ctrl+P  → print current page / invoice  (overrides browser default)
// Ctrl+D  → go to Dashboard
// Escape  → close any open modal
// ════════════════════════════════════════════════════════════════
document.addEventListener('keydown', function(e) {
  // Only act when the app shell is visible (user is logged in)
  const appShell = document.getElementById('appShell');
  if (!appShell || appShell.style.display === 'none') return;

  // Don't intercept when user is typing in an input / textarea / select
  const tag = document.activeElement ? document.activeElement.tagName : '';
  const isInput = (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT');

  // Escape → close any open modals
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
    return;
  }

  if (isInput) return; // Below shortcuts don't fire while typing

  // Ctrl + N → POS Billing
  if (e.ctrlKey && e.key === 'n') {
    e.preventDefault();
    nav('pos', null);
    toast('\uD83D\uDED2 POS Billing opened  [Ctrl+N]', 'info');
    return;
  }

  // Ctrl + D → Dashboard
  if (e.ctrlKey && e.key === 'd') {
    e.preventDefault();
    nav('dashboard', null);
    toast('\uD83D\uDCCA Dashboard  [Ctrl+D]', 'info');
    return;
  }

  // Ctrl + I → Invoices
  if (e.ctrlKey && e.key === 'i') {
    e.preventDefault();
    nav('invoices', null);
    toast('\uD83E\uDDFE Invoices  [Ctrl+I]', 'info');
    return;
  }

  // Ctrl + Shift + P → Print invoice (custom, avoids conflict with browser print)
  if (e.ctrlKey && e.shiftKey && e.key === 'P') {
    e.preventDefault();
    if (typeof printCurrentInvoice === 'function') {
      printCurrentInvoice();
    } else {
      window.print();
    }
    return;
  }
});

// Show keyboard shortcut hint toast on first login
function showShortcutHint() {
  setTimeout(() => {
    toast('⌨️ Shortcuts: Ctrl+N = POS  ·  Ctrl+D = Dashboard  ·  Ctrl+I = Invoices  ·  Esc = Close modal', 'info');
  }, 1200);
}

// ══════════ GST RETURN PAYMENT FUNCTIONS ══════════
let gstPayments = [
  { period:'2026-02', type:'GSTR-3B', amountdue:25600, amountpaid:25600, paidto:'GST Authority (DGST)', method:'NEFT/RTGS', date:'2026-03-20', ref:'NEFT2026062401', status:'Completed', notes:'Payment via bank transfer' },
  { period:'2026-01', type:'GSTR-3B', amountdue:22600, amountpaid:22600, paidto:'GST Authority (DGST)', method:'Bank Transfer', date:'2026-02-21', ref:'TXN20260221001', status:'Completed', notes:'' },
];

function saveGSTPayment() {
  var period = document.getElementById('gp-period').value;
  var type = document.getElementById('gp-type').value;
  if (!period || !type) { toast('Please select period and return type', 'warning'); return; }
  if (type === '') { toast('Select a return type (GSTR-1, GSTR-3B, etc.)', 'warning'); return; }
  var amountPaid = parseFloat(document.getElementById('gp-amountpaid').value) || 0;
  if (amountPaid <= 0) { toast('Enter a valid payment amount', 'warning'); return; }
  var amountDue = parseFloat(document.getElementById('gp-amountdue').value) || 0;
  var remaining = Math.max(0, amountDue - amountPaid);
  var status = (remaining <= 0) ? 'Completed' : 'Partial';
  var rec = {
    period: period, type: type, amountdue: amountDue, amountpaid: amountPaid,
    paidto: document.getElementById('gp-paidto').value,
    method: document.getElementById('gp-method').value,
    date: document.getElementById('gp-date').value || new Date().toISOString().split('T')[0],
    ref: document.getElementById('gp-ref').value || 'Manual Entry',
    status: status, notes: document.getElementById('gp-notes').value
  };
  gstPayments.unshift(rec);
  renderGSTPayments();
  closeModal('addGSTPaymentModal');
  clearGSTPaymentForm();
  toast('✅ Payment recorded successfully', 'success');
}

function renderGSTPayments() {
  var tbody = document.getElementById('gstPaymentBody');
  if (!tbody) return;
  if (gstPayments.length === 0) {
    tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;padding:20px;color:var(--ash);">No payment records yet. Click "+ Record Payment" to add one.</td></tr>';
    return;
  }
  var totalDue = 0, totalPaid = 0, pending = 0, completed = 0;
  gstPayments.forEach(function(p) {
    totalDue += p.amountdue || 0;
    totalPaid += p.amountpaid || 0;
    if (p.status === 'Completed') completed++;
    else pending++;
  });
  var statsHtml = '<div style="background:#f0fdf4;padding:10px 12px;border-radius:6px;font-size:12px;color:#057a55;font-weight:600;">✓ ' + completed + ' Completed</div>' + (pending > 0 ? '<div style="background:#fef3c7;padding:10px 12px;border-radius:6px;font-size:12px;color:#b45309;font-weight:600;">⏳ ' + pending + ' Pending</div>' : '') + '<div style="background:#f3f4f6;padding:10px 12px;border-radius:6px;font-size:12px;color:#6b7280;font-weight:600;">₹' + fmtMoney(totalDue) + ' Total Due</div>';
  var statsEl = document.getElementById('gstPaymentStats');
  if (statsEl) statsEl.innerHTML = statsHtml;
  tbody.innerHTML = gstPayments.map(function(p) {
    var remaining = Math.max(0, p.amountdue - p.amountpaid);
    var statusBadge = p.status === 'Completed' ? '<span class="badge green">Completed</span>' : '<span class="badge amber">Pending ₹' + fmtMoney(remaining) + '</span>';
    return '<tr><td class="mono">' + fmtPeriod(p.period) + '</td><td class="mono">' + p.type + '</td><td class="mono" style="color:var(--red)">' + fmtMoney(p.amountdue) + '</td><td class="mono" style="color:var(--green);font-weight:600;">' + fmtMoney(p.amountpaid) + '</td><td>' + p.paidto + '</td><td class="mono dim">' + p.date + '</td><td style="font-size:12px;">' + p.method + '</td><td class="mono dim" style="font-size:11px;">' + p.ref + '</td><td>' + statusBadge + '</td><td><button class="btn btn-sm btn-ghost" onclick="deleteGSTPayment(\'' + p.period + '\',\'' + p.type + '\',\'' + p.date + '\')">Delete</button></td></tr>';
  }).join('');
}

function deleteGSTPayment(period, type, date) {
  if (!confirm('Delete this payment record?')) return;
  gstPayments = gstPayments.filter(function(p) { return !(p.period === period && p.type === type && p.date === date); });
  renderGSTPayments();
  toast('Payment record deleted', 'success');
}

function updateGSTPaymentAmount() {
  var period = document.getElementById('gp-period').value;
  var type = document.getElementById('gp-type').value;
  if (!period || !type || type === '') { document.getElementById('gp-amountdue').value = ''; return; }
  var filing = gstFilings.find(function(f) { return f.period === period && f.type === type; });
  if (filing) { document.getElementById('gp-amountdue').value = filing.netpay || 0; } else { document.getElementById('gp-amountdue').value = ''; }
}

function updateGSTPaymentDue() {
  var due = parseFloat(document.getElementById('gp-amountdue').value) || 0;
  var paid = parseFloat(document.getElementById('gp-amountpaid').value) || 0;
}

function clearGSTPaymentForm() {
  document.getElementById('gp-period').value = '';
  document.getElementById('gp-type').value = '';
  document.getElementById('gp-amountdue').value = '';
  document.getElementById('gp-amountpaid').value = '';
  document.getElementById('gp-paidto').value = 'GST Authority (DGST)';
  document.getElementById('gp-method').value = 'Bank Transfer';
  document.getElementById('gp-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('gp-ref').value = '';
  document.getElementById('gp-notes').value = '';
}
