const encoder=new TextEncoder();
const json=(body,status=200,headers={})=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store',...headers}});
const hex=bytes=>Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
const randomHex=n=>hex(crypto.getRandomValues(new Uint8Array(n)));
async function sha256(s){return hex(new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(s))))}
async function passwordHash(pass,salt){const key=await crypto.subtle.importKey('raw',encoder.encode(pass),'PBKDF2',false,['deriveBits']);return hex(new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',salt:encoder.encode(salt),iterations:210000,hash:'SHA-256'},key,256)))}
async function getUser(req,db){const token=(req.headers.get('cookie')||'').match(/(?:^|;\s*)bb_session=([a-f0-9]{64})/)?.[1];if(!token)return null;return db.prepare('SELECT users.id,users.username FROM sessions JOIN users ON users.id=sessions.user_id WHERE token_hash=? AND expires_at>?').bind(await sha256(token),Date.now()).first()}
async function body(req){try{return await req.json()}catch{return {}}}
function cookie(token,maxAge){return `bb_session=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAge}`}
export default {async fetch(req,env){const url=new URL(req.url),path=url.pathname;if(!path.startsWith('/api/'))return env.ASSETS.fetch(req);try{
if(req.method==='GET'&&path==='/api/me'){const user=await getUser(req,env.DB);return json({user})}
if(req.method==='POST'&&path==='/api/login'){const b=await body(req),name=String(b.username||'').trim().toLowerCase(),pass=String(b.password||'');const record=await env.DB.prepare('SELECT id,username,salt,password_hash FROM users WHERE username=?').bind(name).first();if(!record||await passwordHash(pass,record.salt)!==record.password_hash)return json({error:'Invalid credentials'},401);const token=randomHex(32);await env.DB.prepare('INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)').bind(await sha256(token),record.id,Date.now()+7*86400000).run();return json({user:{id:record.id,username:record.username}},200,{'set-cookie':cookie(token,7*86400)})}
if(req.method==='POST'&&path==='/api/logout'){const token=(req.headers.get('cookie')||'').match(/(?:^|;\s*)bb_session=([a-f0-9]{64})/)?.[1];if(token)await env.DB.prepare('DELETE FROM sessions WHERE token_hash=?').bind(await sha256(token)).run();return json({ok:true},200,{'set-cookie':cookie('',0)})}
const user=await getUser(req,env.DB);if(!user)return json({error:'Authentication required'},401);
if(req.method==='GET'&&path==='/api/favourites'){const rows=await env.DB.prepare('SELECT channel_id FROM favourites WHERE user_id=?').bind(user.id).all();return json({ids:rows.results.map(r=>r.channel_id)})}
if(req.method==='PUT'&&path==='/api/favourites'){const b=await body(req);if(typeof b.id!=='string'||b.id.length>500||!b.id)return json({error:'Invalid channel id'},400);if(b.favourite===true)await env.DB.prepare('INSERT OR IGNORE INTO favourites(user_id,channel_id) VALUES(?,?)').bind(user.id,b.id).run();else if(b.favourite===false)await env.DB.prepare('DELETE FROM favourites WHERE user_id=? AND channel_id=?').bind(user.id,b.id).run();else return json({error:'Invalid favourite value'},400);return json({ok:true})}
return json({error:'Not found'},404)
}catch(e){return json({error:'Server request failed'},500)}}};
