'use client';
import {useState} from 'react';
import {compressImage} from '@/components/SettingsPanel';
import {categories} from '@/lib/commerce.mjs';
export default function ProductForm({product,onSave,onCancel,busy}){
 const [form,setForm]=useState(product||{name:'',category:categories[0],price:'',unit:'1 dona',stock:'',minOrder:1,description:''});
 const [imageError,setImageError]=useState('');
 const field=(key,value)=>setForm(p=>({...p,[key]:value}));
 return <form className="productForm" onSubmit={e=>{e.preventDefault();onSave({...form,...(form.image?.startsWith('/api/')?{image:undefined}:{}),price:Number(form.price),stock:Number(form.stock),minOrder:Number(form.minOrder)});}}>
  <h3>{product?'Mahsulotni tahrirlash':'Yangi mahsulot'}</h3>
  <div className="formGrid">
   <label>Mahsulot nomi<input required minLength={2} maxLength={120} value={form.name} onChange={e=>field('name',e.target.value)}/></label>
   <label>Kategoriya<select value={form.category} onChange={e=>field('category',e.target.value)}>{categories.map(c=><option key={c}>{c}</option>)}</select></label>
   <label>Bir birlik narxi (so‘m)<input type="number" required min={1} max={1000000000} step={1} value={form.price} onChange={e=>field('price',e.target.value)}/></label>
   <label>Birlik (masalan, 50 kg qop)<input required maxLength={40} value={form.unit} onChange={e=>field('unit',e.target.value)}/></label>
   <label>Sotuv uchun qoldiq (birlik)<input type="number" required min={0} max={1000000} step={1} value={form.stock} onChange={e=>field('stock',e.target.value)}/></label>
   <label>Minimal buyurtma (birlik)<input type="number" required min={1} max={100000} step={1} value={form.minOrder} onChange={e=>field('minOrder',e.target.value)}/></label>
  </div>
  <div className="formGrid"><label>Bir qadoq ichidagi miqdor<input type="number" min="1" max="100000" value={form.packSize||1} onChange={e=>field('packSize',Number(e.target.value))}/></label><label>Ichki birlik (dona, litr, kg)<input maxLength="30" value={form.innerUnit||'dona'} onChange={e=>field('innerUnit',e.target.value)}/></label><label>Mahsulot rasmi<input type="file" accept="image/jpeg,image/png,image/webp" onChange={async e=>{try{field('image',await compressImage(e.target.files[0]));setImageError('');}catch(err){setImageError(err.message);}}}/></label>{form.image&&<div><img className="productThumb" src={form.image} alt="Mahsulot"/><button type="button" onClick={()=>field('image','')}>Rasmni olib tashlash</button></div>}</div>{imageError&&<p className="errorBox">{imageError}</p>}<h3>Ulgurji narx pog‘onalari</h3><p className="muted">Masalan, 10 qadoqdan boshlab birlik narxi arzonroq. Narx qadoq uchun ko‘rsatiladi.</p>{(form.priceTiers||[]).map((t,n)=><div className="tierRow" key={n}><label>Shu miqdordan boshlab<input type="number" required min={form.minOrder||1} max="100000" value={t.min} onChange={e=>field('priceTiers',form.priceTiers.map((v,i)=>i===n?{...v,min:Number(e.target.value)}:v))}/></label><label>Birlik narxi<input type="number" required min="1" max={form.price} value={t.price} onChange={e=>field('priceTiers',form.priceTiers.map((v,i)=>i===n?{...v,price:Number(e.target.value)}:v))}/></label><button type="button" onClick={()=>field('priceTiers',form.priceTiers.filter((_,i)=>i!==n))}>Olib tashlash</button></div>)}<button className="secondary" type="button" disabled={(form.priceTiers||[]).length>=10} onClick={()=>field('priceTiers',[...(form.priceTiers||[]),{min:Number(form.minOrder)||1,price:Number(form.price)||1}])}>Narx pog‘onasi qo‘shish</button>
  <label>Tavsif<textarea rows={3} maxLength={2000} value={form.description} onChange={e=>field('description',e.target.value)}/></label>
  <div className="actions"><button className="primary" disabled={busy}>{busy?'Saqlanmoqda…':'Saqlash'}</button><button type="button" className="secondary" onClick={onCancel} disabled={busy}>Bekor qilish</button></div>
 </form>;
}
