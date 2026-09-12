# Trivia Trek — Battle of Knowledge

A quiz battle game for kids aged 8–15. Every hero on your roster rides out for one question:
a right answer wins the clash, a wrong answer costs you that hero. 150 questions, three campaigns,
a war map with five forts, battle sound effects, and it works on phones.

This folder is the whole web app. There is no build step, no server code and no database —
just static files. Put them on any web host and it works.

## Files

| File | What it is |
|---|---|
| `index.html` | The page itself |
| `manifest.webmanifest` | App name, colours and icons (makes it installable) |
| `sw.js` | Service worker — caches the game so it plays offline |
| `tt-style.css` | All styling |
| `tt-questions.js` | The 150-question bank (50 per campaign) |
| `tt-heroes.js` | The 12 heroes and their painted portraits |
| `tt-audio.js` | Sound effects (generated in code, no audio files) |
| `tt-field.js` | Battlefield terrain and the render loop |
| `tt-troops.js` | Cavalry, spear squads and battle choreography |
| `tt-game.js` | Game flow: campaigns, questions, war map, results |
| `icons/` | App icons for phone home screens and browser tabs |

Keep every file together in the same folder — the paths are all relative.

## Putting it online (pick one)

All of these are free and take a few minutes. The app needs **HTTPS** for install and offline
to work; every option below gives you HTTPS automatically.

**Netlify Drop — easiest, no account needed to start**
1. Go to `app.netlify.com/drop`
2. Drag this whole folder onto the page
3. You get a link like `your-name.netlify.app` straight away

**Cloudflare Pages**
1. Sign in at `dash.cloudflare.com` → Workers & Pages → Create → Pages → Upload assets
2. Upload this folder, publish

**GitHub Pages**
1. Create a repository and upload these files to the root
2. Settings → Pages → Source: Deploy from branch → `main` / root
3. The site appears at `your-name.github.io/your-repo/`

**Hugging Face Spaces** (you already use Spaces)
1. New Space → SDK: **Static**
2. Upload these files to the root of the Space
3. It serves `index.html` automatically

## Testing it on your own computer first

Opening `index.html` directly with a double-click mostly works, but offline mode and install
need a real server. Run one in this folder:

```
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Installing it on a phone

Once it's online, open the link on the phone:

- **Android / Chrome:** tap the "Install app" button in the corner, or the menu → *Add to Home screen*
- **iPhone / Safari:** Share → *Add to Home Screen*

It then opens full-screen with its own icon, and plays with no internet connection.

## Changing the game

- **Questions:** edit `tt-questions.js`. Each one looks like
  `{c:"Science", q:"...", a:["A","B","C","D"], k:1, fact:"..."}` where `k` is the index of the
  correct answer (0 = first). Add as many as you like — the game picks them at random and doesn't
  repeat a question until the whole campaign pool has been used.
- **Heroes:** edit the list at the top of `tt-heroes.js` — name, title, faction, stars, colours,
  hairstyle and weapon. Add a hero and they join the roster pool.
- **Difficulty:** the `CAMPAIGNS` list at the top of `tt-game.js` sets how many heroes ride out
  (which is also how many questions a battle has), points per win and seconds per question.
- **Sounds:** `tt-audio.js`. Every sound is made with the Web Audio API, so there are no files
  to replace — change the numbers to change the sound.

## After you change something

The service worker caches the old files. Bump the version at the top of `sw.js`
(`var CACHE = "trivia-trek-v1"` → `"trivia-trek-v2"`) so players get the update.
