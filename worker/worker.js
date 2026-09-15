// school-sync: quiz-result sync for school.stridin.app
// KV: RESULTS (key s:<id> -> session record JSON)
const ORIGINS = ["https://school.stridin.app", "http://localhost:8125"];
function cors(req){
  const o = req.headers.get("Origin") || "";
  return {
    "Access-Control-Allow-Origin": ORIGINS.includes(o) ? o : ORIGINS[0],
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "content-type,x-tok",
    "Content-Type": "application/json",
  };
}
export default {
  async fetch(req, env){
    const h = cors(req);
    if(req.method === "OPTIONS") return new Response(null, { headers: h });
    const url = new URL(req.url);
    if(url.pathname !== "/r") return new Response('{"err":"not found"}', { status: 404, headers: h });
    const tok = req.headers.get("x-tok") || url.searchParams.get("tok");
    if(tok !== env.TOK) return new Response('{"err":"forbidden"}', { status: 403, headers: h });

    if(req.method === "POST"){
      let rec;
      try { rec = await req.json(); } catch(e){ return new Response('{"err":"bad json"}', { status: 400, headers: h }); }
      if(!rec || typeof rec.id !== "string" || rec.id.length > 80 || typeof rec.name !== "string")
        return new Response('{"err":"bad record"}', { status: 400, headers: h });
      const body = JSON.stringify(rec).slice(0, 100000);
      const old = await env.RESULTS.get("s:" + rec.id);
      if(old){                       // keep the newer version (by `up` stamp)
        try { if((JSON.parse(old).up || 0) > (rec.up || 0))
          return new Response('{"ok":true,"kept":"server"}', { headers: h }); } catch(e){}
      }
      await env.RESULTS.put("s:" + rec.id, body);
      return new Response('{"ok":true}', { headers: h });
    }

    if(req.method === "GET"){
      const name = url.searchParams.get("name");
      const out = [];
      let cursor;
      do {
        const page = await env.RESULTS.list({ prefix: "s:", cursor });
        for(const k of page.keys){
          const v = await env.RESULTS.get(k.name);
          if(!v) continue;
          try {
            const rec = JSON.parse(v);
            if(!name || rec.name === name) out.push(rec);
          } catch(e){}
        }
        cursor = page.list_complete ? null : page.cursor;
      } while(cursor);
      out.sort((a, b) => (b.when || 0) - (a.when || 0));
      return new Response(JSON.stringify(out), { headers: h });
    }
    return new Response('{"err":"method"}', { status: 405, headers: h });
  }
};
