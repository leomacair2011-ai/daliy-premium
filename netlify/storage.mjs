// Implements only the prepared statements used by the existing storefront.
// Private rows are never exposed through a public read endpoint.
export function createStoreDatabase(store) {
  const get=key=>store.get(key,{type:'json',consistency:'strong'});
  const rateKey=(table,row)=>`rate/${table}/${row.ip_hash}/${Math.floor(row.created_at/3600000)}/${row.created_at}-${row.id}`;
  async function insert(table,row,ignore=false){
    const result=await store.setJSON(`${table}/${row.id}`,row,ignore?{onlyIfNew:true}:{});
    if(result.modified!==false)await store.setJSON(rateKey(table,row),true);
    return {success:true};
  }
  async function update(id,change){
    const key=`orders/${id}`;
    for(let attempt=0;attempt<8;attempt++){
      const current=await store.getWithMetadata(key,{type:'json',consistency:'strong'});
      if(!current)return {success:true};
      const next=change(current.data);
      if(!next)return {success:true};
      const result=await store.setJSON(key,next,{onlyIfMatch:current.etag});
      if(result.modified){
        if(next.stripe_session_id)await store.setJSON(`sessions/${next.stripe_session_id}`,id);
        return {success:true};
      }
    }
    throw new Error('Order is busy; please retry.');
  }
  async function first(sql,args){
    const count=sql.match(/^SELECT count\(\*\) AS total FROM (enquiries|subscribers|orders) WHERE ip_hash = \? AND created_at > \?$/);
    if(count){
      let total=0;const [ip,since]=args;
      for(let hour=Math.floor(since/3600000);hour<=Math.floor(Date.now()/3600000);hour++){
        const prefix=`rate/${count[1]}/${ip}/${hour}/`;
        for await(const page of store.list({prefix,paginate:true}))
          total+=page.blobs.filter(b=>Number(b.key.slice(prefix.length).split('-')[0])>since).length;
      }
      return {total};
    }
    if(sql==='SELECT items_json FROM orders WHERE id = ?'||sql==='SELECT * FROM orders WHERE id = ?')return get(`orders/${args[0]}`);
    if(sql==='SELECT status FROM orders WHERE stripe_session_id = ?'){
      const id=await get(`sessions/${args[0]}`);return id?get(`orders/${id}`):null;
    }
    throw new Error('Unsupported read statement');
  }
  async function run(sql,a){
    if(sql.startsWith('INSERT INTO enquiries ')){
      const [id,name,email,order_reference,message,created_at,ip_hash]=a;
      return insert('enquiries',{id,name,email,order_reference,message,created_at,ip_hash});
    }
    if(sql.startsWith('INSERT OR IGNORE INTO subscribers ')){
      const [id,email,product_id,created_at,ip_hash]=a;
      return insert('subscribers',{id,email,product_id,created_at,ip_hash},true);
    }
    if(sql.startsWith('INSERT OR IGNORE INTO orders ')){
      const [id,items_json,total_pence,currency,status,created_at,ip_hash]=a;
      return insert('orders',{id,items_json,total_pence,currency,status,created_at,ip_hash},true);
    }
    if(sql==='UPDATE orders SET stripe_session_id = ? WHERE id = ?')return update(a[1],row=>({...row,stripe_session_id:a[0]}));
    if(sql.startsWith("UPDATE orders SET status = 'paid'"))return update(a[3],row=>({...row,status:'paid',stripe_session_id:a[0],customer_json:a[1],paid_at:row.paid_at??a[2]}));
    if(sql==="UPDATE orders SET status = ? WHERE id = ? AND status != 'paid'")return update(a[1],row=>row.status==='paid'?null:{...row,status:a[0]});
    throw new Error('Unsupported write statement');
  }
  return {prepare(sql){return {bind(...args){return {first:()=>first(sql,args),run:()=>run(sql,args)};}};}};
}
