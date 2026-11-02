'use client';
import {MapPin,MessageSquare} from 'lucide-react';
import {statusLabels,transitions} from '@/lib/commerce.mjs';
const money=n=>new Intl.NumberFormat('uz-UZ').format(n)+' so‘m';
const verbs={confirmed:'Tasdiqlash',shipped:'Jo‘natish',delivered:'Yetkazildi',cancelled:'Bekor qilish'};
export default function Orders({orders,role,onStatus,busy,loading,error,onRefresh,onChat}){
 return <section><div className="panelTitle"><h2>{role==='seller'?'Kelgan buyurtmalar':'Buyurtmalarim'}</h2><button className="secondary" onClick={onRefresh} disabled={loading||busy}>Yangilash</button></div>
 {error?<p role="alert" className="errorBox">{error}</p>:loading?<p className="empty">Buyurtmalar yuklanmoqda…</p>:!orders.length?<p className="empty">Hali buyurtma yo‘q.</p>:orders.map(o=><article className="orderCard" key={o.id}>
  <div className="orderHeading"><div><b>#{o.id.slice(-8).toUpperCase()}</b><small>{new Date(o.createdAt).toLocaleString('uz-UZ')}</small></div><span className={'badge '+o.status}>{statusLabels[o.status]}</span></div>
  <p>{role==='seller'?'Xaridor: '+o.buyerName:'Yetkazib beruvchi: '+o.supplier}</p>
  <ul className="orderItems">{o.items.map(i=><li key={i.productId}><span>{i.name} · {i.quantity} × {i.unit}</span><b>{money(i.price*i.quantity)}</b></li>)}</ul>
  <p><b>Jami: {money(o.total)}</b></p><p className="muted">Telefon: {o.phone}<br/>Manzil: {o.address}{o.note&&<><br/>Izoh: {o.note}</>}</p>
  {o.location&&<a className="mapLink" target="_blank" rel="noopener noreferrer" href={`https://www.google.com/maps?q=${o.location.lat},${o.location.lng}`}><MapPin size={16}/> Yetkazib berish nuqtasini ochish</a>}<div className="actions">{onChat&&<button className="secondary" disabled={busy} onClick={()=>onChat(role==='seller'?o.buyerId:o.sellerId)}><MessageSquare size={16}/> Hamkorga yozish</button>}{(role==='seller'?transitions[o.status]:o.status==='pending'?['cancelled']:[]).map(s=><button key={s} disabled={busy} className={s==='cancelled'?'secondary danger':'primary'} onClick={()=>{if(s!=='cancelled'||window.confirm('Buyurtmani bekor qilasizmi?'))onStatus(o.id,s);}}>{verbs[s]}</button>)}</div>
 </article>)}
 </section>;
}
