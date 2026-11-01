export const categories = ['Oziq-ovqat', 'Ichimliklar', 'Maishiy kimyo', 'Qurilish materiallari', 'Elektronika'];
export const statusLabels = {pending:'Kutilmoqda', confirmed:'Tasdiqlangan', shipped:'Yo‘lda', delivered:'Yetkazilgan', cancelled:'Bekor qilingan'};
export const transitions = {pending:['confirmed','cancelled'], confirmed:['shipped','cancelled'], shipped:['delivered'], delivered:[], cancelled:[]};
export class AppError extends Error { constructor(message, status=400) { super(message); this.status=status; } }
const text = (v, min, max, label) => { if(typeof v !== 'string' || v.trim().length<min || v.trim().length>max) throw new AppError(`${label}: ${min}–${max} belgi kiriting`); return v.trim(); };
const integer = (v, min, max, label) => { if(typeof v!=='number'||!Number.isSafeInteger(v)||v<min||v>max) throw new AppError(`${label}: ${min}–${max} oralig‘ida butun son kiriting`); return v; };
export function productInput(b) {
  if(!b || typeof b!=='object') throw new AppError('Mahsulot ma’lumotlari kerak');
  if(!categories.includes(b.category)) throw new AppError('Kategoriyani tanlang');
  const minOrder=integer(b.minOrder,1,100000,'Minimal buyurtma');
  return {name:text(b.name,2,120,'Mahsulot nomi'),category:b.category,price:integer(b.price,1,1000000000,'Narx'),unit:text(b.unit,1,40,'O‘lchov'),stock:integer(b.stock,0,1000000,'Qoldiq'),minOrder,description:text(b.description??'',0,2000,'Tavsif')};
}
export function checkoutInput(b) {
  if(!b || !Array.isArray(b.items)||!b.items.length||b.items.length>50) throw new AppError('Savatda 1–50 turdagi mahsulot bo‘lsin');
  const seen=new Set();
  const items=b.items.map(x=>{
    if(!/^[a-f\d]{24}$/i.test(x?.productId)||seen.has(x.productId)) throw new AppError('Savatdagi mahsulotlarni tekshiring');
    seen.add(x.productId);
    return {productId:x.productId,quantity:integer(x.quantity,1,100000,'Miqdor')};
  });
  if(!/^[a-zA-Z0-9-]{16,80}$/.test(b.requestId)) throw new AppError('Buyurtma identifikatori noto‘g‘ri');
  const phone=text(b.phone,9,25,'Telefon');
  if(!/^\+?[\d ()-]+$/.test(phone)||phone.replace(/\D/g,'').length<9) throw new AppError('Telefon raqamini tekshiring');
  return {items,requestId:b.requestId,phone,address:text(b.address,5,400,'Manzil'),note:text(b.note??'',0,1000,'Izoh')};
}
export function nextStatus(current, next, role) {
  if(!transitions[current]?.includes(next) || (role==='buyer' && !(current==='pending'&&next==='cancelled'))) throw new AppError('Bu holatga o‘tkazib bo‘lmaydi',409);
  return next;
}
