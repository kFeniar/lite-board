# lite — Creative Direction Board
The Kokumi · workshop instrument · 1 October 2026

## Setup (once)

1. Open `config.js`
2. Paste your Apps Script `/exec` URL into `endpoint`
3. Push this folder to a GitHub repo
4. Repo → Settings → Pages → Source: `main` / root

Two links come out of it:

| Link | Who |
|---|---|
| `https://<you>.github.io/<repo>/` | the five participants |
| `https://<you>.github.io/<repo>/host.html` | you, on a second screen |

## Running the session

You pace it verbally. The board does not sync — fewer things to break.

1. Send everyone the participant link
2. They enter name + role, then work block by block
3. Say *"Block 3, five minutes"* — they answer and hit Submit
4. On `host.html`, hit **Refresh**, then screen-share the reveal
5. At the end, **Export brief** downloads the whole thing as text

Blocks 1 and 5 are *collect only* — facts, no reveal, keep moving.
Blocks 2, 3, 4 and 6 are *reveal* — where the disagreement is the finding.

## Swapping the Block 6 images

Make an `img` folder, drop in three files, and list them in `config.js`:

```js
images: ["img/01.jpg", "img/02.jpg", "img/03.jpg"]
```

Leave it empty and the built-in compositions are used.

## If Google stalls mid-session

Every answer saves in the browser as it is typed. The Submit button
turns to *Try again* and retries. Nobody loses anything. Worst case,
each person hits **Download my answers** on the last screen.

## Files

| | |
|---|---|
| `index.html` | participant board |
| `host.html` | host dashboard |
| `config.js` | the only file you edit |
| `data.js` | the 28 questions |
| `app.js` · `host.js` · `thko.css` | engine |
| `apps-script.gs` | already pasted into your Sheet; kept for reference |
