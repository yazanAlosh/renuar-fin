// ===== إعدادات أساسية =====
const KEY = "REN_CATALOG";
const HOST_PASS = "1234"; // غيّرها كما تريد

// عناصر DOM سريعة
const $ = id => document.getElementById(id);
const input = $("q"), msg = $("msg"), priceBox = $("priceBox"),
      frame = $("renFrame"), debug = $("debug"), list = $("localList");

let DB = [];
function loadDB(){ try{ DB = JSON.parse(localStorage.getItem(KEY)||"[]"); }catch(e){ DB=[]; } }
function saveDB(){ localStorage.setItem(KEY, JSON.stringify(DB)); renderTable(); $("cnt").textContent = DB.length; }
function renderTable(){
  const tb = $("tbl"); tb.innerHTML = "";
  DB.forEach((p,i)=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${p.sku||""}</td><td>${p.name||""}</td><td>${p.price||""}</td>
      <td>${p.link?<a href="${p.link}" target="_blank" rel="noopener">فتح</a>:""}</td>
      <td><button class="ghost" onclick="delItem(${i})">🗑</button></td>`;
    tb.appendChild(tr);
  });
}
function setMsg(cls,text){ msg.className = cls; msg.textContent = text; }
function safeQuery(){
  let s = (input.value||"").trim();
  s = s.replace(/[\u0591-\u05C7]/g,""); // حذف التشكيل العبري
  s = s.replace(/\s+/g," ").trim();
  return s;
}
function renUrl(q){ return "https://www.renuar.co.il/catalogsearch/result/?q="+encodeURIComponent(q); }
function showDebug(url){ debug.textContent = url?("🔗 "+url):""; }

// ===== بحث محلي =====
function searchLocal(q){
  if(!q) return [];
  if(/^\d+$/.test(q)){ // كله أرقام → SKU
    return DB.filter(p => (p.sku||"").toString().trim() === q);
  }
  const low = q.toLowerCase();
  return DB.filter(p => (p.name||"").toLowerCase().includes(low));
}
function renderLocal(items){
  if(!items.length){ list.textContent = "لا توجد نتائج محلية."; return; }
  list.innerHTML = items.map(p => `
    <div>
      <strong>${p.name||""}</strong><br/>
      SKU: ${p.sku||"-"} — <b>${p.price||"-"}</b>
      ${p.link?` — <a href="${p.link}" target="_blank" rel="noopener">صفحة רנואר</a>`:""}
    </div>
  `).join("");
}

// أزرار واجهة
function checkPrice(){
  const q = safeQuery();
  if(!q){ setMsg("err","נא להזין מק״ט או שם פריט"); priceBox.textContent=""; list.textContent=""; return; }
  const url = renUrl(q); showDebug(url);
  const items = searchLocal(q);
  if(items.length){
    const f = items[0];
    priceBox.className = "ok";
    priceBox.textContent = 💰 ${f.price||"-"} — ${f.name||""} (SKU ${f.sku||"-"});
    renderLocal(items);
    setMsg("muted","נמצא במחירון המקומי.");
  }else{
    priceBox.className = "err";
    priceBox.textContent = "לא נמצא במחירון המקומי — أضفه من لوحة الـHost.";
    list.textContent = "لا توجد نتائج محلية.";
    setMsg("muted","يمكنك البحث في רנואר بالأزرار.");
  }
}
function searchInFrame(){
  const q = safeQuery(); if(!q){ setMsg("err","נא להזין מק״ט או שם פריט"); return; }
  frame.src = renUrl(q); frame.style.display="block";
  setMsg("muted","טוען תוצאות מרנואר… (لو لم يظهر داخل الإطار فهذا من سياسة الموقع)");
}
function openNew(){
  const q = safeQuery(); if(!q){ setMsg("err","נא להזין מק״ט או שם פריט"); return; }
  window.open(renUrl(q), "_blank", "noopener"); showDebug(renUrl(q));
}
function openHome(){ window.open("https://www.renuar.co.il/home","_blank","noopener"); }
function clearAll(){
  input.value=""; frame.removeAttribute("src"); frame.style.display="none";
  priceBox.textContent=""; list.textContent=""; showDebug("");
  setMsg("muted","تم المسح. اكتب قيمة جديدة.");
}
input.addEventListener("keydown",(e)=>{ if(e.key==="Enter"){ e.preventDefault(); checkPrice(); } });

// ===== Host =====
function login(){
  const pass = $("pass").value.trim();
  if(pass === HOST_PASS){
    $("loginBox").style.display="none";
    $("admin").style.display="block";
    renderTable(); $("cnt").textContent = DB.length;
  }else{
    alert("סיסמה שגויה");
  }
}
function addItem(){
  const sku=$("sku").value.trim(), name=$("name").value.trim(),
        price=$("price").value.trim(), link=$("link").value.trim();
  if(!sku||!name||!price){ alert("מלא מק״ט/שם/מחיר"); return; }
  DB.push({ sku, name, price: price.startsWith("₪")?price:("₪"+price), link });
  saveDB(); $("sku").value=$("name").value=$("price").value=$("link").value="";
}
function delItem(i){ DB.splice(i,1); saveDB(); }
function importFile(){
  const f = $("fileInput").files[0];
  if(!f){ alert("اختر ملف"); return; }
  const reader = new FileReader();
  reader.onload = e=>{
    const txt = e.target.result||"";
    if(f.name.toLowerCase().endsWith(".json")){
      try{ DB = DB.concat(JSON.parse(txt)); }catch{ return alert("JSON غير صالح"); }
    }else{
      // CSV بسيط: sku,name,price,link
      const lines = txt.trim().split(/\r?\n/); let start=0;
      if(lines[0] && lines[0].toLowerCase().includes("sku")) start=1;
      const arr=[]; for(let i=start;i<lines.length;i++){ const [sku,name,price,link] = lines[i].split(",").map(s=>(s||"").trim()); if(sku||name) arr.push({sku,name,price,link}); }
      DB = DB.concat(arr);
    }
    saveDB(); alert("تم الاستيراد. الإجمالي: "+DB.length);
  };
  reader.readAsText(f, "utf-8");
}
function exportDB(){
  const blob = new Blob([JSON.stringify(DB,null,2)], {type:"application/json"});
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
  a.download = "catalog.json"; a.click(); URL.revokeObjectURL(a.href);
}
function wipeDB(){ if(confirm("مسح كل البيانات؟")){ DB=[]; saveDB(); renderTable(); $("cnt").textContent="0"; } }

// init
loadDB();
