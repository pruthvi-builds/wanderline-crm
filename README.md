# Wanderline — Travel CRM (demo)

## Deploy to Netlify — easiest path (no coding, ~5 min)

1. Unzip this folder on your computer.
2. Go to https://app.netlify.com and sign up / log in (free).
3. Create a free GitHub account if you don't have one, and make a new repository — upload this unzipped folder to it (GitHub's website lets you drag-and-drop files in, no command line needed).
4. In Netlify, click **Add new site → Import an existing project**, connect GitHub, and pick that repository.
5. Netlify will detect `netlify.toml` automatically — build command `npm run build`, publish folder `dist`. Just click **Deploy site**.
6. In 1–2 minutes you'll get a live link like `https://wanderline-xxxx.netlify.app` — that's the one to share with your client.

You can rename the link under **Site settings → Change site name**.

## Alternative — drag-and-drop deploy (if you're comfortable with a terminal)

```
npm install
npm run build
```

This creates a `dist` folder. Go to https://app.netlify.com/drop and drag that `dist` folder in — you'll get a live link instantly, no GitHub needed.

## Notes

- Data in the demo resets on page refresh (no backend/database yet). Fine for a first look; let me know if you want it to persist before your client trials it for real.
