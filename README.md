# MIB Static Landing


## Run locally

Plain static HTML — no `npm` / `package.json`. Pages reference assets at `/static/...`, so serve from the **parent** folder:

```
cd ..
python3 -m http.server 8000
```

Then open http://localhost:8000/static/landing/v1/ (also `v2`–`v5`, `/static/personal/`, `/static/commercial/`).
