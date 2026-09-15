# school-sync worker

Quiz-result sync backend for study.html / parent.html (Cloudflare Worker + KV).
The secret token lives in `wrangler.toml` ([vars] TOK) and is also baked into
study.html and parent.html — keep all three identical.

## Deploy

    cd worker && npx wrangler deploy

Endpoints (all require the token via `x-tok` header or `?tok=`):
POST /r  upsert one run · GET /r  all runs · GET /r?name=<nick>  one kid.
