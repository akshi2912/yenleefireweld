# Yen Lee Fireweld — Developer Project Management System

## Deploying via Netlify Drop (drag-and-drop)? Read this first.

If you deploy by dragging your project folder/zip onto Netlify (the deploy
summary says "Build from drop deployment"), every save/upload will fail with
**"Could not reach the project database. Please try again."** This is not a
bug in the code — Netlify Drop deploys don't get Netlify Blobs storage
credentials injected automatically the way Git-connected or CLI deploys do.
The fix is two copy/paste values in the Netlify dashboard, no coding:

1. **Get your Site ID.** In your site on Netlify → **Site configuration**
   (left sidebar) → **General** → under "Site details" you'll see **Site
   ID** — copy it.
2. **Create a Personal Access Token.** Click your account avatar (top
   right) → **User settings** → **Applications** → **Personal access
   tokens** → **New access token**. Give it any name, click **Generate
   token**, and copy the token immediately (you won't be able to see it
   again).
3. **Add both as environment variables.** Back in your site → **Site
   configuration** → **Environment variables** → **Add a variable**:
   - `NETLIFY_SITE_ID` = the Site ID from step 1
   - `NETLIFY_BLOBS_TOKEN` = the token from step 2
4. **Redeploy.** Go to **Deploys** and either drag your project
   folder/zip on again, or if you see a **"Trigger deploy"** button, click
   it. Environment variable changes only take effect on the *next* deploy,
   not the current one.

That's it — after the new deploy finishes, adding/editing projects will
work. (If you ever switch to a Git-connected or `netlify deploy` CLI
deploy instead, these two variables aren't needed — Blobs configures
itself automatically in that case.)

## Fixes applied — login/dashboard/project-page reliability pass

If you were seeing "Could not load dashboard" or "Could not load project
page" (or the login form succeeding but bouncing you straight back to the
homepage instead of the dashboard), here's exactly what was wrong and what
was changed:

1. **Express 4 was silently swallowing backend errors.** Every API route is
   an `async` function that reads/writes Netlify Blobs. Express 4 (used
   here) does not automatically forward a rejected promise from an async
   route handler to the error middleware — that only happens in Express 5.
   In practice this meant that any transient Blobs hiccup produced *no
   response at all*: the request just hung until the frontend's fetch timed
   out with a generic, useless error. Every route is now wrapped in
   `netlify/functions/lib/asyncHandler.js`, so failures are always caught,
   logged (`console.error`, visible in Netlify's function logs), and turned
   into a clean JSON error response instead of a silent hang.
2. **The login rate limiter could throw on every request behind Netlify's
   proxy.** `express-rate-limit` needs Express's `trust proxy` setting
   configured when `X-Forwarded-For` is present (which it always is behind
   Netlify). This is now set explicitly (`app.set('trust proxy', 1)`) in
   `netlify/functions/api.js`.
3. **A successful login could still bounce back to the login page.** The
   dashboard's session check (`verify()` in `admin/js/dashboard.js`) used to
   redirect to the homepage on *any* failure — including a transient
   network error or a one-off backend hiccup unrelated to your credentials.
   Now only a genuine 401 (missing/expired/invalid token) redirects to
   login; any other failure shows a "Could not load the dashboard — Retry"
   screen instead, and the fetch itself retries automatically with a
   timeout first.
4. **Nothing protected against getting permanently stuck on the "Verifying
   developer session…" spinner.** Added a global error safety net plus
   optional-chained DOM lookups so a missing element or unexpected script
   error shows a reload prompt instead of an infinite blank spinner.
5. **The public Projects page and a single project's detail page had no
   retry.** Both now retry failed requests automatically (with a timeout)
   and show a manual **Retry** button if it still can't reach the API,
   instead of a dead end.
6. **Backend source was publicly downloadable.** Because `publish = "."`
   serves the whole repo as static files, `netlify/functions/lib/config.js`
   (containing the built-in fallback developer credentials and JWT secret)
   was reachable directly by URL. `netlify.toml` now returns 404 for
   `/netlify/*` and `/backend/*` so the API still runs (it's invoked
   internally, not fetched as a static file) but its source can't be
   browsed to.

None of the application logic (project fields, CRUD, publish/unpublish,
image/video/PDF uploads, the public Projects/Project Details pages) needed
to change — it was already implemented correctly. These were all
reliability/error-handling gaps that could make an otherwise-working system
intermittently look broken. **You still need to actually deploy this to
Netlify (or run `netlify dev`) for `/api/...` to respond at all** — opening
the HTML files directly in a browser, or hosting them on a plain static
file host with no Netlify Functions, will always show "Could not load
dashboard" because there's no backend to talk to in that case.

## What changed (why you were seeing "Could not reach the server")

The original build of this system used a Node/Express server (`/backend`)
that has to run as a long-lived process. Netlify's standard hosting only
serves static files — it doesn't run an Express server — so every `/api/...`
call from the site failed with "Could not reach the server."

That has been fixed by converting the backend into a **Netlify Function**
(`netlify/functions/api.js`), which Netlify does run for you, plus
**Netlify Blobs** for storing project data and uploaded files (replacing the
old local JSON file and local `uploads/` folder, which don't persist on
serverless hosting). Nothing in the frontend needed to change — it already
called relative `/api/...` URLs.

The old `/backend` folder is left in place untouched, in case you ever want
to self-host on a real Node server instead (see "Alternative: real Node
hosting" below). It is **not** used by the Netlify deployment.

## How it's wired up now

- **`netlify/functions/api.js`** — one serverless function implementing the
  whole API (login, project CRUD, file uploads, public project listing).
- **`netlify.toml`** — redirects `/api/*` (and `/uploads/*`) to that
  function, and tells Netlify where the function code lives.
- **Netlify Blobs** — two stores, created automatically the first time
  they're written to:
  - `ylf-projects` — the project catalogue (replaces `projects.json`)
  - `ylf-uploads` — uploaded images/videos/PDFs (replaces the `uploads/`
    folder)
- **Floating developer icon** (bottom-right, subtle until hovered) on
  `index.html` and `projects.html`. Clicking it opens a login modal.
  Credentials are checked only on the server, against Netlify environment
  variables — nothing sensitive ships in the frontend code.
- **`/admin/dashboard.html`** — the Project Management Dashboard (stats,
  drag-to-reorder table, add/edit form, image/video/PDF uploader, autosave).
- **`projects.html`** / **`project-details.html`** — the public, live
  project listing and detail pages, pulling from the same API.

## Zero-config login (no environment variables required)

The developer login now works immediately after deploying, with no Netlify
environment variables to set up. There's no username — just a single
developer code — and its working default is built into
`netlify/functions/lib/config.js`:

- **Developer Code:** `Swaroop@yenlee123`

If you'd like to change the code or use your own secret later, you can
still set `DEV_CODE` and `JWT_SECRET` as Netlify environment variables and
redeploy — they override the built-in default automatically. This is
optional, not required.

## Adding new content from the public site — `/admin/submit.html`

Each of the three public listing pages has a floating "+" button (bottom-left)
that asks only for the developer code — no username, no password, no
sign-in form — and then sends you to the new **unified submission page**,
`/admin/submit.html`. Entering the code once keeps you signed in (session
token) for the rest of the developer console, including the full dashboard.

`/admin/submit.html` replaces the old separate `add-product.html` /
`add-service.html` / project-only dashboard flow with a single guided form:

1. **Select Submission Type** — the page always opens on a "What would you
   like to submit?" screen with three cards: **Product**, **Project**,
   **Service**. (If you arrived via the "+" button on `products.html`,
   `projects.html` or `services.html`, the matching card is marked
   "Suggested", but nothing is auto-selected — you still choose it
   yourself. Nothing about image cropping is shown at this stage.)
2. **Basic Details** — company name (required), title (required), category
   (required), full address (optional), a map location picker/search
   (optional — search a place or click the map to drop a pin; it's built on
   OpenStreetMap so it needs no API key, and automatically generates a
   standard Google Maps link that's saved with the submission), and a
   detailed description (required).
3. **Timeline** — estimated number of work days, start date, and completion
   date, all optional. For projects, the status (Completed / Ongoing /
   Upcoming) is worked out automatically from the dates.
4. **Images** — drag-and-drop or click-to-browse, multiple images at once,
   with thumbnail previews, drag-to-reorder, a remove button, and a crop
   button. **The crop tool never opens automatically** — it only appears
   when you click the crop icon on a thumbnail you've already uploaded.
5. **Review & Submit** — a full summary of everything entered, then either
   **Submit** (saves and publishes immediately, same as before) or
   **Save Draft** (saves with `isPublished: false` so it can be reviewed and
   published later from the full dashboard). Required fields are validated
   before you can move on, and a lightweight local autosave offers to
   restore unfinished details if you leave and come back.

Reach it directly at `yoursite.com/admin/submit.html`, or via the "+"
button on the Products, Projects, or Services page → enter the developer
code.

The old `/admin/add-product.html` and `/admin/add-service.html` pages are
still present and still work (same developer-code gate, same auto-publish
behaviour) if you'd rather use the simpler single-purpose forms, but the
"+" button and this guide now point at `/admin/submit.html` as the main way
in. Products and services created either way — and now with company name,
address, map link, and timeline fields too — appear the same way in the
full dashboard and on the public pages.

## Deploying to Netlify

1. Push this whole folder to a GitHub/GitLab/Bitbucket repo (or drag-and-drop
   deploy, but Git-based deploys are easier to redeploy after env var
   changes).
2. On Netlify: **Add new site → Import an existing project**, connect the
   repo. Build settings are already defined in `netlify.toml` — you don't
   need to change anything in the UI (build command `npm install`, publish
   directory `.`, functions directory `netlify/functions`).
3. **Enable Blobs**: nothing to do — Netlify Blobs is available automatically
   on every Netlify site, no add-on or extra setup required.
4. Add environment variables — **Site configuration → Environment
   variables** — using the values from `.env.example`:
   - `DEV_CODE=Swaroop@yenlee123`
   - `JWT_SECRET=` *(generate a real random string — see below)*
   - `JWT_EXPIRES_IN=8h`
   - `ALLOWED_ORIGINS=https://your-real-domain.com` *(your Netlify URL or
     custom domain; you can leave this blank while testing)*
   - `MAX_UPLOAD_MB=8` *(see the upload size note below)*
5. Trigger a deploy (or redeploy — env vars only apply after a redeploy).
6. Visit your site, click the "+" button on the Projects, Services or
   Products page, and enter the developer code.

Generate a strong `JWT_SECRET` locally:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### Running locally to test first

```bash
npm install -g netlify-cli   # if you don't have it already
npm install
netlify link                 # connect this folder to your Netlify site
cp .env.example .env         # fill in real values
netlify dev
```

`netlify dev` runs the static site and the function together (with working
Netlify Blobs) at `http://localhost:8888/`. Open
`http://localhost:8888/admin/dashboard.html` for the dashboard.

## Logging in

Click the small "+" button in the bottom-left corner of the Projects,
Services, or Products page. Enter:

- **Developer Code:** `Swaroop@yenlee123`

This lives only as a Netlify environment variable (`DEV_CODE`) — change it
any time in **Site configuration → Environment variables** without touching
any frontend code (redeploy after changing).

## A note on upload size

Netlify Functions receive the whole request as one payload rather than a
stream, which caps how large a single upload can be — noticeably smaller
than what a dedicated Node server allows. `MAX_UPLOAD_MB` defaults to `8`.
If a specific video or PDF is too large:

- Compress/resize it before uploading, or
- Host large videos externally (e.g. YouTube/Vimeo unlisted, or a storage
  bucket) and paste the link instead of uploading the file directly, or
- Move to the "real Node hosting" option below, which doesn't have this
  limit.

## Adding the "+" quick-add button to more pages

The button is wired up on `projects.html`, `services.html` and
`products.html`. To add it to any other page, add these lines:

```html
<!-- in <head> -->
<link rel="stylesheet" href="css/quick-add.css">

<!-- on <body>, pick one -->
<body data-quick-add="project">
<body data-quick-add="service">
<body data-quick-add="product">

<!-- just before </body> -->
<script src="js/quick-add.js"></script>
```

## A note on "hidden from visitors"

The button is real HTML sitting on the page (that's how it's clickable), so a
technical visitor could find it by viewing page source — no static frontend
can truly hide something from someone who inspects the code. What actually
protects the dashboard is the backend: without the correct developer code
(known only to you, stored only as a Netlify environment variable), no one
can add/edit content, view drafts, or reach any `/api/admin/*` endpoint.

## Alternative: real Node hosting

If you'd rather run the original Express server (e.g. no upload-size limit,
a real filesystem) instead of Netlify Functions, the untouched `/backend`
folder still works standalone on any Node host (Render, Railway, a VPS,
etc.) — see the comments in `backend/server.js` and `backend/.env.example`.
In that case you would **not** deploy to Netlify's static hosting for this
site; the Node server serves the static files itself. This is a separate
path from the Netlify deployment described above — don't mix the two.

## Data storage note

Project data lives in the Netlify Blobs store `ylf-projects`, and uploaded
files live in `ylf-uploads`. Both are managed entirely by Netlify — no
external database or storage bucket to set up. All reads/writes go through
`netlify/functions/lib/db.js` and `netlify/functions/lib/upload.js`, so you
can swap in a different backing store later without touching route logic.

## What's next

This build covers the **Projects** module end-to-end: dashboard, form,
uploads, public listing, detail pages. Services and Products can be added
the same way — same auth, same upload pipeline, same dashboard shell, just
new data shapes and new public pages.
