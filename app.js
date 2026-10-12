(() => {
"use strict";
const $ = id => document.getElementById(id), KEY = "communityLibraryHTML_v1";
const seed = () => ({
 books:[
 {id:"b1",title:"Things Fall Apart",author:"Chinua Achebe",isbn:"9780385474542",genre:"Fiction",total:5,available:3},
 {id:"b2",title:"The Alchemist",author:"Paulo Coelho",isbn:"9780061122415",genre:"Adventure",total:4,available:1},
 {id:"b3",title:"A Brief History of Time",author:"Stephen Hawking",isbn:"9780553380163",genre:"Science",total:3,available:3},
 {id:"b4",title:"Purple Hibiscus",author:"Chimamanda Ngozi Adichie",isbn:"9781616202415",genre:"Fiction",total:2,available:2}],
 users:[
 {id:"u1",name:"Mpho Ndlovu",email:"mpho@example.com",phone:"5881 2345",joined:"2026-09-12"},
 {id:"u2",name:"Lerato Mokoena",email:"lerato@example.com",phone:"5912 3456",joined:"2026-09-18"},
 {id:"u3",name:"Thabo Molefe",email:"thabo@example.com",phone:"6234 5678",joined:"2026-10-01"}],
 transactions:[{id:"t1",type:"borrow",userId:"u1",bookId:"b2",quantity:1,date:new Date().toISOString()}]
});
function load(){try{const d=JSON.parse(localStorage.getItem(KEY));if(d&&Array.isArray(d.books)&&Array.isArray(d.users)&&Array.isArray(d.transactions))return d}catch(e){console.warn(e)}return seed()}
let data=load(), toastTimer;
function save(){try{localStorage.setItem(KEY,JSON.stringify(data))}catch(e){toast("Could not save. Check browser storage settings.",true)}}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function id(p){return p+Date.now().toString(36)+Math.random().toString(36).slice(2,6)}
function date(v){let d=new Date(v);return isNaN(d)? "—":d.toLocaleDateString(undefined,{day:"2-digit",month:"short",year:"numeric"})}
const book=id=>data.books.find(x=>x.id===id), user=id=>data.users.find(x=>x.id===id);
function outstanding(uid,bid){return data.transactions.reduce((n,t)=>t.userId===uid&&t.bookId===bid?n+(t.type==="borrow"?+t.quantity:-t.quantity):n,0)}
function allBorrowed(bid){return data.transactions.reduce((n,t)=>t.bookId===bid?n+(t.type==="borrow"?+t.quantity:-t.quantity):n,0)}
function toast(msg,error=false){let el=$("toast");el.textContent=msg;el.classList.toggle("error",error);el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),3000)}
function page(name){document.querySelectorAll(".page").forEach(x=>x.classList.toggle("active",x.id===name));document.querySelectorAll(".nav").forEach(x=>x.classList.toggle("active",x.dataset.page===name));render()}
function renderDashboard(){
 $("titles").textContent=data.books.length;$("available").textContent=data.books.reduce((n,b)=>n+b.available,0);
 $("borrowed").textContent=data.books.reduce((n,b)=>n+b.total-b.available,0);$("userTotal").textContent=data.users.length;
 let low=data.books.filter(b=>b.available<=2);
 $("lowStock").innerHTML=low.length?low.map(b=>`<tr><td><strong>${esc(b.title)}</strong></td><td>${esc(b.author)}</td><td class="${b.available<=1?"low":"good"}">${b.available}</td></tr>`).join(""):'<tr><td colspan="3">No low-stock titles.</td></tr>';
 let recent=[...data.transactions].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,5);
 $("recent").innerHTML=recent.length?recent.map(t=>`<p><strong>${esc(user(t.userId)?.name||"Deleted user")}</strong> ${t.type==="borrow"?"borrowed":"returned"} ${t.quantity} × ${esc(book(t.bookId)?.title||"Deleted book")}<br><small>${date(t.date)}</small></p>`).join(""):'<p class="empty">No activity yet.</p>';
}
function renderBooks(){
 let q=$("bookSearch").value.trim().toLowerCase(), rows=data.books.filter(b=>[b.title,b.author,b.isbn,b.genre].some(v=>String(v||"").toLowerCase().includes(q)));
 $("bookRows").innerHTML=rows.map(b=>`<tr><td><strong>${esc(b.title)}</strong><small>by ${esc(b.author)}</small></td><td>${esc(b.isbn||"—")}</td><td>${esc(b.genre||"—")}</td><td>${b.total}</td><td class="${b.available<=1?"low":"good"}">${b.available}</td><td><button class="tiny" data-edit-book="${b.id}">Edit</button><button class="tiny" data-delete-book="${b.id}">Delete</button></td></tr>`).join("");
 $("noBooks").hidden=rows.length>0;
}
function renderUsers(){
 let q=$("userSearch").value.trim().toLowerCase(), rows=data.users.filter(u=>[u.name,u.email,u.phone].some(v=>String(v||"").toLowerCase().includes(q)));
 $("userRows").innerHTML=rows.map(u=>`<tr><td><strong>${esc(u.name)}</strong></td><td>${esc(u.email)}</td><td>${esc(u.phone||"—")}</td><td>${date(u.joined)}</td><td><button class="tiny" data-edit-user="${u.id}">Edit</button><button class="tiny" data-delete-user="${u.id}">Delete</button></td></tr>`).join("");
 $("noUsers").hidden=rows.length>0;
}
function renderTxnForm(){
 let oldU=$("txnUser").value,oldB=$("txnBook").value,type=$("txnType").value;
 $("txnUser").innerHTML='<option value="">Select a user</option>'+data.users.map(u=>`<option value="${u.id}">${esc(u.name)}</option>`).join("");
 if(data.users.some(u=>u.id===oldU))$("txnUser").value=oldU;
 let eligible=data.books.filter(b=>type==="borrow"?b.available>0:allBorrowed(b.id)>0);
 $("txnBook").innerHTML='<option value="">Select a book</option>'+eligible.map(b=>`<option value="${b.id}">${esc(b.title)} (${type==="borrow"?b.available+" available":allBorrowed(b.id)+" borrowed"})</option>`).join("");
 if(eligible.some(b=>b.id===oldB))$("txnBook").value=oldB;
}
function renderTransactions(){
 let rows=[...data.transactions].sort((a,b)=>new Date(b.date)-new Date(a.date));
 $("txnRows").innerHTML=rows.map(t=>`<tr><td>${date(t.date)}</td><td><strong>${esc(user(t.userId)?.name||"Deleted user")}</strong><small>${esc(book(t.bookId)?.title||"Deleted book")}</small></td><td>${t.type==="borrow"?"Borrow":"Return"}</td><td>${t.quantity}</td></tr>`).join("");
 $("noTxns").hidden=rows.length>0;
}
function render(){renderDashboard();renderBooks();renderUsers();renderTxnForm();renderTransactions()}
function openBook(b=null){
 $("bookForm").reset();$("bookId").value=b?.id||"";$("bookModalTitle").textContent=b?"Edit book":"Add book";
 $("bookTitle").value=b?.title||"";$("bookAuthor").value=b?.author||"";$("bookIsbn").value=b?.isbn||"";$("bookGenre").value=b?.genre||"";$("bookTotal").value=b?.total||1;
 $("bookTotal").min=b?String(b.total-b.available):"1";$("bookDialog").showModal()
}
function openUser(u=null){
 $("userForm").reset();$("userId").value=u?.id||"";$("userModalTitle").textContent=u?"Edit user":"Add user";
 $("userName").value=u?.name||"";$("userEmail").value=u?.email||"";$("userPhone").value=u?.phone||"";$("userDialog").showModal()
}
$("bookForm").addEventListener("submit",e=>{
 e.preventDefault();let key=$("bookId").value,title=$("bookTitle").value.trim(),author=$("bookAuthor").value.trim(),isbn=$("bookIsbn").value.trim(),genre=$("bookGenre").value.trim(),total=+$("bookTotal").value;
 if(!title||!author||!Number.isInteger(total)||total<1)return toast("Enter a title, author, and valid total copies.",true);
 if(isbn&&data.books.some(b=>b.id!==key&&b.isbn.toLowerCase()===isbn.toLowerCase()))return toast("That ISBN is already in use.",true);
 if(key){let b=book(key);let out=b.total-b.available;if(total<out)return toast(`At least ${out} total copies are needed because some are borrowed.`,true);Object.assign(b,{title,author,isbn,genre,total,available:total-out})}
 else data.books.push({id:id("b"),title,author,isbn,genre,total,available:total});
 save();$("bookDialog").close();render();toast(key?"Book updated.":"Book added.")
});
$("userForm").addEventListener("submit",e=>{
 e.preventDefault();let key=$("userId").value,name=$("userName").value.trim(),email=$("userEmail").value.trim(),phone=$("userPhone").value.trim();
 if(!name||!email)return toast("Enter name and email.",true);
 if(data.users.some(u=>u.id!==key&&u.email.toLowerCase()===email.toLowerCase()))return toast("That email is already registered.",true);
 if(key)Object.assign(user(key),{name,email,phone});else data.users.push({id:id("u"),name,email,phone,joined:new Date().toISOString()});
 save();$("userDialog").close();render();toast(key?"User updated.":"User added.")
});
$("txnForm").addEventListener("submit",e=>{
 e.preventDefault();let type=$("txnType").value,uid=$("txnUser").value,bid=$("txnBook").value,qty=+$("txnQty").value,b=book(bid);
 if(!user(uid)||!b)return toast("Select a valid user and book.",true);
 if(!Number.isInteger(qty)||qty<1)return toast("Quantity must be at least 1.",true);
 if(type==="borrow"){if(qty>b.available)return toast(`Only ${b.available} copies are available.`,true);b.available-=qty}
 else{let out=outstanding(uid,bid);if(qty>out)return toast(`This user has only ${out} copy/copies of this book to return.`,true);b.available+=qty}
 data.transactions.push({id:id("t"),type,userId:uid,bookId:bid,quantity:qty,date:new Date().toISOString()});save();$("txnQty").value=1;render();toast(type==="borrow"?"Borrowing saved.":"Return saved.")
});
$("bookRows").addEventListener("click",e=>{
 let a=e.target.closest("[data-edit-book]"),d=e.target.closest("[data-delete-book]");
 if(a)openBook(book(a.dataset.editBook));
 if(d){let b=book(d.dataset.deleteBook);if(b.available!==b.total)return toast("Record returns before deleting this book.",true);if(confirm(`Delete "${b.title}"?`)){data.books=data.books.filter(x=>x.id!==b.id);save();render();toast("Book deleted.")}}
});
$("userRows").addEventListener("click",e=>{
 let a=e.target.closest("[data-edit-user]"),d=e.target.closest("[data-delete-user]");
 if(a)openUser(user(a.dataset.editUser));
 if(d){let u=user(d.dataset.deleteUser);if(data.books.some(b=>outstanding(u.id,b.id)>0))return toast("This user still has borrowed books. Record returns first.",true);if(confirm(`Delete user "${u.name}"?`)){data.users=data.users.filter(x=>x.id!==u.id);save();render();toast("User deleted.")}}
});
document.querySelectorAll(".nav").forEach(b=>b.addEventListener("click",()=>page(b.dataset.page)));
$("addBook").addEventListener("click",()=>openBook());$("addUser").addEventListener("click",()=>openUser());
$("bookSearch").addEventListener("input",renderBooks);$("userSearch").addEventListener("input",renderUsers);$("txnType").addEventListener("change",renderTxnForm);
document.querySelectorAll("[data-close]").forEach(b=>b.addEventListener("click",()=>$ (b.dataset.close).close()));
$("reset").addEventListener("click",()=>{if(confirm("Reset the library to the original demo data? Your changes will be removed.")){data=seed();save();render();toast("Demo data reset.")}});
render();
})();