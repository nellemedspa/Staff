// ===== Settings you can change =====
const USERS={Admin:{pass:'Nl-Hr#7Kq2vX9pT',role:'admin'},Salon:{pass:'Nl-Rec#4Wm8zQ3sB',role:'limited'}}; // Salon = simple attendance page only
let ROLE=null;
const RULES={grace:0,workDays:26,dayHours:9}; // daily rate = monthly ÷ workDays; late/early deduction = daily ÷ dayHours per hour; grace = free minutes
const SB='https://guhsbsnerresgdyzbqnl.supabase.co',KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd1aHNic25lcnJlc2dkeXpicW5sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0MDY1NzIsImV4cCI6MjA5Nzk4MjU3Mn0.m6-FccesY77CLsFcAiZ7o8p6OZaWGoDHqhV6usB8x14';
const H={apikey:KEY,Authorization:'Bearer '+KEY,'Content-Type':'application/json'};
const S={staff:[],att:[],adj:[],inv:[],techs:[]};
const $=id=>document.getElementById(id);
const DN=['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const uid=()=>Math.random().toString(36).slice(2,9)+Date.now().toString(36).slice(-4);
const mins=t=>{const[h,m]=t.split(':');return +h*60+ +m};
const tds=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
function toast(m,bad){const t=$('toast');t.textContent=m;t.className='on'+(bad?' bad':'');clearTimeout(t._h);t._h=setTimeout(()=>t.className='',bad?7000:1800)}
// ----- Supabase (errors are always shown; a failed save never looks like a success) -----
async function get(t){let all=[],o=0;for(;;){const r=await fetch(`${SB}/rest/v1/${t}?select=*&order=created_at.asc,id.asc&limit=1000&offset=${o}`,{headers:H});if(!r.ok)throw new Error(t+' '+r.status);const rows=await r.json();all=all.concat(rows);if(rows.length<1000)break;o+=1000}return all.map(r=>({...r.data,id:r.id}))}
async function up(t,rec){try{const r=await fetch(`${SB}/rest/v1/${t}`,{method:'POST',headers:{...H,Prefer:'resolution=merge-duplicates'},body:JSON.stringify({id:rec.id,data:rec})});if(!r.ok)throw new Error(r.status+' '+(await r.text()).slice(0,70));return true}catch(e){console.error(e);toast('⚠️ لم يتم الحفظ: '+e.message,1);return false}}
async function del(t,id){try{const r=await fetch(`${SB}/rest/v1/${t}?id=eq.${id}`,{method:'DELETE',headers:H});if(!r.ok)throw new Error(r.status);return true}catch(e){toast('⚠️ لم يتم الحذف: '+e.message,1);return false}}
async function load(){try{const lim=ROLE==='limited';const[a,b,c,d,e]=await Promise.all([get('nelle_hr_staff'),get('nelle_hr_att'),lim?[]:get('nelle_hr_adj'),lim?[]:get('nelle_invoices'),lim?[]:get('nelle_techs')]);Object.assign(S,{staff:a,att:b,adj:c,inv:d,techs:e});render()}catch(e){toast('⚠️ تعذر التحميل: '+e.message+' — تأكدي من تشغيل setup.sql',1)}}
// ----- Login (simple screen-lock) -----
function start(role){ROLE=role;document.body.classList.toggle('limited',role==='limited');$('login').classList.remove('on');if(role==='limited'){document.querySelector('[data-t="att"]').click();$('a-date').disabled=true}load()}
function login(ev){ev.preventDefault();const user=$('lu').value.trim(),u=USERS[user];if(u&&$('lp').value===u.pass){localStorage.setItem('hr_auth',JSON.stringify({user,role:u.role}));start(u.role)}else{$('le').hidden=false;$('lp').value=''}return false}
function logout(){localStorage.removeItem('hr_auth');location.reload()}
// ----- Tabs -----
$('tabs').onclick=e=>{const t=e.target.dataset.t;if(!t)return;[...$('tabs').children].forEach(b=>b.classList.toggle('on',b===e.target));document.querySelectorAll('section').forEach(s=>s.classList.toggle('on',s.id==='t-'+t));render()};
const cm=id=>$(id).classList.remove('on');
function render(){if(ROLE==='limited')return rAtt();rStaff();rAtt();rPay();rRep()}
// ----- Staff -----
let editId=null;
const techName=s=>S.techs.find(t=>t.id===s.techId)?.name||s.name;
function rStaff(){$('s-body').innerHTML=S.staff.map(s=>`<tr><td><b>${esc(s.name)}</b>${s.type==='part'?' <span class="mut">· جزئي</span>':''}<div class="mut">${esc(s.mobile)}</div></td><td>${esc(s.spec)||'—'}</td><td>${s.hire||'—'}${s.end?'<div class="mut">حتى '+s.end+'</div>':''}</td><td class="mut">${(s.days||[]).map(d=>DN[d]).join('، ')||'—'}</td><td>${s.ss||'--'} – ${s.se||'--'}</td><td>${(+s.base||0).toFixed(0)} ج</td><td>${s.pct||0}%</td><td style="white-space:nowrap"><button class="b" onclick="openStaff('${s.id}')">✏️</button> <button class="b d" onclick="delStaff('${s.id}')">حذف</button></td></tr>`).join('')||'<tr><td colspan="8" class="mut" style="text-align:center;padding:22px">لا توجد فنيات بعد — اضغطي "+ إضافة فنية".</td></tr>'}
function openStaff(id){editId=id||null;const s=S.staff.find(x=>x.id===id)||{days:[]};$('ms-t').textContent=id?'تعديل فنية':'إضافة فنية';
 [['name','name'],['spec','spec'],['mob','mobile'],['hire','hire'],['end','end'],['base','base'],['ss','ss'],['se','se'],['pct','pct']].forEach(([i,k])=>$('s-'+i).value=s[k]??'');
 $('s-type').value=s.type||'full';$('s-tech').innerHTML='<option value="">— بدون (بنفس الاسم) —</option>'+S.techs.map(t=>`<option value="${t.id}"${t.id===s.techId?' selected':''}>${esc(t.name)}</option>`).join('');
 $('s-days').innerHTML=DN.map((n,i)=>`<label><input type="checkbox" class="sd" value="${i}"${(s.days||[]).includes(i)?' checked':''}>${n}</label>`).join('');$('m-staff').classList.add('on')}
async function saveStaff(){const name=$('s-name').value.trim();if(!name)return toast('الاسم مطلوب',1);
 const rec={...(S.staff.find(x=>x.id===editId)||{}),id:editId||uid(),name,spec:$('s-spec').value.trim(),mobile:$('s-mob').value.trim(),hire:$('s-hire').value,end:$('s-end').value,base:+$('s-base').value||0,ss:$('s-ss').value,se:$('s-se').value,pct:+$('s-pct').value||0,type:$('s-type').value,techId:$('s-tech').value,days:[...document.querySelectorAll('.sd:checked')].map(c=>+c.value)};
 if(!await up('nelle_hr_staff',rec))return;const i=S.staff.findIndex(x=>x.id===rec.id);i<0?S.staff.push(rec):S.staff[i]=rec;cm('m-staff');render();toast('تم الحفظ ✓')}
async function delStaff(id){const s=S.staff.find(x=>x.id===id);if(!confirm('حذف '+s.name+'؟ سجلات حضورها وبنودها ستبقى لكن لن تظهر.'))return;if(await del('nelle_hr_staff',id)){S.staff=S.staff.filter(x=>x.id!==id);render()}}
// ----- Attendance -----
const emp=(s,d)=>(!s.hire||s.hire<=d)&&(!s.end||s.end>=d);
const getA=(sid,d)=>S.att.find(a=>a.staffId===sid&&a.date===d);
function aGo(n){const d=new Date($('a-date').value+'T00:00');d.setDate(d.getDate()+n);$('a-date').value=tds(d);rAtt()}
function aNote(s,a){if(!a||!a.tin)return '';let t='';if(a.tout){const m=mins(a.tout)-mins(a.tin);if(m>0)t+=hm(m)+' س';}
 if(a.st==='p'&&s.ss){const l=mins(a.tin)-mins(s.ss);if(l>RULES.grace)t+=' · تأخير '+l+'د'}
 if(a.st==='p'&&a.tout&&s.se){const e=mins(s.se)-mins(a.tout);if(e>RULES.grace)t+=' · مبكر '+e+'د'}return t}
function rAtt(){const lim=ROLE==='limited';if(lim||!$('a-date').value)$('a-date').value=tds(new Date());const d=$('a-date').value,today=d===tds(new Date()),wd=new Date(d+'T00:00').getDay(),all=$('a-all').checked;
 const rows=S.staff.filter(s=>emp(s,d)&&(all||(s.days||[]).includes(wd)||getA(s.id,d)));
 $('a-body').innerHTML=rows.map(s=>{const a=getA(s.id,d)||{};const o=(v,t)=>`<option value="${v}"${a.st===v?' selected':''}>${t}</option>`;
  return `<tr data-sid="${s.id}"><td><b>${esc(s.name)}</b></td><td class="mut">${s.ss||'--'} – ${s.se||'--'}</td><td><select class="a-st" onchange="saveA('${s.id}')">${o('','—')}${o('p','حاضرة')}${o('a','غياب')}${o('l','إجازة')}</select></td><td><input type="time" class="a-in" value="${a.tin||''}" onchange="saveA('${s.id}')"></td><td><input type="time" class="a-out" value="${a.tout||''}" onchange="saveA('${s.id}')"></td><td class="mut a-n">${aNote(s,a)}</td><td style="white-space:nowrap">${today?`<button class="b" onclick="stamp('${s.id}','in')">حضور الآن</button> <button class="b" onclick="stamp('${s.id}','out')">انصراف الآن</button> <button class="b d" onclick="stamp('${s.id}','abs')">غياب</button>`:''}</td></tr>`}).join('')||'<tr><td colspan="7" class="mut" style="text-align:center;padding:22px">لا توجد فنيات مجدولة في هذا اليوم. فعّلي "إظهار الكل" لتسجيل أي فنية.</td></tr>'}
async function saveA(sid,pre){const d=$('a-date').value,tr=document.querySelector(`tr[data-sid="${sid}"]`),id='a_'+sid+'_'+d;
 const st=pre?pre.st:tr.querySelector('.a-st').value,tin=pre?pre.tin:tr.querySelector('.a-in').value,tout=pre?pre.tout:tr.querySelector('.a-out').value;
 if(!st&&!tin&&!tout){if(getA(sid,d)&&await del('nelle_hr_att',id))S.att=S.att.filter(a=>a.id!==id);return}
 const rec={id,staffId:sid,date:d,st:st||'p',tin,tout};if(!await up('nelle_hr_att',rec))return rAtt();
 const i=S.att.findIndex(a=>a.id===id);i<0?S.att.push(rec):S.att[i]=rec;if(tr){tr.querySelector('.a-st').value=rec.st;tr.querySelector('.a-n').textContent=aNote(S.staff.find(s=>s.id===sid),rec)}rPay()}
async function stamp(sid,k){const d=$('a-date').value,a=getA(sid,d)||{},t=new Date(),now=String(t.getHours()).padStart(2,'0')+':'+String(t.getMinutes()).padStart(2,'0');
 const pre=k==='in'?{st:'p',tin:now,tout:a.tout||''}:k==='out'?{st:a.st==='a'||a.st==='l'?'p':(a.st||'p'),tin:a.tin||'',tout:now}:{st:'a',tin:'',tout:''};
 await saveA(sid,pre);rAtt()}
async function fillAll(){const d=$('a-date').value;for(const tr of document.querySelectorAll('#a-body tr[data-sid]')){const sid=tr.dataset.sid,s=S.staff.find(x=>x.id===sid);if(!getA(sid,d))await saveA(sid,{st:'p',tin:s.ss||'',tout:s.se||''})}rAtt();toast('تم التسجيل ✓')}
// ----- Payroll -----
const hm=m=>Math.floor(m/60)+':'+String(m%60).padStart(2,'0');
function stats(s,from,to){let pres=0,abs=0,leave=0,work=0,late=0,early=0;
 S.att.filter(r=>r.staffId===s.id&&r.date>=from&&r.date<=to).forEach(r=>{
  if(r.st==='p'){pres++;if(r.tin&&r.tout){const m=mins(r.tout)-mins(r.tin);if(m>0)work+=m}
   if(r.tin&&s.ss){const m=mins(r.tin)-mins(s.ss);if(m>RULES.grace)late+=m}
   if(r.tout&&s.se){const m=mins(s.se)-mins(r.tout);if(m>RULES.grace)early+=m}}
  else if(r.st==='a')abs++;else if(r.st==='l')leave++});
 return{pres,abs,leave,work,late,early}}
function pay(s,ym){const dim=new Date(+ym.slice(0,4),+ym.slice(5),0).getDate(),ms=ym+'-01',me=ym+'-'+String(dim).padStart(2,'0');
 const f=s.hire&&s.hire>ms?s.hire:ms,t=s.end&&s.end<me?s.end:me,days=(s.days||[]);
 const sched=(a,b)=>{let n=0;for(let d=new Date(a+'T00:00'),e=new Date(b+'T00:00');d<=e;d.setDate(d.getDate()+1))if(days.includes(d.getDay()))n++;return n};
 let fac=0;if(f<=t)fac=(f===ms&&t===me)?1:(days.length?sched(f,t)/sched(ms,me):((Date.parse(t)-Date.parse(f))/864e5+1)/dim);
 const monthly=+s.base||0,daily=monthly/RULES.workDays,st=stats(s,ms,me),part=s.type==='part';
 const base=part?daily*st.pres:monthly*fac,absD=part?0:st.abs*daily,lateD=(st.late+st.early)/60*(daily/RULES.dayHours);
 const nm=techName(s),rev=S.inv.filter(i=>i.tn===nm&&(i.date||'').startsWith(ym)).reduce((x,i)=>x+(+i.tot||0),0),com=rev*(+s.pct||0)/100;
 const ad=S.adj.filter(a=>a.staffId===s.id&&a.month===ym),bon=ad.filter(a=>a.type==='b').reduce((x,a)=>x+a.amt,0),ded=ad.filter(a=>a.type==='d').reduce((x,a)=>x+a.amt,0);
 return{fac,part,daily,base,rev,com,...st,absD,lateD,bon,ded,net:base+com+bon-absD-lateD-ded}}
function rPay(){if(!$('p-month').value)$('p-month').value=tds(new Date()).slice(0,7);const ym=$('p-month').value;let T=0;const n=x=>x.toFixed(2);
 const rows=S.staff.map(s=>({s,p:pay(s,ym)})).filter(r=>r.p.fac>0);
 $('p-body').innerHTML=rows.map(({s,p})=>{T+=p.net;const lt=p.late+p.early;return `<tr><td><b>${esc(s.name)}</b></td><td>${n(p.base)}${p.part?`<div class="mut">${p.pres} يوم × ${n(p.daily)}</div>`:p.fac<1?'<div class="mut">شهر جزئي</div>':''}</td><td>${n(p.rev)}</td><td>${n(p.com)}<div class="mut"><input type="number" min="0" step="0.5" value="${s.pct||0}" style="width:62px;min-width:0" onchange="setPct('${s.id}',this.value)"> %</div></td><td>${p.abs?p.abs+' يوم'+(p.absD?' (−'+n(p.absD)+')':''):'—'}</td><td>${lt?hm(lt)+' س'+(p.lateD?' (−'+n(p.lateD)+')':''):'—'}</td><td>${p.bon||p.ded?'+'+n(p.bon)+' / −'+n(p.ded):'—'}</td><td class="net">${n(p.net)}</td><td><button class="b" onclick="openAdj('${s.id}')">بنود</button></td></tr>`}).join('')||'<tr><td colspan="9" class="mut" style="text-align:center;padding:22px">لا توجد فنيات في هذا الشهر.</td></tr>';
 $('p-foot').innerHTML=rows.length?`<tr><td colspan="7">إجمالي المرتبات</td><td class="net">${n(T)}</td><td></td></tr>`:''}
async function setPct(id,v){const st=S.staff.find(x=>x.id===id),rec={...st,pct:Math.max(0,+v||0)};if(!await up('nelle_hr_staff',rec))return rPay();Object.assign(st,rec);rPay();toast('تم حفظ نسبة العمولة ✓')}
function repMonth(){const t=new Date();$('r-from').value=tds(new Date(t.getFullYear(),t.getMonth(),1));$('r-to').value=tds(new Date(t.getFullYear(),t.getMonth()+1,0));rRep()}
function rRep(){if(!$('r-from').value)return repMonth();const f=$('r-from').value,t=$('r-to').value,T={pres:0,abs:0,leave:0,work:0,late:0,early:0},z=m=>m?hm(m)+' س':'—';
 $('r-body').innerHTML=S.staff.map(s=>{const x=stats(s,f,t);Object.keys(T).forEach(k=>T[k]+=x[k]);return `<tr><td><b>${esc(s.name)}</b></td><td>${x.pres}</td><td>${x.abs}</td><td>${x.leave}</td><td>${z(x.work)}</td><td>${z(x.late)}</td><td>${z(x.early)}</td></tr>`}).join('')||'<tr><td colspan="7" class="mut" style="text-align:center;padding:22px">لا توجد فنيات.</td></tr>';
 $('r-foot').innerHTML=S.staff.length?`<tr><td>الإجمالي</td><td>${T.pres}</td><td>${T.abs}</td><td>${T.leave}</td><td>${z(T.work)}</td><td>${z(T.late)}</td><td>${z(T.early)}</td></tr>`:''}
let adjSid=null;
function openAdj(sid){adjSid=sid;$('ad-amt').value='';$('ad-note').value='';rAdj();$('m-adj').classList.add('on')}
function rAdj(){const s=S.staff.find(x=>x.id===adjSid),ym=$('p-month').value;$('ma-t').textContent='بنود '+s.name+' — '+ym;
 $('ma-list').innerHTML=S.adj.filter(a=>a.staffId===adjSid&&a.month===ym).map(a=>`<div class="bar" style="margin:0 0 6px"><span style="flex:1">${a.type==='b'?'+':'−'}${a.amt} ج <span class="mut">${esc(a.note)}</span></span><button class="b d" onclick="delAdj('${a.id}')">حذف</button></div>`).join('')||'<div class="mut">لا توجد بنود هذا الشهر.</div>'}
async function addAdj(){const amt=+$('ad-amt').value;if(!amt)return toast('أدخلي المبلغ',1);const rec={id:uid(),staffId:adjSid,month:$('p-month').value,type:$('ad-type').value,amt,note:$('ad-note').value.trim()};
 if(!await up('nelle_hr_adj',rec))return;S.adj.push(rec);$('ad-amt').value='';$('ad-note').value='';rAdj();rPay()}
async function delAdj(id){if(await del('nelle_hr_adj',id)){S.adj=S.adj.filter(a=>a.id!==id);rAdj();rPay()}}
// ----- Start -----
try{const a=JSON.parse(localStorage.getItem('hr_auth')||'null');if(a&&USERS[a.user]&&USERS[a.user].role===a.role)start(a.role);else $('login').classList.add('on')}catch(e){$('login').classList.add('on')}
