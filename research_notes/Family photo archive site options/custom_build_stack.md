# Custom-Built Family Photo + Home-Video Archive: Technology Stack and Monthly Costs (October 2026)

Research date: 2026-10-18. **How this was verified:** This environment's egress proxy blocked direct access to vendor sites (cloudflare.com, mux.com, bunny.net, backblaze.com, arxiv.org, wikipedia.org, and others). The shared web-search budget also ran out partway through. Verification therefore rests on these sources: (a) official documentation *source files* read directly from the vendors' public GitHub docs repos on 2026-10-18 (Cloudflare `cloudflare-docs` production branch, Astro, SvelteKit, Eleventy, Next.js, GitHub Docs, Supabase), cited below by their canonical doc URLs; (b) live npm-registry and PyPI metadata for versions, licenses and publish dates; (c) project READMEs and LICENSE files on GitHub; (d) Anthropic's bundled API reference (pricing cached 2026-10-06); and (e) web-search summaries of official vendor pages for Bunny, Mux, Backblaze, Netlify, Vercel and Cloudflare Zero Trust, which are less reliable than (a) through (d). Anything marked **UNVERIFIED** was not confirmed as current in this session.

Working assumptions for cost math (used in the estimates below): 5,000 scanned photos; masters 25–250 GB (5–50 MB each); web derivatives about 10 GB; 40 hours of video (2,400 minutes) with about 40 GB of web renditions; about 40 family viewers; about 45 GB a month delivered. These sizes are my estimates, not sourced figures.

## 1. Site framework: static vs. dynamic (Astro, Next.js, SvelteKit, Eleventy), and how each handles thousands of images

### Takeaway
Use a static-first site (Astro, or SvelteKit with static output) that reads a JSON manifest of pre-processed media from object storage, with a small API for the interactive features. Every framework's built-in build-time image processing works, but none scales well to thousands of large scans inside a hosted build. Hosting limits make this worse: Cloudflare Pages allows 20 minutes per build and 20,000 files per site on Free. Next.js loses its default image optimizer in static export and will not forward auth headers to protected images.

### Cited Findings
- **Current versions (npm, Oct 2026), all MIT:**
  - astro 7.4.0 (published 2026-10-15) — [npm](https://www.npmjs.com/package/astro)
  - next 16.4.2 (2026-10-15) — [npm](https://www.npmjs.com/package/next)
  - @sveltejs/kit 3.1.0 (2026-10-14) — [npm](https://www.npmjs.com/package/@sveltejs/kit)
  - @sveltejs/enhanced-img 1.0.0 (2026-10-01) — [npm](https://www.npmjs.com/package/@sveltejs/enhanced-img)
  - @11ty/eleventy 3.1.7 (2026-10-15) — [npm](https://www.npmjs.com/package/@11ty/eleventy)
  - @11ty/eleventy-img 7.0.0 (2026-07-29) — [npm](https://www.npmjs.com/package/@11ty/eleventy-img)
- **Astro:**
  - `<Image />` and `<Picture />` transform images at build time for prerendered pages, and on the fly when a page is rendered on demand. For prerendered pages this "may increase the build time of your project, especially if you have a large number of images." On-demand rendering avoids the build cost "but may increase the number of image transformations… Depending on your image service this may incur additional costs." — [Astro Images guide](https://docs.astro.build/en/guides/images/)
  - Sharp is the default image service. Processed images are cached in `./node_modules/.astro` (configurable via `cacheDir`) and reused between builds. Remote images are processed only from authorized sources. — [Astro Images guide](https://docs.astro.build/en/guides/images/)
  - On adapters that don't support Sharp (Cloudflare is the example given), you configure `passthroughImageService()`, and Astro then does no transformation. — [Astro Images guide](https://docs.astro.build/en/guides/images/)
  - Astro has "no native video support" and recommends a hosted video service. ImageKit offers an Astro integration that routes `<Image />` and `<Picture />` through ImageKit (AVIF/WebP, srcset, on-the-fly transforms). — [Astro Images guide](https://docs.astro.build/en/guides/images/)
- **SvelteKit:** `@sveltejs/enhanced-img` generates AVIF/WebP at multiple sizes and sets intrinsic width and height.
  - It is a build plugin that "can only optimize files located on your machine during the build process." For images served from a database or CMS, the docs point to a CDN instead.
  - The first build is slow; output is cached in `./node_modules/.cache/imagetools`. Collections can be imported via `import.meta.glob` with `?enhanced`.
  - Source: [SvelteKit Images docs](https://svelte.dev/docs/kit/images)
- **Eleventy Image:**
  - Does build-time transforms with sharp and outputs jpeg, png, webp, avif and svg; AVIF is flagged "+1 Build Cost".
  - De-duplicates with in-memory and disk caches. During `--serve` it processes images on request.
  - An HTML transform can rewrite any `<img>`. Build cost is driven by remote images, then by the number of formats, then the number of widths.
  - Source: [Eleventy Image docs](https://www.11ty.dev/docs/plugins/image/)
- **Next.js:**
  - In static export, `next/image` works only with a custom `loader` (for example, Cloudinary). The default loader is listed under "Unsupported Features." — [Next.js static exports](https://nextjs.org/docs/app/guides/static-exports)
  - The default optimizer "will not forward headers when fetching the src image. If the src image requires authentication, consider using the unoptimized property." The default `formats` is `['image/webp']` with AVIF opt-in, each format is cached separately, and the default `minimumCacheTTL` is 14,400 s (4 h). — [next/image reference](https://nextjs.org/docs/app/api-reference/components/image)
- **Cloudflare Pages limits (Free):**
  - 500 builds a month, 1 concurrent build, 20-minute build timeout.
  - Up to 20,000 files per site; paid plans allow 100,000 with `PAGES_WRANGLER_MAJOR_VERSION=4`.
  - 25 MiB maximum per file; Cloudflare says to put larger files in R2.
  - Source: [Cloudflare Pages limits](https://developers.cloudflare.com/pages/platform/limits/)
- **Workers Static Assets:** 20,000 files per Worker version on Free and 100,000 on Paid, 25 MiB per file — [Workers limits](https://developers.cloudflare.com/workers/platform/limits/). "Requests to static assets are free and unlimited." — [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/)

### Inferences
- 5,000 photos × 3 widths × 2 formats = 30,000 derivative files, which exceeds the 20,000-file Free limit. Derivatives should live in R2 (or an image CDN), not in the deploy bundle.
- Running sharp over 25–250 GB of masters inside a 20-minute hosted build is not viable. Do media processing in a separate, incremental ingest step (owner's computer or a dedicated job). That step uploads to R2 and writes a JSON manifest (id, EDTF date, width/height, thumbhash, derivative URLs, people, places). The site build then only reads JSON and stays fast.
- **Framework choice:**
  - **Astro:** the best default. Static by default, with "islands" for interactive React/Svelte/vanilla widgets (timeline, lightbox, map, 3D).
  - **SvelteKit:** equally capable, and better if the site grows into an app (heavy client state, editing UIs).
  - **Eleventy:** the simplest, but you hand-roll the interactivity.
  - **Next.js:** fine with Vercel or a server. In static export you write a custom loader pointing at pre-generated R2 derivatives or Cloudflare Images anyway, and auth-protected images bypass its optimizer.
- **Static vs. dynamic:** go hybrid. Static pages serve the archive (cheap, fast, nothing to pause or cold-start); a small authenticated API (Workers + D1, or Supabase) handles comments, suggestions and uploads.

### Gaps
- No independent benchmark of build times at 5,000+ images per framework was found (search budget exhausted).
- Astro content-collection loader behavior with large JSON manifests was not verified.

## 2. Image pipeline: sharp/libvips, AVIF and WebP, responsive srcset, blurhash/thumbhash, build-time vs. on-the-fly

### Takeaway
Pre-generate derivatives once at ingest with sharp (libvips): AVIF and WebP (or a JPEG fallback) at about 4 widths, each with a ThumbHash placeholder string, stored in R2 under immutable keys and served via `<picture>` with `srcset`/`sizes`. On-the-fly transformation (Cloudflare Images from R2) is a valid low-effort alternative. At this scale it costs single-digit dollars a month, but it needs the Paid plan once more than 5,000 unique size variants are requested in a month.

### Cited Findings
- **sharp:** converts large images to "JPEG, PNG, WebP, GIF and AVIF." Resizing is "typically 4x-5x faster than using the quickest ImageMagick and GraphicsMagick settings due to its use of libvips." It handles ICC profiles and alpha, and uses Lanczos resampling. It requires Node-API v9 (Node ≥ 20.9.0, Deno, Bun). — [sharp README](https://github.com/lovell/sharp). Latest is 0.35.5, Apache-2.0, published 2026-09-27. — [npm](https://www.npmjs.com/package/sharp)
- **pyvips** (Python libvips binding) 3.2.0, MIT, 2026-08-29. — [PyPI](https://pypi.org/project/pyvips/)
- **ThumbHash vs. BlurHash:** ThumbHash "encodes more detail in the same space," also encodes aspect ratio, gives more accurate colors and supports alpha. Its drawback is that parameters are not configurable. Implementations exist for JS, Rust, Swift and Java. — [ThumbHash README](https://github.com/evanw/thumbhash)
  - npm `thumbhash` 0.1.1, MIT, last published 2023-03-22 — [npm](https://www.npmjs.com/package/thumbhash)
  - npm `blurhash` 2.0.5, MIT, 2023-02-17 — [npm](https://www.npmjs.com/package/blurhash)
- **Encode cost:** AVIF is "more costly than other image formats" to generate. — [Eleventy Image docs](https://www.11ty.dev/docs/plugins/image/)
- **Next.js caching:** caches each format separately, so AVIF plus WebP means more storage. — [next/image reference](https://nextjs.org/docs/app/api-reference/components/image)
- **Cloudflare Images Free plan:** up to 5,000 unique transformations a month. Beyond that, cached transformations keep working but "New transformations will return a 9422 error," with no charge. — [Cloudflare Images pricing](https://developers.cloudflare.com/images/pricing/)
- **Cloudflare Images Paid plan:**
  - First 5,000 unique transformations included, then $0.50 per 1,000 a month. Uniqueness is counted per calendar month, and `format=auto` serving AVIF to some users and WebP to others counts as one transformation.
  - Images stored in Images cost $5 per 100,000 a month; delivery costs $1 per 100,000.
  - Cloudflare's own example: 5,000 images (5 MB average) in R2, with 2,000 served in 5 sizes, costs **$2.72 a month** ($0.22 storage + $2.50 transformations).
  - Source: [Cloudflare Images pricing](https://developers.cloudflare.com/images/pricing/)

### Inferences
- **Recommended pipeline:**
  - (1) Auto-orient, crop and rotate; convert to sRGB.
  - (2) Write AVIF and WebP at about 320, 640, 1280 and 2048 px on the long edge.
  - (3) Compute a ThumbHash from a ~100 px version and store it in the manifest.
  - (4) Write content-hashed object keys with `Cache-Control: immutable`.
  - (5) Strip EXIF/GPS from derivatives.
  - (6) Keep masters (TIFF or high-quality JPEG) untouched in separate cold storage. Derivatives can be regenerated from them.
- Build-time framework image components (Astro/SvelteKit/Eleventy) are good for the site's own artwork, not for the archive itself.
- **On-the-fly option:** about 5,000 photos × 4 sizes = 20,000 unique transformations when the whole archive is browsed in a month. That is (20,000 − 5,000) / 1,000 × $0.50 = **about $7.50 in a heavy month**, and $0 to a few dollars in typical months. The Free plan would start returning 9422 errors for new sizes, so Paid is needed.

### Gaps
- AVIF-vs-WebP file-size savings for scanned prints were not benchmarked here.
- The recommended widths and quality settings are my suggestions, not sourced.
- Cloudinary and ImageKit free-tier limits could not be verified (vendor sites blocked; search budget exhausted).

## 3. Media hosting and CDN pricing, with a monthly estimate for the assumed size

### Takeaway
Cloudflare R2 (no egress fees, 10 GB-month free) is the cheapest primary store for both web derivatives and self-encoded HLS video. The whole archive runs about **$1–5 a month** on R2. Managed video adds cost:
- Cloudflare Stream: about $17 a month for 40 hours
- Mux: about $2–6 a month
- Bunny Stream: about $1–2 a month

Backblaze B2 ($6.95/TB-month) or R2 Infrequent Access suits the large masters.

### Cited Findings
- **Cloudflare R2 (official docs):**
  - Standard storage $0.015/GB-month; Class A operations $4.50 per million; Class B $0.36 per million; egress free.
  - Infrequent Access: $0.01/GB-month, Class A $9.00 per million, Class B $0.90 per million, $0.01/GB data retrieval, 30-day minimum storage duration.
  - Free tier (Standard only): 10 GB-month storage, 1 million Class A and 10 million Class B operations a month.
  - Usage rounds up to the next billing unit.
  - Egress via the Workers API, S3 API and r2.dev "does not incur data transfer (egress) charges."
  - Source: [R2 pricing](https://developers.cloudflare.com/r2/pricing/)
- **R2 public access:** Custom domains enable Cloudflare Cache; the docs recommend Smart Tiered Cache. Only certain file types are cached by default, so a Cache Everything rule is needed to cache everything. — [R2 public buckets](https://developers.cloudflare.com/r2/buckets/public-buckets/)
- **Cloudflare Stream:**
  - Bills only minutes stored (prepaid, "$5 per month for each 1,000 minutes") and minutes delivered ("$1 per 1,000 minutes"). Ingress and encoding are free; bandwidth is included.
  - Storage is counted by duration, not file size; maximum file size is 30 GB.
  - Web playback rounds to 4-second segments, and preloading/buffering counts as delivery.
  - Source: [Stream pricing](https://developers.cloudflare.com/stream/pricing/)
- **Mux (web-search summary of Mux docs; treat as moderately reliable):**
  - Free plan launched 2025-05-01: up to 10 on-demand video assets and 100,000 delivery minutes a month, including Mux Player and auto-generated captions, no credit card. — [Mux changelog](https://www.mux.com/docs/changelog/starter-plan-improvements-may-2025); [Mux free-plan changelog](https://support-agent.mux.com/docs/changelog/video-free-plan)
  - Basic-quality storage for the first 50,000 min/month: $0.0024/min (≤720p), $0.003 (1080p), $0.0048 (1440p), $0.0096 (4K).
  - The first 100,000 delivered minutes each month are free; after that, $0.0008/min (720p) and $0.001/min (1080p).
  - Cold-storage discounts: 720p storage drops to $0.00144/min after 30 days without views and $0.00096 after 90 days.
  - Input is free for basic quality.
  - Source: [Mux pricing overview](https://www.mux.com/docs/pricing/overview); [Mux pricing](https://www.mux.com/pricing)
  - Conflict: an older support-docs copy lists different delivery tiers and caps basic at 1080p. — [Mux pricing.txt](https://support-agent.mux.com/docs/pricing.txt)
- **Mux paid tiers (third-party trackers, UNVERIFIED):** "Launch" at $20/month buys $100 of credits; "Scale" at $500/month buys $1,000. — [frontdeskreview](https://frontdeskreview.com/software/video-api/mux/); [agentdeals](https://agentdeals.dev/vendor/mux)
- **Bunny.net (web-search summary of bunny.net pages):**
  - **CDN:** Standard network $0.01/GB in Europe and North America, $0.03 Asia/Oceania, $0.045 South America, $0.06 Middle East/Africa. Volume network $0.005/GB for the first 500 TB. — [Bunny CDN pricing](https://bunny.net/pricing/cdn/)
  - **Storage:** Standard HDD $0.01/GB for the first region plus $0.005/GB per extra region; Edge SSD $0.02/GB per region. $1 monthly minimum; traffic from Storage to the CDN is free. — [Bunny Storage pricing](https://bunny.net/pricing/storage/)
  - **Stream:** encoding is free. Storage is billed on all encoded renditions (each enabled resolution adds to the total), at $0.01/GB in the default Frankfurt region. Delivery is billed at CDN rates, subject to a $1 minimum. — [Bunny Stream pricing docs](https://bunny.net/docs/stream/pricing); [Bunny Stream pricing](https://bunny.net/pricing/stream/)
- **Backblaze B2 (web-search summary of backblaze.com):**
  - $6.95/TB-month pay-as-you-go.
  - Free egress up to 3× average monthly storage, then $0.01/GB; unlimited free egress through partner CDNs and compute providers (Cloudflare, Fastly and Vultr are named).
  - B2 Overdrive from $15/TB.
  - A Backblaze blog post citing $6/TB is outdated.
  - Source: [B2 pricing](https://www.backblaze.com/cloud-storage/pricing)

### Inferences
- **Monthly estimates for the assumed size** (my arithmetic from the cited unit prices):
  - **R2, web derivatives and self-encoded HLS only (about 50 GB):** (50 − 10 free) × $0.015 = **$0.60 a month**. Operations (photo and HLS-segment GETs: about 100k–200k a month for 40 viewers) fit in the 10 million free Class B ops. Egress is $0.
  - **Adding 250 GB of masters:**

    | Masters stored in | Monthly cost |
    | --- | --- |
    | R2 Standard (300 GB total) | about $4.35 |
    | R2 Infrequent Access | about $2.50 plus $0.01/GB on any read |
    | Backblaze B2 | about $1.74 |

  - **Cloudflare Stream instead of self-HLS:** 2,400 min needs 3 × 1,000-minute blocks = $15, plus 2,400 delivered minutes × $1/1,000 = $2.40, for **about $17.40 a month**.
  - **Mux:** 2,400 min × $0.0024 = **$5.76 a month** at ≤720p. That falls to about $2.30–$3.46 once clips go unwatched for 30–90 days. Delivery is $0 under 100k free minutes.
    - The free plan's 10-asset cap rules it out if long tapes are split into many scene clips.
  - **Bunny Stream:** about 60 GB of renditions × $0.01 = $0.60, plus about 40 GB delivered × $0.01 = $0.40, for **about $1–2 a month** including the $1 minimum.
- **Realistic all-in monthly totals:**

  | Setup | Monthly cost | Composition |
  | --- | --- | --- |
  | Lean | about $1–5 | Cloudflare Pages/Workers static + Access free + R2 + D1 free; self-encoded HLS |
  | Comfortable | about $10–30 | Adds Workers Paid ($5), Cloudflare Stream or Mux, and on-the-fly Cloudflare Images |
  | Premium | about $45–80+ | Supabase Pro ($25) plus Netlify Pro ($20+) or Vercel password protection ($20/project on top of Pro) |

  A domain name is extra; see Gaps.
- R2 egress is free, so traffic spikes (a family reunion) don't change the bill. Bunny and Stream charge per GB or per minute delivered, but the amounts are cents at this audience size.

### Gaps
- **Cloudinary and ImageKit free tiers:** not verified (vendor sites blocked; search budget exhausted).
- **Bunny Optimizer price and Bunny Stream AI transcription/caption pricing:** UNVERIFIED.
- **Bunny token authentication for private media:** not verified.
- **Vimeo plan prices for 2026:** UNVERIFIED.
- **YouTube unlisted terms:** not verified this session.
- **Backblaze B2 free storage allowance for 2026:** not confirmed.
- **Domain registration cost:** not verified (Cloudflare Registrar at-cost .com pricing would need checking).
- **Mux:** whether the pay-as-you-go plan includes a monthly credit, and the current paid-plan minimums, are UNVERIFIED (conflicting tracker data).

## 4. Private access: Cloudflare Access, Netlify/Vercel passwords, StaticCrypt, magic links — and what is easiest for elderly relatives

### Takeaway
Cloudflare Zero Trust Access (free for up to 50 users) with email one-time-PIN is the strongest and cheapest option. Relatives type their email, receive a code, and stay signed in for up to a month. The same Access policy can protect the R2 media hostname, so photos and videos are not public by URL. StaticCrypt leaves media public. Netlify and Vercel charge about $20 a month or more for password protection. Supabase magic links need a custom SMTP provider.

### Cited Findings
- **Zero Trust plan:** "free for up to 50 users"; paid plans start at $7/user/month (annual). — [Cloudflare Zero Trust pricing](https://en-us.www.cloudflare.com/teams-pricing/); [Cloudflare Access](https://www.cloudflare.com/sase/products/access/); [Zero Trust For Everyone (blog)](https://blog.cloudflare.com/teams-plans/)
  - One community user reports being asked for payment details even when choosing the free plan (anecdotal). — [Cloudflare Community](https://community.cloudflare.com/t/how-to-add-an-ztna-app-for-free-in-access-without-entering-credit-card-detail/764129)
- **One-time PIN:** Access "can send a one-time PIN (OTP) to approved email addresses as an alternative to integrating an identity provider." — [One-time PIN login](https://developers.cloudflare.com/cloudflare-one/integrations/identity-providers/one-time-pin/)
  - **Setup gotcha:** "New Zero Trust organizations use the Cloudflare identity provider as their default login method. OTP is no longer added automatically." That default has "Restrict to account members" enabled, so family members without Cloudflare accounts cannot log in until OTP is added. — [One-time PIN login](https://developers.cloudflare.com/cloudflare-one/integrations/identity-providers/one-time-pin/); [Cloudflare as identity provider](https://developers.cloudflare.com/cloudflare-one/integrations/identity-providers/cloudflare/)
- **Session length:** "You can set a global session duration between 15 minutes and one month. The default value is 24 hours." Application and policy session durations can be set separately. — [Access session management](https://developers.cloudflare.com/cloudflare-one/access-controls/access-settings/session-management/)
- **Seats:** a user consumes a seat on any Access authentication and holds it "until you remove the user." Inactive users are not removed automatically unless seat expiration is enabled. Once seats run out, new users "are blocked." — [Seat management](https://developers.cloudflare.com/cloudflare-one/team-and-resources/users/seat-management/)
- **Account limit:** 500 Access applications per account. — [Zero Trust account limits](https://developers.cloudflare.com/cloudflare-one/account-limits/)
- **Protecting media and previews:**
  - **R2 behind Access:** create a self-hosted Access application for the bucket's custom domain. "You should create an Access application before connecting a custom domain to your bucket, as connecting a custom domain will otherwise make your bucket public by default." — [Protect an R2 bucket with Cloudflare Access](https://developers.cloudflare.com/r2/tutorials/cloudflare-access/)
  - **Pages previews:** previews are public by default and can be put behind an Access policy; protecting the `*.pages.dev` domain and a custom domain is covered under known issues. — [Pages preview deployments](https://developers.cloudflare.com/pages/configuration/preview-deployments/)
  - **R2 presigned URLs:** expire in 1 second to 7 days and act as bearer tokens. They "cannot be used with custom domains"; authenticating a custom-domain bucket that way requires WAF HMAC validation, which needs the Pro plan or above. — [R2 presigned URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/)
  - **r2.dev:** intended "for non-production use cases." WAF, caching, access controls and Bot Management require a custom domain. — [R2 public buckets](https://developers.cloudflare.com/r2/buckets/public-buckets/)
- **Netlify** (web-search summary of Netlify docs):
  - Password protection is not available on the credit-based Free and Personal plans; it is included on Pro, from $20/month.
  - Higher Pro credit tiers run $33 (5,000 credits) to $126 (20,000 credits).
  - Sources conflict on whether basic-auth `_headers` works below Pro.
  - Sources: [Netlify password protection](https://docs.netlify.com/manage/security/secure-access-to-sites/password-protection/); [Netlify Pro credit tiers changelog, 2026-07-14](https://www.netlify.com/changelog/2026-07-14-pro-plan-credit-tiers/); [Netlify support guide](https://answers.netlify.com/t/support-guide-access-control-options-for-your-netlify-sites/31289)
- **Vercel** (web-search summary of Vercel docs):
  - Password Protection costs $20/month per protected project on Pro and is not available on Hobby; the legacy option was a $150/month Advanced Deployment Protection add-on.
  - "Vercel Authentication" is free on all plans.
  - Sources: [Vercel password protection](https://vercel.com/docs/deployment-protection/methods-to-protect-deployments/password-protection); [Vercel changelog](https://vercel.com/changelog/password-protection-now-costs-20-per-project-per-month-on-pro); [Deployment Protection pricing](https://vercel.com/docs/deployment-protection/usage-and-pricing)
- **StaticCrypt:**
  - Encrypts HTML with AES-256 (CBC) via WebCrypto, using 600k PBKDF2-SHA256 iterations, and decrypts client-side.
  - When encrypting a directory, "Non-HTML files will be copied as-is," so images and videos stay public to anyone with the URL.
  - "Remember me" stores the hashed password in localStorage; share links can embed the password hash.
  - The author notes "I am not a cryptographer."
  - Source: [StaticCrypt README](https://github.com/robinmoisson/staticrypt). npm `staticrypt` 3.5.4, MIT, 2025-06-07. — [npm](https://www.npmjs.com/package/staticrypt)
- **Supabase Auth:**
  - Free plan includes 50,000 MAU. — [Supabase plan data](https://github.com/supabase/supabase/blob/master/packages/shared-data/plans.ts)
  - The built-in SMTP sends "only to pre-authorized addresses" (project team members) and is "not meant for production use." — [Supabase custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp)
  - The built-in SMTP limit is 2 emails/hour. Magic links and OTPs are valid 1 hour, with 60 s between requests. — [Supabase shared config](https://github.com/supabase/supabase/blob/master/packages/shared-data/config.ts); [Supabase auth rate limits](https://supabase.com/docs/guides/auth/rate-limits)
- **Better Auth** (self-hosted auth library): 1.7.10, MIT, 2026-10-15. — [npm](https://www.npmjs.com/package/better-auth)

### Inferences
- **Easiest for elderly relatives:** Cloudflare Access with email OTP. There is no password and no account to create — they type an email and then a 6-digit code.
  - Set the global session to 1 month so they rarely re-authenticate.
  - Pre-list approved emails in the Access policy.
  - Enable seat expiration so departed or one-time viewers don't use up the 50 free seats.
  - Send a printed or emailed one-page "how to log in" sheet.
- **OTP codes vs. magic links:** a code is more robust than a magic link. Links break when the email is opened on a different device, or in an email app's built-in browser, than the one where login started. This is my inference; I found no usability study.
- **One login for site, media and API:** put the site, the media hostname (R2 custom domain) and the API (Worker) under the same Access policy, so one login covers pages, photos, video segments and comments.
- **Shared family password** (StaticCrypt, Netlify, Vercel): the simplest experience, but there is no per-person identity for attributing comments or "who is this?" answers. StaticCrypt also exposes all media URLs.

### Gaps
- Not verified this session:
  - How a Worker reads the logged-in user's email from Access (the `Cf-Access-Jwt-Assertion` header / Access JWT) to attribute comments.
  - Whether Vercel Authentication requires viewers to have Vercel accounts.
  - Clerk's 2026 free-tier limits.
  - Transactional email provider pricing (Resend, Postmark, SES) for Supabase custom SMTP.
- No accessibility or usability research on logins for older adults was found (search budget exhausted).

## 5. Family interaction back end (comments, reactions, "Who is this?", date corrections, stories, voice notes, uploads): Supabase, Cloudflare D1/Workers, Firebase, PocketBase

### Takeaway
At this scale, the Cloudflare stack (Workers + D1 + R2) runs free, sits behind the same Access login, and has generous free quotas. Supabase is the fastest full back end (Postgres, auth, storage, realtime), but free projects pause after a week of inactivity, which is a real risk for a family site, so plan on Pro at $25/month. PocketBase is a capable self-hosted single binary, but it is pre-1.0 and needs a server.

### Cited Findings
- **Cloudflare D1 (database):**
  - **Free:** 5 million rows read a day, 100,000 rows written a day, 5 GB total storage; databases up to 500 MB each, 10 databases; Time Travel point-in-time recovery for 7 days.
  - **Workers Paid:** 25 billion rows read and 50 million rows written a month included, then $0.001 per million reads and $1.00 per million writes; first 5 GB included, then $0.75/GB-month; 10 GB per database; 30-day Time Travel.
  - No egress charges. Rows up to 2 MB; 100 columns per table.
  - Sources: [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/); [D1 limits](https://developers.cloudflare.com/d1/platform/limits/)
- **Cloudflare Workers:**
  - Free: 100,000 requests a day, 10 ms CPU per invocation.
  - Paid: $5/month minimum, with 10 million requests and 30 million CPU-ms included; then $0.30 per million requests and $0.02 per million CPU-ms. Up to 15 minutes of CPU per Cron Trigger or Queue consumer invocation.
  - Static-asset requests are free and unlimited.
  - Source: [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/)
- **Uploads via R2 presigned URLs:** they grant temporary `PutObject` or `GetObject` without exposing credentials, valid 1 second to 7 days, and work only on the S3 API domain. — [R2 presigned URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/)
- **Supabase plans** (from Supabase's own plan definitions):
  - **Free:** unlimited API requests, 50,000 MAU, 500 MB database, shared CPU with 500 MB RAM, 5 GB egress plus 5 GB cached egress, 1 GB file storage. "Free projects are paused after 1 week of inactivity. Limit of 2 active projects."
  - **Pro (from $25/month):** 100,000 MAU; 8 GB disk; 250 GB egress; 100 GB file storage, then $0.0213/GB; daily backups kept 7 days.
  - Source: [Supabase plans.ts](https://github.com/supabase/supabase/blob/master/packages/shared-data/plans.ts)
- **PocketBase:**
  - Embedded SQLite with realtime subscriptions; MIT licensed.
  - "Still under active development and therefore full backward compatibility is not guaranteed before reaching v1.0.0."
  - Sources: [PocketBase README](https://github.com/pocketbase/pocketbase); [PocketBase LICENSE](https://github.com/pocketbase/pocketbase/blob/master/LICENSE.md)
  - JS SDK `pocketbase` 0.28.1, MIT, 2026-09-05. — [npm](https://www.npmjs.com/package/pocketbase)

### Inferences
- **Suggested Cloudflare-native design:**
  - A Worker API at `/api/*` on the Access-protected hostname.
  - **D1 tables:** `comments`, `reactions`, `face_suggestions`, `date_suggestions`, `stories`, `uploads`, `audit_log`.
  - **R2 prefixes:** `incoming/` for relatives' uploads (written via presigned PUT) and `voice/` for voice notes.
  - A moderation view where the owner accepts or rejects suggestions, which then flow into the canonical metadata.
  - A few dozen users will never approach D1's daily quotas.
- **Supabase:** the faster build path if the developer wants Postgres, row-level security, built-in auth and realtime. But plan on Pro ($25/month) to avoid pausing, and configure custom SMTP for magic links (see section 4).
- **PocketBase:** best for someone who wants one self-hosted binary and is comfortable patching across breaking releases. It needs a VPS or home server and backups, and VPS pricing was not verified.
- **Voice notes:** record in the browser, upload to R2, transcribe (see section 8), and store the transcript with the story so it is searchable.

### Gaps
- Firebase Spark/Blaze limits for 2026 could not be verified (search budget exhausted, vendor site blocked). Whether Cloud Storage for Firebase still requires the Blaze plan is UNVERIFIED.
- Whether Cloudflare Queues (used by R2 event notifications) is available on the Workers Free plan was not verified.
- VPS prices for hosting PocketBase were not verified.

## 6. Front-end libraries for the interactive experience (with licenses and maintenance)

### Takeaway
Almost everything needed is MIT, BSD or Apache: PhotoSwipe, vis-timeline, D3, three.js/R3F, StPageFlip, Leaflet/MapLibre, Topola and family-chart. GSAP (including ScrollTrigger and all former paid plugins) is now free under GSAP's own "Standard 'no charge' license," which is not an OSI license. Three licenses need care:
- **lightGallery 3** is GPL-3.0 or commercial.
- **turn.js** 3rd release is non-commercial-only; the 4th release is sold separately.
- **Fancybox** uses its own license.

### Cited Findings
**Licenses and versions (npm registry, 2026-10-18):**

| Package | Version | License | Last published | Source |
| --- | --- | --- | --- | --- |
| photoswipe | 5.4.4 | MIT | 2024-05-24 | [npm](https://www.npmjs.com/package/photoswipe) |
| lightgallery | 3.0.0 | GPL-3.0-only OR LicenseRef-Commercial | 2026-10-09 | [npm](https://www.npmjs.com/package/lightgallery) |
| yet-another-react-lightbox | 3.32.2 | MIT | 2026-07-30 | [npm](https://www.npmjs.com/package/yet-another-react-lightbox) |
| glightbox | 3.3.1 | MIT | 2025-01-21 | [npm](https://www.npmjs.com/package/glightbox) |
| @fancyapps/ui (Fancybox) | 6.1.15 | "SEE LICENSE IN LICENSE.md" (custom) | 2026-09-08 | [npm](https://www.npmjs.com/package/@fancyapps/ui) |
| vis-timeline | 8.5.4 | Apache-2.0 OR MIT | 2026-08-12 | [npm](https://www.npmjs.com/package/vis-timeline) |
| @knight-lab/timelinejs | 3.9.13 | MPL-2.0 | 2026-07-26 | [npm](https://www.npmjs.com/package/@knight-lab/timelinejs) |
| d3 | 7.9.0 | ISC | 2024-03-12 | [npm](https://www.npmjs.com/package/d3) |
| gsap | 3.15.0 | "Standard 'no charge' license: https://gsap.com/standard-license" | 2026-04-13 | [npm](https://www.npmjs.com/package/gsap) |
| three | 0.186.1 | MIT | 2026-09-24 | [npm](https://www.npmjs.com/package/three) |
| @react-three/fiber | 9.8.2 | MIT | 2026-10-14 | [npm](https://www.npmjs.com/package/@react-three/fiber) |
| page-flip (StPageFlip) | 2.0.7 | MIT | 2021-04-18 | [npm](https://www.npmjs.com/package/page-flip) |
| leaflet | 1.9.4 | BSD-2-Clause | 2023-05-18 | [npm](https://www.npmjs.com/package/leaflet) |
| maplibre-gl | 6.15.0 | BSD-3-Clause | 2026-10-18 | [npm](https://www.npmjs.com/package/maplibre-gl) |
| pmtiles | 4.5.0 | BSD-3-Clause | 2026-08-10 | [npm](https://www.npmjs.com/package/pmtiles) |
| family-chart | 0.9.0 | ISC on npm (README says MIT) | 2025-10-21 | [npm](https://www.npmjs.com/package/family-chart) |
| topola | 3.10.4 | Apache-2.0 | 2026-09-04 | [npm](https://www.npmjs.com/package/topola) |
| d3-dtree (dTree) | 2.4.1 | MIT | 2020-04-24 | [npm](https://www.npmjs.com/package/d3-dtree) |
| react-photo-album | 3.6.2 | MIT | 2026-10-17 | [npm](https://www.npmjs.com/package/react-photo-album) |
| justified-layout (Flickr) | 4.1.0 | ISC | 2021-01-06 | [npm](https://www.npmjs.com/package/justified-layout) |
| hls.js | 1.7.3 | Apache-2.0 | 2026-09-11 | [npm](https://www.npmjs.com/package/hls.js) |
| media-chrome | 4.19.3 | MIT | 2026-09-28 | [npm](https://www.npmjs.com/package/media-chrome) |
| vidstack | 1.15.7 | MIT | — | [npm](https://www.npmjs.com/package/vidstack) |
| @mux/mux-player | 3.14.0 | MIT | 2026-10-05 | [npm](https://www.npmjs.com/package/@mux/mux-player) |
| pagefind (static search) | 1.5.2 | MIT | 2026-04-12 | [npm](https://www.npmjs.com/package/pagefind) |

**Library details:**
- **GSAP:** "Thanks to Webflow, GSAP is now 100% FREE including ALL of the bonus plugins like SplitText, MorphSVG… even for commercial use." ScrollTrigger is a core plugin. — [GSAP README](https://github.com/greensock/GSAP)
- **lightGallery:**
  - "Every package and every plugin is free and open source under the GPLv3, for personal and commercial projects alike, as long as your project is distributed under GPLv3-compatible terms."
  - Commercial licenses come with a key (v3 keys start with `LIG`); v1/v2 keys "need an upgrade for v3."
  - The evaluation key `0000-0000-000-0000` unlocks everything and only prints a console reminder.
  - Source: [lightGallery README](https://github.com/sachinchoolur/lightGallery)
- **turn.js:**
  - The 3rd-release `license.txt` is BSD-style but adds: "Any redistribution, use, or modification is done solely for personal benefit and not for any commercial purpose or for monetary gain." — [turn.js license.txt](https://github.com/blasten/turn.js/blob/master/license.txt)
  - The README says to "Get the turn.js 4th release on turnjs.com." — [turn.js README](https://github.com/blasten/turn.js)
  - A separate npm package named `turn.js` (1.0.5, MIT, 2017) exists. — [npm](https://www.npmjs.com/package/turn.js)
- **StPageFlip:** "Works with simple images on canvas and complex HTML blocks"; soft and hard page types (hard only in HTML mode). — [StPageFlip README](https://github.com/Nodlik/StPageFlip)
- **Topola:** hourglass, relatives and "fancy" chart types, with GEDCOM input. — [Topola README](https://github.com/PeWu/topola)
- **family-chart:** provides an EditTree API for editing and a Visual Builder; the README states the MIT License. — [family-chart README](https://github.com/donatso/family-chart)
- **dTree:** "visualizing data trees with multiple parents built on top of D3." — [dTree README](https://github.com/ErikGartner/dTree)

### Inferences
- **"Very cool and interactive" building blocks:**
  - A decade/year **timeline scrubber**: vis-timeline, or a custom D3 axis with GSAP ScrollTrigger scroll-driven transitions.
  - A justified **photo grid** (react-photo-album or justified-layout) that opens a **PhotoSwipe** lightbox with a front/back flip.
  - A **page-flip "album" view** of the original album pages (StPageFlip; avoid turn.js unless you buy the 4th release).
  - A **map** with MapLibre and self-hosted PMTiles on R2, or Leaflet.
  - A **family tree** (Topola for GEDCOM-based charts; family-chart for an editable React/JS tree) linking each person to "photos of this person."
  - Optionally a **three.js / R3F "memory wall" or 3D carousel**; keep it optional for older devices.
- **Licensing:** a private family site is non-commercial and not redistributed. turn.js 3rd release and lightGallery's GPL are therefore likely acceptable, but PhotoSwipe (MIT) avoids the question entirely. This is not legal advice.
- **Maintenance:** d3-dtree (2020), page-flip (2021), justified-layout (2021) and PhotoSwipe (2024) are stable but quiet. Pin versions.
- **Search:** Pagefind can index captions, stories and video transcripts statically, so search needs no server.

### Gaps
- GSAP Standard License restrictions (it is not open source; I recall a clause about competing with Webflow) could not be read because gsap.com was blocked. Confirm before relying on it.
- The lightGallery commercial license price was not verified.
- Fancybox license terms were not read.
- The PMTiles-on-R2 hosting pattern was not verified this session.

## 7. AI-assisted metadata: face detection/clustering, Immich ML reuse, cloud vision, LLM vision for dating, scenes, and handwriting; accuracy research and costs

### Takeaway
Face clustering is best done offline:
- **Immich**, self-hosted, uses InsightFace models with DBSCAN-style clustering and is the most turnkey option.
- **DeepFace** or **face_recognition** suit custom scripts.

InsightFace's pretrained models are licensed "for non-commercial research purposes only." Immich has permission for its own use, but that permission does not extend to third parties.

**Automatic photo dating is coarse:** the DEW project's released ResNet-50 model reports about 7.1 years mean error. Treat AI dates as "circa decade" suggestions that relatives confirm.

**LLM vision is cheap at this scale:** from about $0.17 per 1,000 images (Claude Haiku 5.5 via Batch) to about $14 per 1,000 (Claude Opus 5.5 standard), so a one-time pass over 10,000 front and back scans costs roughly $2–$140.

### Cited Findings
- **InsightFace:**
  - "The code of InsightFace is released under the MIT License… The training data containing the annotation (and the models trained with these data) are available for non-commercial research purposes only." — [InsightFace README](https://github.com/deepinsight/insightface)
  - The python-package README says the same about its auto-downloaded pretrained models and references "custom licensed models." — [insightface python-package](https://github.com/deepinsight/insightface/tree/master/python-package)
  - PyPI `insightface` 2.1, 2026-10-03. — [PyPI](https://pypi.org/project/insightface/)
- **Immich:**
  - Face detection runs in Immich's separate machine-learning service on preview images. The detector's boxes and crops feed a recognition model, and the resulting embeddings are indexed for clustering. — [Immich facial recognition docs](https://github.com/immich-app/immich/blob/main/docs/docs/features/facial-recognition.md)
  - Clustering is "derived from DBSCAN," with incremental behavior, and a face becomes a "core point" when it has a minimum number of similar faces nearby (default 3). — [Immich facial recognition docs](https://github.com/immich-app/immich/blob/main/docs/docs/features/facial-recognition.md)
  - **Tunable settings:** minimum detection score (don't go below 0.5); maximum recognition distance (stay between 0.3 and 0.7; lower it for twins or look-alikes); minimum recognized faces. — [Immich facial recognition docs](https://github.com/immich-app/immich/blob/main/docs/docs/features/facial-recognition.md)
  - **Re-clustering:** a guide covers re-running clustering on large libraries, warning that "This method deletes all previously assigned names." — [Immich better facial clusters guide](https://github.com/immich-app/immich/blob/main/docs/docs/guides/better-facial-clusters.md)
  - **Models:** Immich ML uses InsightFace models antelopev2, buffalo_l, buffalo_m and buffalo_s. It supports CUDA, ROCm and OpenVINO acceleration. — [Immich ML README](https://github.com/immich-app/immich/blob/main/machine-learning/README.md)
  - **Permission scope:** "We have received permission to use the InsightFace facial recognition models in our project… this permission does not extend to the redistribution or commercial use of their models by third parties." — [Immich ML README](https://github.com/immich-app/immich/blob/main/machine-learning/README.md)
  - Immich is AGPL-3.0. — [Immich LICENSE](https://github.com/immich-app/immich/blob/main/LICENSE)
- **face_recognition (dlib):**
  - The model "has an accuracy of 99.38% on the Labeled Faces in the Wild benchmark." The README documents an optional CNN face detector (`model="cnn"`) and links a face-clustering tutorial. — [face_recognition README](https://github.com/ageitgey/face_recognition)
  - Last PyPI release was 1.3.0 in 2020-02, MIT. — [PyPI](https://pypi.org/project/face-recognition/)
  - dlib 20.0.1 (2026-03) is under the Boost Software License. — [PyPI](https://pypi.org/project/dlib/)
- **DeepFace:**
  - MIT; wraps VGG-Face (default), FaceNet, ArcFace, Dlib, SFace, GhostFaceNet and Buffalo_L, plus detectors including RetinaFace, MTCNN, YuNet, YOLO, MediaPipe and CenterFace.
  - Its experiments report that detection "increases the face recognition accuracy up to 42%, while alignment increases it up to 6%."
  - Its age model reports ±4.65 years mean absolute error.
  - Source: [DeepFace README](https://github.com/serengil/deepface). 0.0.102, 2026-10-09. — [PyPI](https://pypi.org/project/deepface/)
- **Date estimation research:** the DEW project ("When Was This Picture Taken? – Image Date Estimation in the Wild," Müller, Springstein & Ewerth, ECIR 2017, pp. 619–625) ships a pretrained ResNet v1 50 model labeled "(7.1 ME)," meaning about 7.1 years mean error. — [DEW-Model repo](https://github.com/TIB-Visual-Analytics/DEW-Model); [paper (Springer)](https://link.springer.com/chapter/10.1007/978-3-319-56608-5_57)
- **CLIP embeddings:** `open-clip-torch` 3.3.0, MIT, for embeddings and zero-shot "decade" classification or similarity search. — [PyPI](https://pypi.org/project/open-clip-torch/)
- **Claude API pricing** (Anthropic reference, cached 2026-10-06), per million input/output tokens:
  - Claude Opus 5.5: $4 / $20
  - Claude Sonnet 5.5: $2 / $10
  - Claude Haiku 5.5: $0.10 / $0.50 (prompts up to 100K tokens)
  - The Message Batches API runs asynchronously at 50% of the cost.
  - Source: [Claude pricing](https://platform.claude.com/docs/en/about-claude/pricing)
- **Claude image tokens:** older models capped images at 1,568 px on the long edge (about 1,600 tokens). High-resolution models accept up to 2,576 px and "can use up to ~3× more image tokens… (up to ~4784 tokens per image)." Downsampling client-side controls cost. — [Claude migration guide](https://platform.claude.com/docs/en/about-claude/models/migration-guide) (read via Anthropic's bundled API reference); see also [Claude vision docs](https://platform.claude.com/docs/en/build-with-claude/vision)
- **Cloudflare Workers AI:**
  - $0.011 per 1,000 Neurons, with 10,000 Neurons/day free.
  - `@cf/meta/llama-3.2-11b-vision-instruct`: $0.049 per million input tokens and $0.676 per million output.
  - `@cf/microsoft/resnet-50` image classification: $2.51 per million images.
  - Source: [Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/)

### Inferences
- **Per-1,000-image LLM cost** (my arithmetic; assumes about 1,900 input tokens per request — an image downsampled to ≤1,568 px at about 1,600 tokens plus about 300 prompt tokens — and about 300 output tokens; thinking tokens bill as output and would add to this):

  | Model | Standard (per 1,000 images) | Batch (per 1,000 images) |
  | --- | --- | --- |
  | Claude Haiku 5.5 | about $0.34 | about $0.17 |
  | Claude Sonnet 5.5 | about $6.80 | about $3.40 |
  | Claude Opus 5.5 | about $13.60 | about $6.80 |
  | Sonnet 5.5 at full 2,576 px (about 4,784 image tokens) | about $13.20 | — |

  - For 5,000 photos with fronts and backs (about 10,000 images), the one-time cost is roughly **$2–$140**.
- **Workflow:**
  - (1) Run Immich locally on the masters, or a DeepFace/InsightFace script, to detect and cluster faces.
  - (2) Name the clusters yourself.
  - (3) Export face boxes and person IDs into the site's database.
  - (4) Unknown clusters become "Who is this?" prompts on the site.
- **LLM uses per photo**, all stored as suggestions with a model/confidence field, never as fact:
  - A decade estimate with stated clues (clothing, cars, print format)
  - A scene description for search and alt text
  - A transcription of handwriting on the back scan
- **Dating:** a CNN-level error of about 7 years means AI dating is only reliable at decade level. Family knowledge and print evidence (back-of-print notes, processing marks) should outrank it in the data model.
- **Face-model licensing:** InsightFace's model license is ambiguous for personal, non-commercial family use, which is "non-commercial" but arguably not "research." dlib-based face_recognition (MIT code) avoids InsightFace terms but is dated and less accurate on hard cases. This is not legal advice.

### Gaps
- Newer (2020–2026) photo-dating research, including scanned-historical-photo work and LLM/CLIP-based dating accuracy, could not be retrieved (search budget exhausted).
- No source was found on LLM handwriting-transcription accuracy for photo backs.
- Not verified this session:
  - Google Cloud Vision and AWS Rekognition 2026 pricing
  - OpenAI and Gemini vision pricing
  - Workers AI vision-model image-token accounting
- Immich ML's HTTP API contract for standalone reuse (outside the Immich server) was not verified. Reusing Immich itself, plus exporting via the Immich API, is the safer path but is unverified here.
- No source quantified face-recognition accuracy on aged black-and-white scans, or across a person's lifespan from child to adult.

## 8. Video processing: ffmpeg to HLS, PySceneDetect scene splitting, thumbnails and posters, Whisper transcripts

### Takeaway
A fully local, free-software pipeline handles everything:
1. Deinterlace (ffmpeg `bwdif`).
2. Split long VHS transfers into scene clips (PySceneDetect: Adaptive and Threshold detectors).
3. Encode an HLS VOD ladder (ffmpeg `hls` muxer, fMP4 segments).
4. Grab poster frames.
5. Transcribe with Whisper (faster-whisper, whisper.cpp or WhisperX).

Transcribing 40 hours with Cloudflare Workers AI's Whisper costs about $1.20, and runs free locally.

### Cited Findings
- **ffmpeg HLS muxer:**
  - `hls_time` sets segment duration.
  - `hls_playlist_type vod` emits `#EXT-X-PLAYLIST-TYPE:VOD`.
  - `hls_segment_type fmp4` ("fmp4 files may be used in HLS version 7 and above").
  - `var_stream_map` plus `master_pl_name` build multi-bitrate master playlists.
  - Source: [FFmpeg muxers doc](https://github.com/FFmpeg/FFmpeg/blob/master/doc/muxers.texi)
- **ffmpeg deinterlacing:** `bwdif` ("Bob Weaver Deinterlacing Filter") is "Motion adaptive deinterlacing based on yadif with the use of w3fdif and cubic interpolation." The docs also list `yadif`, `w3fdif`, `estdif` and the `idet` interlace-detection filter. — [FFmpeg filters doc](https://github.com/FFmpeg/FFmpeg/blob/master/doc/filters.texi)
- **PySceneDetect:**
  - `ContentDetector` handles fast cuts. A "two-pass version `AdaptiveDetector` handles fast camera movement better," and `ThresholdDetector` handles "fade out/fade in events."
  - `scenedetect -i video.mp4 split-video` splits via ffmpeg or mkvmerge. An official Docker image bundles the dependencies.
  - Source: [PySceneDetect README](https://github.com/Breakthrough/PySceneDetect). scenedetect 0.7.2, BSD-3-Clause, 2026-10-12. — [PyPI](https://pypi.org/project/scenedetect/)
- **Whisper:** six model sizes.
  - turbo (809M params, about 6 GB VRAM, about 8× relative speed) is an optimized large-v3 that is "not trained for translation."
  - large needs about 10 GB VRAM; tiny and base about 1 GB.
  - Source: [Whisper README](https://github.com/openai/whisper). openai-whisper 20250625, MIT. — [PyPI](https://pypi.org/project/openai-whisper/)
- **faster-whisper:** "up to 4 times faster than openai/whisper for the same accuracy while using less memory." Its benchmark transcribes 13 minutes of audio in 1m03s (fp16), 17s (batch 8) or 59s (int8, 2,926 MB). — [faster-whisper README](https://github.com/SYSTRAN/faster-whisper). 1.2.1, MIT. — [PyPI](https://pypi.org/project/faster-whisper/)
- **WhisperX:** "70x realtime with large-v2," word-level timestamps via wav2vec2 alignment, speaker diarization via pyannote-audio, and VAD preprocessing that "reduces hallucination." — [WhisperX README](https://github.com/m-bain/whisperX). 3.8.6, BSD-2-Clause, 2026-05-25. — [PyPI](https://pypi.org/project/whisperx/)
- **whisper.cpp:** MIT; "Plain C/C++ implementation without dependencies"; Apple Silicon is first-class via Metal and Core ML; CPU-only inference is supported. — [whisper.cpp README](https://github.com/ggml-org/whisper.cpp)
- **Workers AI transcription:** `@cf/openai/whisper-large-v3-turbo` costs $0.0005 per audio minute (46.63 neurons/min). — [Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/)
- **Cloudflare Stream and Media Transformations:** Stream segments uploaded content into 4-second segments. Generating a still frame from a video counts as 1 transformation, priced $0.50 per 1,000 after 5,000 free a month. — [Stream pricing](https://developers.cloudflare.com/stream/pricing/)

### Inferences
- **Suggested pipeline for each tape:**
  1. Keep the capture master offline or in cold storage.
  2. Detect interlacing (`idet`) and deinterlace with `bwdif`.
  3. Run PySceneDetect. AdaptiveDetector suits handheld camcorder footage; ThresholdDetector catches fades to black between recording sessions. Hand-review the cut list.
  4. Encode an H.264/AAC HLS ladder with `-hls_playlist_type vod -hls_segment_type fmp4 -hls_time 6`. VHS is standard-definition, so about 480p and 360p renditions suffice.
  5. Extract poster frames and a thumbnail sprite with ffmpeg.
  6. Transcribe with faster-whisper (GPU) or whisper.cpp (Mac/CPU) to WebVTT captions and plain text.
  7. Write a clip manifest with EDTF date, people, place, source tape and timecodes.
- **Playback:** use hls.js, Vidstack or Media Chrome for self-hosted HLS on R2.
- **Search:** add transcripts to the Pagefind index so "Grandpa's fishing trip" is searchable.
- **Cost:** 2,400 minutes × $0.0005 = **$1.20** on Workers AI. That is under the free daily allowance if spread out: 10,000 / 46.63 ≈ 214 minutes a day.

### Gaps
- No VHS-specific scene-detection accuracy data was found.
- Best-practice bitrate ladders for SD archival video were not verified.
- Lossless capture master sizes (for example, FFV1 versus ProRes at SD) were not verified, so master-storage estimates for video are rough.

## 9. Automation: rebuild when new photos are added; drop-folder workflows

### Takeaway
Keep heavy media processing out of CI. Run an ingest script on the owner's machine, or a Worker for small uploads. It pushes derivatives to R2 and commits a JSON manifest, and a Git push then triggers a fast static rebuild (Cloudflare Pages or GitHub Actions). GitHub Actions gives 2,000 free minutes a month on private repos, and is unlimited on public repos and self-hosted runners. Relatives' uploads can trigger R2 event notifications, which feed Queues and a Worker that runs moderation.

### Cited Findings
- **GitHub Actions:**
  - Free "for self-hosted runners and for public repositories that use standard GitHub-hosted runners."
  - Private-repo quotas: GitHub Free 2,000 minutes a month with 500 MB artifact storage; GitHub Pro 3,000 minutes with 1 GB; 10 GB cache per repository.
  - Overage rates: Linux 2-core $0.006/min, Linux 1-core $0.002/min, artifact storage $0.25/GB-month, cache $0.07/GB-month.
  - "If your account does not have a valid payment method on file, usage is blocked once you use up your quota."
  - Sources: [GitHub Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions); [included quotas](https://github.com/github/docs/blob/main/data/reusables/billing/actions-included-quotas.md); [runner prices](https://github.com/github/docs/blob/main/data/reusables/billing/actions-standard-runner-prices.md)
- **Cloudflare Pages builds (Free):** 500 builds a month, 1 concurrent, 20-minute timeout. — [Pages limits](https://developers.cloudflare.com/pages/platform/limits/)
- **R2 event notifications:** "send messages to your queue when data in your R2 bucket changes," consumed "with a consumer Worker or pull over HTTP from outside of Cloudflare Workers." They can be filtered by prefix and suffix via `wrangler r2 bucket notification create`. — [R2 event notifications](https://developers.cloudflare.com/r2/buckets/event-notifications/)
- **Workers CPU limits:** up to 15 minutes of CPU per Cron Trigger or Queue consumer invocation on the paid Standard model. — [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/)
- **rclone Google Drive backend:** `rclone copy` and sync to and from Drive; `--drive-scope=drive.readonly` for read-only access; quota viewing via `rclone about`. — [rclone Drive docs](https://rclone.org/drive/) ([source](https://github.com/rclone/rclone/blob/master/docs/content/drive.md))
- **watchdog** (Python folder-watcher) 6.0.0, Apache-2.0. — [PyPI](https://pypi.org/project/watchdog/)

### Inferences
- **Owner workflow:**
  - Scanner saves to a local `inbox/` folder.
  - `npm run ingest` (or a watchdog daemon) generates derivatives, a ThumbHash, face detection and an LLM suggestion pass.
  - It uploads to R2 via the S3 API or rclone, then appends to `manifest/*.json` and commits.
  - The Git push triggers the Pages or Actions build, which finishes in minutes because it does no image work.
- **Relatives' drop folder:** either (a) a shared Google Drive folder the owner pulls with `rclone copy` on a schedule, or (b) an upload page on the site that writes to R2 `incoming/` via presigned PUT. An event notification feeds a Queue, and a consumer Worker adds a D1 "pending review" row and emails the owner.
- **Keep masters out of CI:** uploading 25–250 GB of masters to CI runners would burn minutes and storage quotas. Do the media work on the owner's machine.
- **Build trigger:** a consumer Worker (or the owner's script) can call GitHub's `repository_dispatch` to rebuild after approvals. This GitHub API was not verified this session.

### Gaps
- Not verified: whether Queues and R2 event notifications work on the Workers Free plan; Google Drive API rate limits; and GitHub's `repository_dispatch` details.

## 10. Data model: approximate dates, people, places, source album/page, front/back pairs, and multiple families

### Takeaway
Store dates as EDTF (ISO 8601-2) strings plus derived min/max bounds for sorting, with provenance on every assertion. Model each physical print as an *item* with multiple *sides* (front and back scans). Model people, face regions, places, source albums/pages and family collections as separate many-to-many entities, so Richards and Arant materials can overlap in one archive. Keep GEDCOM import/export for the tree.

### Cited Findings
- **EDTF:**
  - `edtf.js` "fully implements EDTF levels 0, 1, and 2 as specified by ISO 8601-2." — [edtf.js README](https://github.com/inukshuk/edtf.js)
  - **Syntax examples:** `2016-XX` (unspecified month), `2016?` (uncertain), intervals like `2016-04~/2016-05` (`~` means approximate), sets like `[..2016,2017]`, and sub-year groupings like `2016-34`, which spans 2016-04-01 to 2016-06-30. — [edtf.js README](https://github.com/inukshuk/edtf.js)
  - Every value exposes `.min` and `.max` timestamps for range sorting; types include Date, Year, Decade, Century, Season, Interval, List and Set. — [edtf.js README](https://github.com/inukshuk/edtf.js)
  - npm `edtf` 4.11.1, BSD-2-Clause, 2026-08-13. — [npm](https://www.npmjs.com/package/edtf)
- **GEDCOM:** the FamilySearch GEDCOM specification is developed openly on GitHub and published at gedcom.io. — [FamilySearch GEDCOM repo](https://github.com/FamilySearch/GEDCOM)
  - Topola renders charts directly from GEDCOM. — [Topola README](https://github.com/PeWu/topola)
  - family-chart offers an editing API (EditTree). — [family-chart README](https://github.com/donatso/family-chart)
- **D1 limits relevant to schema design:** 100 columns per table, 2 MB per row or BLOB, 100 bound parameters per query, 100 KB statement length. — [D1 limits](https://developers.cloudflare.com/d1/platform/limits/)

### Inferences
- **Suggested core tables:**
  - `item` (one physical print, slide, negative or tape): `id`, `kind`, `collection_ids[]`, `source_album_id`, `album_page`, `slot`, `physical_notes`, `scan_batch`.
  - `media` (one scan or file): `item_id`, `side` (front, back, detail, album-page), master key, derivative keys, `width`, `height`, `thumbhash`, `checksum`.
  - `date_assertion`: `item_id`, `edtf` (for example `1965~`, `196X`, `1964/1966`), `min`, `max`, `display_text` ("circa 1965"), `basis` (handwritten back, print stamp, event, family memory, AI), `asserted_by`, `confidence`, `status` (proposed, accepted).
  - The item's "effective date" is the best accepted assertion. This lets the site sort by `min` and show "circa" labels.
  - `person`: names (maiden and married), birth/death as EDTF, `living` flag, `family_branch`, a GEDCOM xref.
  - `face_region`: `media_id`, normalized bounding box, `person_id` (nullable), `cluster_id`, `source` (Immich, manual).
  - `place`: name, lat/lon, precision radius, `place_assertion` with provenance.
  - `album` (physical source): owner, title, date range, page count, with images of the album covers and pages.
  - `collection`/`family`: Richards, Arant, and so on, many-to-many with items and people, since in-laws and couples belong to both. Build per-family views as filters, not separate sites.
  - `story` / `voice_note`: text or audio key, transcript, linked items and people, author.
  - `suggestion`: polymorphic proposals (who, date, place, caption) with moderation status.
  - `audit_log`.
- **Front/back pairs:** one `item` with two `media` rows (side=front, side=back) keeps them together in the lightbox (a "flip" button) and lets back-of-print text feed date and person suggestions.
- **Portability:** write key metadata into the masters (XMP/IPTC captions and person regions) and export a GEDCOM, so the archive outlives the website. The XMP/MWG region specifics were not verified this session.

### Gaps
- IPTC Photo Metadata and MWG face-region specifications could not be fetched (sites blocked), so the field mappings are unverified.
- No source was found on established conventions for linking photos to GEDCOM `OBJE` records.

## 11. Privacy and safety: search indexing, scraping, and protecting living relatives' information

### Takeaway
Authenticate *everything*: put the site, the media hostname and the API behind Cloudflare Access. That defeats indexing and scraping because bots never get past the login. Avoid r2.dev, public buckets, StaticCrypt-style "HTML only" protection and unlisted-link video hosting for private material. Add AI-bot blocking and `noindex` as defense in depth, and apply genealogy-style "living person" privacy rules to names, dates and addresses.

### Cited Findings
- **Bucket exposure:** connecting a custom domain to an R2 bucket before creating the Access application "will otherwise make your bucket public by default." — [Protect an R2 bucket with Cloudflare Access](https://developers.cloudflare.com/r2/tutorials/cloudflare-access/)
- **r2.dev:** non-production only; WAF, caching, access controls and Bot Management require a custom domain. — [R2 public buckets](https://developers.cloudflare.com/r2/buckets/public-buckets/)
- **Presigned URLs** are bearer tokens: "Anyone with the URL can perform the specified operation until it expires." — [R2 presigned URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/)
- **StaticCrypt** copies non-HTML files unencrypted, so media is reachable by URL. — [StaticCrypt README](https://github.com/robinmoisson/staticrypt)
- **Cloudflare AI-bot blocking:**
  - Customers can block AI bots by behavior: Search, Agent or Training.
  - "On September 15, 2026, Cloudflare will set updated defaults for new domains: bots classified as Training or as Agent will be blocked on pages that display ads, and Search will remain allowed."
  - Source: [Block AI Bots](https://developers.cloudflare.com/bots/additional-configurations/block-ai-bots/)
- **Access seats:** an authenticated user keeps their seat (but not necessarily access) until removed. Revoking a user "will terminate active sessions." — [Seat management](https://developers.cloudflare.com/cloudflare-one/team-and-resources/users/seat-management/)
- **Supabase default SMTP:** delivers only to project-team addresses, which limits accidental mass emailing but also blocks family logins until custom SMTP is configured. — [Supabase custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp)

### Inferences
- **Checklist:**
  - (1) One Access policy covering `photos.example.com` (site), `media.example.com` (R2 custom domain) and the API.
  - (2) Keep r2.dev disabled and never expose a bucket before its Access application exists.
  - (3) Send `X-Robots-Tag: noindex, nofollow` and a disallow-all robots.txt anyway.
  - (4) Enable Cloudflare's AI-bot blocking.
  - (5) Strip EXIF/GPS from derivatives and from relatives' phone uploads.
  - (6) Mark persons as living by default unless a death is recorded or the birth is long ago. Hide birthdates, addresses and maiden names of living people from the general view, and let relatives request removal or blurring.
  - (7) Keep an audit log of who suggested or changed what.
  - (8) Remove users' seats and sessions when someone should lose access.
  - (9) Use 3-2-1 backups for masters: local drive, R2 (or B2), and a second provider.
- **Video hosts:** unlisted YouTube or Vimeo links are effectively public to anyone who gets the link. Self-hosted HLS on Access-protected R2, or Cloudflare Stream or Mux with signed playback, keeps family video private. This is inference; signed-playback features were not verified this session.

### Gaps
- Not verified (sites blocked or search budget exhausted):
  - Google's current documentation on `noindex` and robots.txt
  - YouTube and Vimeo privacy-setting behavior in 2026
  - Cloudflare Stream and Mux signed-URL / private-playback docs
  - Genealogy-software defaults for treating people as living (for example, an age threshold)
- No legal analysis (GDPR/CCPA, right of publicity) was attempted.
