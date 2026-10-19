# Richards Family Archive

A private website where the family can browse the Richards photos and home movies in order.

- **Home** lays every decade out on one dark table around the title. Slide along the timeline to light up a year, click a decade to zoom in.
- **Decades** are tables you can drag and zoom, with one cluster of prints per year.
- **Years** show each event's photos in rows. Home movies play in an 8mm film frame, with chapters, captions and the photos taken that day.
- **Prints grow under the pointer.** Clicking one brings it closer: it lifts off the page and comes toward you while the page stays behind it, softly blurred. From there you can move through the other prints on the page, turn the print over to read the back, or save it to favorites. Click it again (or beside it, or scroll) and it goes back to its place.
- **Play** turns a year, a decade or your favorites into a slideshow: one print at a time, slowly drifting closer, with its date and caption.
- **Search** covers names, places, events and years.
- **On iPhone** the home page is one long collage, with a dock at the bottom that jumps between decades. A tapped photo comes up above a sheet with its details and buttons to save, turn over or share it. The site can also be added to the Home Screen like an app.

Everything in `site/` right now is **test content**: placeholder photos and a short placeholder film. Replace it with the real scans using the steps below.

## Look at it on your computer

You need [Node.js](https://nodejs.org) (version 18 or newer).

```sh
cd richards-family-archive
npm install
npm run serve        # then open http://localhost:8080
```

You can also open `site/index.html` directly. Everything works except the film captions, which need a web server.

## Put it online

The `site` folder is the whole website. It is plain HTML, CSS, JavaScript and images, so any static host works.

- **Netlify Drop** is the quickest. Open <https://app.netlify.com/drop> and drag the `site` folder onto the page. You get a link like `https://richards-archive.netlify.app` in about a minute. To update it later, drag the folder onto the site's Deploys page.
- **Cloudflare Pages** is the best choice if you also want it private (see below). Go to Workers & Pages → Create → Pages → *Upload assets* and upload the `site` folder.
- **GitHub Pages** only serves from a repository's root or `/docs` folder. Copy the contents of `site/` into one of those, or use Netlify or Cloudflare instead.

### On a phone

On iPhone, open the site in Safari, tap the Share button, then **Add to Home Screen**. It opens full screen with its own icon, like an app. The bottom of the phone home page shows the same tip. Android phones offer an **Add to Home Screen** button there instead.

The icon and name come from `site/manifest.json` and the images in `site/icons/`.

### Keep it private

The site tells search engines not to index it, but anyone who has the link can still open it. Photos of children should not be left that open. The simplest real lock is **Cloudflare Access**, which is free for up to 50 people:

1. Host the site on Cloudflare Pages.
2. In Cloudflare Zero Trust, add an Access application for the site's address.
3. Add a policy that allows the relatives' email addresses.

Each relative then signs in with a one-time code sent to their email. Netlify's password protection also works, but it needs a paid plan.

## Add the real scans

1. Put the scans in a folder. Name each file with its year, like `1976-lake-dock.jpg`, or list the details in a spreadsheet saved as `photos.csv`:

   | file | year | date | title | place | event | back |
   |---|---|---|---|---|---|---|
   | IMG_0042.jpg | 1976 | July 1976 | Cannonball! | The lake cabin | Summer at the lake | Everybody in! – July '76 |

   Only `file` and `year` are required. Photos that share an `event` are grouped together on their year's page. `back` is what is written on the back of the print; it shows when someone turns the print over.

2. Install Pillow once (`python3 -m pip install pillow`), then run:

   ```sh
   python3 tools/add_scans.py ~/Scans/Richards --csv ~/Scans/Richards/photos.csv --replace-samples
   ```

   Use `--replace-samples` the first time only. It removes the sample photos, the sample film and the "Sample imagery" labels. Later batches leave it off and are added to what is already there.

3. Check the result with `npm run serve`, then upload the `site` folder again.

The script makes two WebP files per photo in `site/photos/`: a 1600px large version for photos brought closer and slideshows, and a 560px thumbnail. It also writes the photo's entry in `site/data/archive.js`.

### What's in `site/data/archive.js`

The file holds all the content and can be edited by hand.

| Field | What it holds |
|---|---|
| `photos[]` | `id`, `year`, `date` (as it should read), `approx` (true when the date is a guess), `title`, `place`, `event` (an event id or `null`), `back`, `w`/`h` (pixel size), `src`/`thumb` (file paths), `lqip` (tiny blurred preview), `tone` (average colour), `bw` (black-and-white print) |
| `events[]` | `id`, `year`, `title`, `date`, `place`, `description`, shown as sections on the year page |
| `decades[]` | One `tagline` per decade, shown under "The 1970s." |
| `featured` | Optional. The three photo ids that stand for each year in the decade view, e.g. `"1976": ["a", "b", "c"]` |
| `hero` | Optional. Twelve photo ids for the iPhone home collage |
| `movies[]` | Home movies (see below) |
| `sample` | `true` shows the "Sample imagery" labels |

### Home movies

Convert each tape or reel to MP4, make a poster frame, then add a `movies` entry. Copy the sample entry as a template.

```sh
ffmpeg -i tape01.mov -vf "scale=-2:720" -c:v libx264 -crf 23 -preset slow -c:a aac -b:a 128k -movflags +faststart site/media/tape01.mp4
ffmpeg -ss 5 -i site/media/tape01.mp4 -frames:v 1 site/media/tape01-poster.webp
```

A movie entry has these fields:

- `id`, `title`, `date`, `year`, `event`, `description`, `duration` (seconds), `format` (e.g. "8mm film")
- `src` (the MP4) and, optionally, `webm`
- `poster`
- `captions`: a `.vtt` file, optional. You can also write the captions straight into the entry as `cues`: `[{ "start": 2, "end": 7, "text": "Here we go." }]`. The player uses `cues` first, and they work even when the site is opened from disk.
- `chapters`: `{ title, start, thumb }` for each chapter
- `photos`: ids of photos taken the same day

## Change the look or the code

- The source is in `src/`: `index.html`, `styles.css`, and `js/`.
  - The views are in `js/views/`.
  - Bringing a photo closer, the slideshow and search are in `js/overlays/` (`closer.js`, `story.js`, `search.js`).
  - Layouts, the camera, gestures and animation helpers are in `js/`.
- `npm run build` bundles everything into `site/app.js`, `site/styles.css` and `site/index.html`.
- `npm run serve` rebuilds every time you save.

Colours and fonts are set at the top of `styles.css`. On desktop, the home table has a place for each decade from the 1940s to the 2020s. To add another decade, such as earlier Arant family photos, add an entry to `ZONES` in `src/js/layout.js`. Decade pages, year pages and search work for any year without changes.

### Motion

Most of the movement lives in three places:

- `src/js/motion.js` holds the effects:
  - prints grow under the pointer, springing up a little past their size and settling, then tilt toward it with light moving across the paper
  - round buttons lean toward the pointer
  - saving a photo sends up a burst of hearts
  - headings rise in word by word
  - year numbers roll like an odometer
  - counts tick up
- `src/js/overlays/closer.js` moves a photo brought closer on springs, so it can be grabbed, flung to the next photo or put back mid-flight without a jolt. When it is put back, the page scrolls (or the table pans) to its place if needed and the photo lands there.
- `src/js/overlays/story.js` plays the slideshows.
- `src/js/scroll.js` smooths mouse-wheel scrolling on desktop with [Lenis](https://github.com/darkroomengineering/lenis). Phones keep their own scrolling.
- The "Motion" section of `styles.css` covers the rest:
  - prints are dealt in as they scroll into view
  - photos drift inside their frames as the page scrolls (desktop, in browsers with CSS scroll-driven animations)
  - the home table slowly breathes
  - film sprockets run while a movie plays

Everything is calmed down for anyone who has turned on "reduce motion".

## Using the site

| | |
|---|---|
| `/` or Ctrl/⌘ K | Search |
| ← → | Next or previous photo when one is brought closer, or in a slideshow. On a year page, the next or previous year. On a decade page, moves the highlight. |
| F | Turn the photo over |
| H | Save the photo to favorites |
| Esc | Put the photo back, or close a slideshow, search or film |
| Space | Pause or play a slideshow |
| + − 0 | Zoom the decade table in, out, or back to fit |
| Space or K, J/L, M, C | Film: play or pause, back or forward 10 seconds, mute, captions |

- On a phone, swipe a photo sideways for the next one, swipe it down to put it back, and double-tap or pinch to zoom.
- In a slideshow, tap the right side for the next photo and the left side for the one before. Hold a finger down to pause, and swipe down to stop.
- Every photo has its own link, such as `#/1970s/1976/m12`. Opening it goes to that year and brings the photo closer. On a phone, the Share button sends the photo itself, or this link where a phone can't share files.
- Favorites are kept in each person's browser. They are not shared with anyone else.
- If someone has turned on "reduce motion", the site keeps its animations short.

Works in current Safari (iOS 15 and later), Chrome, Edge and Firefox.
