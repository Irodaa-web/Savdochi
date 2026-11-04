import urllib.request,urllib.error,http.cookiejar,json,secrets,time,uuid,os,sys
if os.environ.get('SAVDOCHI_ALLOW_TEST_WRITES')!='1':
 raise SystemExit('Set SAVDOCHI_ALLOW_TEST_WRITES=1 and use a disposable test deployment.')
BASE=os.environ['SAVDOCHI_TEST_URL'].rstrip('/')
checks=[];product_ids=[];accounts={}
def say(s): print(s,flush=True)
class Client:
 def __init__(self):self.jar=http.cookiejar.CookieJar();self.opener=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.jar))
 def call(self,path,method='GET',body=None,status=200,raw=False):
  data=None if body is None else json.dumps(body).encode();req=urllib.request.Request(BASE+path,data=data,method=method,headers={'Content-Type':'application/json','Origin':BASE});t=time.time()
  try:r=self.opener.open(req,timeout=45);code=r.status;payload=r.read()
  except urllib.error.HTTPError as e:code=e.code;payload=e.read()
  if code!=status:raise AssertionError(f'{method} {path}: expected {status}, got {code}: '+payload.decode()[:300])
  if raw:return payload
  result=json.loads(payload);return result
 def register(self,role):
  self.email='qa-'+uuid.uuid4().hex[:12]+'@example.invalid';self.password=secrets.token_urlsafe(20)
  self.user=self.call('/api/auth/register','POST',{'name':'MVP QA '+role,'email':self.email,'password':self.password,'role':role},201)['user'];return self
 def profile(self,**kwargs):return self.call('/api/profile','PUT',{'name':'MVP QA '+self.user['role'],'profile':kwargs})
def ok(s):checks.append(s);say('PASS '+s)
s=Client().register('seller');b=Client().register('buyer');o=Client().register('buyer');accounts={'s':s,'b':b,'o':o}
# Persist only synthetic test state for follow-up checks, never print credentials.
state={'accounts':{k:{'email':v.email,'password':v.password,'user':v.user} for k,v in accounts.items()},'products':product_ids}
def save():pass

save()
try:
 profile={'phone':'+998900000000','region':'QA hudud','address':'QA sinov manzili','deliveryAreas':['QA hudud'],'deliveryFee':1000,'freeDeliveryFrom':100000,'minOrderTotal':1000,'holdLimit':30,'paymentMethods':['Naqd'],'deliveryDays':['Dushanba'],'deliveryLeadDays':2}
 s.profile(**profile);b.profile(phone='+998900000001',region='QA hudud',address='QA sinov do‘koni')
 assert not b.call('/api/auth/me')['user']['isAdmin'];b.call('/api/admin',status=403);ok('profiles and admin boundary')
 p=s.call('/api/products','POST',{'name':'MVP QA ulgurji mahsulot','category':'Oziq-ovqat','price':1000,'unit':'1 quti','stock':100,'minOrder':2,'packSize':12,'innerUnit':'dona','priceTiers':[{'min':10,'price':900}],'description':'Avtomatik sinov mahsuloti'},201)['product'];pid=p['id'];product_ids.append(pid);state['pid']=pid;save()
 b.call('/api/favorites','PUT',{'id':pid,'saved':True});assert any(x['id']==pid for x in b.call('/api/favorites')['products']);ok('product tiers and favorites')
 b.call('/api/partnerships','POST',{'partnerId':s.user['id']});rel=s.call('/api/partnerships')['partnerships'][0];b.call('/api/partnerships','PATCH',{'id':rel['id'],'action':'accepted'},409);s.call('/api/partnerships','PATCH',{'id':rel['id'],'action':'accepted'});s.call('/api/partnerships','PATCH',{'id':rel['id'],'action':'terms','discount':10,'terms':'QA maxsus shartlar'});ok('recipient-only partnership acceptance and discount')
 cart=b.call('/api/cart','PUT',{'productId':pid,'quantity':10});g=cart['groups'][0];assert g['subtotal']==8100 and g['total']==9100,g
 b.call('/api/cart','PUT',{'productId':pid,'quantity':31},409)
 rows=s.call('/api/reservations')['reservations'];assert any(r['quantity']==10 for r in rows);ok('tier + partner quote, reservation limit and visibility')
 checkout={'requestId':str(uuid.uuid4()),'phone':'+998900000001','address':'QA sinov do‘koni','region':'Wrong','paymentMethod':'Naqd','expectedTotal':9100,'items':[{'productId':pid,'quantity':10}]}
 b.call('/api/orders','POST',checkout,409);assert len(b.call('/api/cart')['items'])==1
 checkout['region']='QA hudud';checkout['expectedTotal']=1;b.call('/api/orders','POST',checkout,409)
 checkout['expectedTotal']=9100;order=b.call('/api/orders','POST',checkout,201)['orders'][0];oid=order['id'];state['oid']=oid;save();assert order['total']==9100
 assert b.call('/api/orders','POST',checkout,201)['orders'][0]['id']==oid
 assert not b.call('/api/cart')['items'];o.call('/api/orders/'+oid,'PATCH',{'action':'cancelled'},404);ok('checkout authoritative total, rollback, retry and isolation')
 proposal={'action':'propose','version':order['updatedAt'],'items':[{'productId':pid,'quantity':8,'price':800}],'deliveryFee':500,'deliveryDate':'2099-11-04','reason':'QA qisman miqdor'}
 order=s.call('/api/orders/'+oid,'PATCH',proposal)['order'];assert order['status']=='proposed' and order['total']==9100
 order=b.call('/api/orders/'+oid,'PATCH',{'action':'accept_proposal','version':order['updatedAt']})['order'];assert order['total']==6900 and order['status']=='confirmed'
 assert next(x for x in s.call('/api/products?mine=1')['products'] if x['id']==pid)['stock']==92;ok('proposal accepted total and stock conservation')
 chat=b.call('/api/chats','POST',{'partnerId':s.user['id']})['chat'];mid=b.call('/api/chats/'+chat['id']+'/messages','POST',{'clientId':str(uuid.uuid4()),'text':'QA buyurtma haqida xabar','orderId':oid},201)['message']['id'];assert next(c for c in s.call('/api/chats')['chats'] if c['id']==chat['id'])['unread']==1
 o.call('/api/chats/'+chat['id']+'/messages',status=404)
 s.call('/api/chats/'+chat['id']+'/messages','PATCH',{'lastId':mid});assert next(c for c in s.call('/api/chats')['chats'] if c['id']==chat['id'])['unread']==0;assert s.call('/api/notifications')['unread']>0;ok('order-linked private chat, unread and notifications')
 for actor,action in [(b,'report_payment'),(s,'confirm_payment'),(s,'shipped'),(s,'delivered'),(b,'received')]:order=actor.call('/api/orders/'+oid,'PATCH',{'action':action,'version':order['updatedAt']})['order']
 assert order['status']=='received' and order['paymentStatus']=='paid';assert s.call('/api/reports')['paidValue']==6900;ok('payment confirmation, delivery, receipt and report')
 re=b.call('/api/orders/'+oid+'/reorder','POST',{});assert len(re['added'])==1;assert b.call('/api/cart')['items'][0]['quantity']==8
 b.call('/api/orders/'+oid+'/reorder','POST',{});assert b.call('/api/cart')['items'][0]['quantity']==8
 b.call('/api/cart','PUT',{'productId':pid,'quantity':0});ok('repeat order does not double the existing cart')
 b.call('/api/tickets','POST',{'subject':'QA murojaat','text':'Bu avtomatik sinov murojaati','orderId':oid},201);assert len(b.call('/api/tickets')['tickets'])==1;assert not o.call('/api/tickets')['tickets'];ok('order support ownership')
 # Import validation and retry-safe transaction via JSON confirmation.
 rows=[{'name':'MVP QA import','category':'Oziq-ovqat','price':500,'unit':'1 dona','stock':5,'minOrder':1,'packSize':1,'innerUnit':'dona','description':'QA import'}];key=str(uuid.uuid4());s.call('/api/products/import','POST',{'key':key,'rows':rows});s.call('/api/products/import','POST',{'key':key,'rows':rows});imports=[x for x in s.call('/api/products?mine=1')['products'] if x['name']=='MVP QA import'];assert len(imports)==1;product_ids.extend(x['id'] for x in imports);save();template=s.call('/api/products/import',raw=True);assert template[:2]==b'PK';ok('Excel template and atomic retry-safe import')
 # Synthetic account recovery invalidates sessions and consumes code once.
 code=o.call('/api/security','POST',{'password':o.password})['recoveryCode'];new=secrets.token_urlsafe(20);public=Client();public.call('/api/auth/recover','POST',{'email':o.email,'code':code,'password':new});o.call('/api/auth/me',status=401);public.call('/api/auth/recover','POST',{'email':o.email,'code':code,'password':new},400);o.password=new;public.call('/api/auth/login','POST',{'email':o.email,'password':new});ok('one-time recovery and session invalidation')
 assert isinstance(b.call('/api/telegram')['configured'],bool);Client().call('/api/telegram/webhook','POST',{},403);ok('unconfigured Telegram is explicit and webhook protected')
except Exception as e:
 say('FAIL '+str(e));raise
finally:
 for pid in product_ids:
  try:b.call('/api/cart','PUT',{'productId':pid,'quantity':0});s.call('/api/products/'+pid,'DELETE')
  except Exception as e:say('cleanup warning '+str(e))
 try:s.profile();b.profile()
 except Exception as e:say('profile cleanup warning '+str(e))
 say('Completed '+str(len(checks))+' scenario groups; synthetic products archived.')
