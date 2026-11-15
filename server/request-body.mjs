// Bound buffering even when Content-Length is absent or dishonest. Never log request bodies.
export async function boundedRequest(request,limit=6*1024*1024){
 if(['GET','HEAD'].includes(request.method)||!request.body)return request;
 const declared=Number(request.headers.get('content-length'));
 if(Number.isFinite(declared)&&declared>limit)throw new RangeError('Request too large');
 const reader=request.body.getReader(),chunks=[];let size=0;
 try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>limit){await reader.cancel();throw new RangeError('Request too large')}chunks.push(value)}}finally{reader.releaseLock()}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength}
 // Preserve exact raw bytes: Stripe verifies its signature against this unchanged body.
 return new Request(request,{body:bytes});
}
