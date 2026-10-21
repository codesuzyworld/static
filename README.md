# MIB Static Landing


## Run locally

Plain static HTML — no `npm` / `package.json`. Pages reference assets at `/static/...`, so serve from the **parent** folder:

```
cd ..
python3 -m http.server 8000
```

Then open http://localhost:8000/static/landing/v1/. Versions: V1 `/static/landing/v1/`, V2 `/static/personal/` (`/static/landing/v2/` redirects there), V3 `/static/landing/v3/`, V4 `/static/landing/v4/`. Hidden older versions: `/static/landing/old-v2/`, `/static/landing/old-v4/`, `/static/landing/v5/`.
