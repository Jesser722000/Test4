# Self-hosted and open-source photo/video platforms and genealogy platforms for a private family photo + home-video archive (state as of October 18, 2026)

Research note: most project and vendor websites (immich.app, photoprism.app, piwigo.com, pikapods.com, grampshub.com, tailscale.com, hetzner.com) could not be fetched directly in this session because of DNS/proxy blocks. Facts therefore come from (a) primary sources fetched from GitHub (release pages, commit logs, and the Markdown docs that live in each project's repository) and (b) web-search summaries of the official pages. Where a fact comes only from a search summary, the official URL is still cited, but it was not read directly. The session's web-search budget ran out before Tailscale's plan limits, TNG's photo features, Reddit/HN sentiment, mini-PC prices and Cloudflare's terms could be checked; those are listed under Gaps. EUR-to-USD conversions use an assumed rate of about $1.16 per €1. That rate is not sourced, so check current rates.

## 1. Immich: release status and features for a family archive (timeline, faces, map, memories, smart search, albums, sharing, partner sharing, video, mobile, external libraries, bulk date/metadata editing, stacking, guests, comments, uploads by relatives, ML hardware, backups)

### Takeaway
Immich has been officially "stable" since v2.0.0 (Oct 1, 2025). It is now on v3.3.x (v3.3.3, Oct 14, 2026), with roughly monthly feature releases. It is the most complete Google-Photos-style self-hosted option: faces with names and birthdays, CLIP smart search, OCR, map, memories, albums with roles, public links with upload, partner sharing, mobile apps and Chromecast. It has notable limits for a scanned-print archive:
- It has no approximate-date concept.
- Bulk date changes only set one exact date; there is no native relative shift.
- Stacks collapse only in the main timeline.
- Comments and likes require logged-in accounts and are not shown to people using a public link.

### Cited Findings
**Release status and cadence**
- v2.0.0 was announced Oct 1, 2025 as Immich's first stable release. The team said it cleared significant technical debt and removed the website's warning banner. No special upgrade steps were needed. — [Immich blog: v2.0.0](https://immich.app/blog/v2.0.0-release); [Linuxiac](https://linuxiac.com/?p=191466); [Immich October 2025 recap](https://immich.app/blog/2025-october-recap)
- v3.0.0, described as "the next major version", was released in early July 2026 (GitHub shows "02 Jul"; the blog index dates it July 1, 2026). It was the first release to go through release candidates, and admins can opt into RCs under Admin settings > Version check. Upgrading means setting `IMMICH_VERSION=v3` in `.env`. Most breaking changes affect the API used by third-party tools. v3 drops pgvecto.rs, so installs from before v1.133.0 must migrate to VectorChord first. — [GitHub release v3.0.0](https://github.com/immich-app/immich/releases/tag/v3.0.0); [Immich blog v3.0.0](https://immich.app/blog/v3.0.0-release)
- Later releases: v3.1.0 (July 29, 2026), v3.2.0 (Sept 10, 2026), v3.3.0 (Oct 7, 2026). — [Immich blog index](https://immich.app/blog); [GitHub v3.2.0](https://github.com/immich-app/immich/releases/tag/v3.2.0); [GitHub v3.3.0](https://github.com/immich-app/immich/releases/tag/v3.3.0)
- The latest tags are v3.3.3 (14 Oct) and v3.3.1 (08 Oct). They follow v3.3.0 (07 Oct) and three release candidates (29 Sep to 02 Oct). The v3.3.1 patch fixed people-sharing bugs and a mobile scroll issue. — [GitHub releases](https://github.com/immich-app/immich/releases)
- Some v3 features are explicitly not stable. HLS/real-time video transcoding is "experimental" and "can change behavior from version to version". Workflows are a "preview". — [GitHub v3.0.0](https://github.com/immich-app/immich/releases/tag/v3.0.0)
- Immich sells optional lifetime licenses: Individual $24.99 (per user, any server) and Server $99.99 (everyone on the server). These are 2024 prices and were not rechecked. They are bought at buy.immich.app or in-app (since v1.109.0). — [Immich licensing blog (archived v1.109)](https://v1.109.0.archive.immich.app/blog/2024/immich-licensing); [AlternativeTo](https://alternativeto.net/news/2024/7/immich-introduces-licensing-options-to-support-development-in-its-latest-update)

**Faces / people**
- Faces are detected on preview images, then a recognition model runs on the cropped faces. Clustering is derived from DBSCAN, and by default a new person is created only when there are 3 similar faces. — [Immich docs: facial-recognition.md](https://raw.githubusercontent.com/immich-app/immich/main/docs/docs/features/facial-recognition.md)
- You name people on the Explore page. You can also merge people, hide a person, change the feature photo, favorite someone (pinned to the top), and set a date of birth so the person's age shows on photos. Unassigned faces can be assigned by hand, then "queue Missing" to improve auto-matching. — [facial-recognition.md](https://raw.githubusercontent.com/immich-app/immich/main/docs/docs/features/facial-recognition.md)
- The docs strongly advise not setting the minimum detection score below 0.5. Smaller models (for example `buffalo_s`) suit constrained systems. — [facial-recognition.md](https://raw.githubusercontent.com/immich-app/immich/main/docs/docs/features/facial-recognition.md); [FAQ.mdx](https://raw.githubusercontent.com/immich-app/immich/main/docs/docs/FAQ.mdx)
- v3.2.0 added "cluster groups", so faces are recognized across trusted users' shared assets. Turning this on requires resetting facial recognition for the group, which clears names and birth dates. — [GitHub v3.2.0](https://github.com/immich-app/immich/releases/tag/v3.2.0)
- v3.3.0 added shared people management:
  - A person can be shared with another user, and both users can edit only the name and birth date.
  - Sharing is one-directional.
  - The "Manage access" modal is on the web only, not mobile yet.
  - Edits can be limited to "Only me".
  - Users can merge their own detections into people shared with them.
  - v3.3.0 also added birthday memories, which show a person's previous birthdays on their birthday.
  — [GitHub v3.3.0](https://github.com/immich-app/immich/releases/tag/v3.3.0)

**Search, map, memories, browsing**
- Smart search uses CLIP through Postgres/VectorChord and "allows for freeform searches without requiring specific keywords". Multilingual models are available (`nllb`, `xlm`, `siglip2`). — [Immich docs: searching.md](https://raw.githubusercontent.com/immich-app/immich/main/docs/docs/features/searching.md)
- Search filters cover:
  - recognized people
  - reverse-geocoded location
  - time frame
  - camera make, model and lens
  - media type, tags, descriptions and star rating
  - archive, favorites, and "not in any album"
  - "Text in images" (OCR)
  - full or partial filenames and folder names
  — [searching.md](https://raw.githubusercontent.com/immich-app/immich/main/docs/docs/features/searching.md)
- v3.2.0 added several browsing features:
  - Search API v2: search within albums and combine filters with AND/OR.
  - A dedicated memories page; favorited memories are kept.
  - A map viewport timeline on the web, which opens a timeline of the assets in the current map view.
  - Tag renaming.
  - Photos taken in the same second are sorted by filename.
  — [GitHub v3.2.0](https://github.com/immich-app/immich/releases/tag/v3.2.0)
- v3.0.0 added:
  - a "Recently Added" page, sorted by when items were added rather than taken
  - a mobile slideshow and a new web video player
  - OCR on mobile
  - faster browsing of large single months
  - nightly integrity checks that compare disk against the database
  — [GitHub v3.0.0](https://github.com/immich-app/immich/releases/tag/v3.0.0)
- The docs also include a folder view, a locked folder, a duplicates utility, tags, reverse geocoding and a CLI. — [Immich docs features directory](https://github.com/immich-app/immich/tree/main/docs/docs/features)

**Albums, sharing, guests, comments/likes, uploads by relatives**
- Shared albums give users "editors (read-write)" or "viewers (read-only)" roles. Shared users can add their own photos and videos. — [Immich docs: sharing.md](https://raw.githubusercontent.com/immich-app/immich/main/docs/docs/features/sharing.md)
- Public shared links are made from selected assets or from an album. The random URL acts as a secret. Links can expire, be password protected, and let the recipient upload to your account. Recipients do not need an Immich account. — [sharing.md](https://raw.githubusercontent.com/immich-app/immich/main/docs/docs/features/sharing.md)
- The documented link options are "Require password", "Show metadata", "Allow public user to download", "Allow public user to upload" (uploaders cannot delete what they uploaded) and "Expire after". — [Immich docs: sharing (search summary)](https://docs.immich.app/features/sharing/); [archived docs v1.121.0](https://v1.121.0.archive.immich.app/docs/features/shared-albums)
- Partner sharing is one-way, and the partner can view and download.
  - It covers all non-archived photos and videos with all their metadata, including GPS.
  - It excludes the partner's existing albums, favorites, and people/face data.
  - Partner assets can optionally appear in the partner's main timeline.
  - Partners can re-share these assets through albums and links.
  — [Immich docs: partner-sharing.md](https://raw.githubusercontent.com/immich-app/immich/main/docs/docs/features/partner-sharing.md)
- Comments and likes ("activity") were added in v1.85.0. They work in shared albums, at both album and photo level, and the owner can turn them on or off. The docs say "Activity is not visible when sharing an album via external link." This comes from archived v1.106 and v1.121 docs, so current behavior was not confirmed. — [archived docs v1.121.0](https://v1.121.0.archive.immich.app/docs/features/shared-albums); [ImageGenius v1.85.0 notes](https://newreleases.io/project/github/imagegenius/docker-immich/release/v1.85.0-ig204)
- v3.3.0 lets album editors change the album title and description. It adds a "leave album" action, makes album shared links include the album owner, and fixes deleting a comment hiding others. v3.0.0 added uploading local assets directly to an album from mobile, and choosing the share image size. — [GitHub v3.3.0](https://github.com/immich-app/immich/releases/tag/v3.3.0); [GitHub v3.0.0](https://github.com/immich-app/immich/releases/tag/v3.0.0)
- The FAQ does not mention guest users or read-only user roles. "Read-only" appears only for external libraries. — [FAQ.mdx](https://raw.githubusercontent.com/immich-app/immich/main/docs/docs/FAQ.mdx)

**Video and TV**
- v3.0.0 added a new web video player (for consistent controls). It also added HLS real-time transcoding as a web-only preview, which needs a capable server, with hardware acceleration recommended. — [GitHub v3.0.0](https://github.com/immich-app/immich/releases/tag/v3.0.0)
- v3.3.0 fixed scaling of rotated videos during transcoding and several mobile playback issues. — [GitHub v3.3.0](https://github.com/immich-app/immich/releases/tag/v3.3.0)
- Casting uses Google Cast only (Chromecast, Nest Hub). It is web-client only, "experimental", and off by default because it loads Google scripts. It requires HTTPS, and the instance must be publicly reachable with DNS that resolves via Google's 8.8.8.8/8.8.4.4. Videos must be in Cast-compatible formats. — [Immich docs: casting.md](https://raw.githubusercontent.com/immich-app/immich/main/docs/docs/features/casting.md)

**Mobile apps**
- v3.0.0 brought Android periodic background backup of the whole library and parallel sync/upload on iOS. It also added mobile non-destructive editing (crop, rotate, adjust) and a mobile slideshow. — [GitHub v3.0.0](https://github.com/immich-app/immich/releases/tag/v3.0.0)
- The FAQ advises keeping the mobile app and server on the same major and minor version to avoid login problems. It calls the app's self-signed certificate, Basic Auth, custom header and mTLS features "experimental". — [FAQ.mdx](https://raw.githubusercontent.com/immich-app/immich/main/docs/docs/FAQ.mdx)

**External libraries**
- Each library has one owning user, which can't be changed later.
- Mounting it with `:ro` blocks deletion and XMP writing. Without `:ro`, Immich can delete the files.
- Metadata added in Immich (albums, descriptions) stays in Immich and is not written to the file. Moving a file within the library loses that metadata (a "known issue").
- A nightly scan picks up changes. File watching is experimental.
- In read-only libraries, timestamps, location, descriptions and star ratings can't be edited.
— [Immich docs: libraries.md](https://raw.githubusercontent.com/immich-app/immich/main/docs/docs/features/libraries.md); [FAQ.mdx](https://raw.githubusercontent.com/immich-app/immich/main/docs/docs/FAQ.mdx)

**Date and metadata editing** (see Q7 for scans)
- The bulk change-date action sets one exact date and time for every selected asset. A feature request to shift by a time offset was closed, but implementation was not confirmed. The requester used an API script instead. — [Immich discussion #9586 (mirror)](https://git.tdem.in/immich-app/immich/discussions/9586)
- Since v1.124, folder view supports multi-select download, change date, change location, archive, delete, and refresh of thumbnails/metadata. — [Linuxiac on Immich 1.124](https://linuxiac.com/immich-1-124-brings-tagging-fixes-and-enhancements/)
- v3.0.0: "Date edits keep the chosen timezone". — [GitHub v3.0.0](https://github.com/immich-app/immich/releases/tag/v3.0.0)
- Workflows (v3.0 preview) chain triggers, filters and actions in a drag-and-drop builder. v3.2.0 added a tag trigger and an add-multiple-tags action. — [GitHub v3.0.0](https://github.com/immich-app/immich/releases/tag/v3.0.0); [GitHub v3.2.0](https://github.com/immich-app/immich/releases/tag/v3.2.0)
- The third-party immich-power-tools offers a "Bulk Date Offset". Its v0.22.0 and later require Immich 3.0+. — [BrightCoding on immich-power-tools](https://blog.brightcoding.dev/2026/09/24/immich-power-toolsimmich-power-tools-bulk-organize-your-self-hosted-immich-library)

**Stacking (front and back of a print)**
- Manual stacking arrived in v1.83.0. The release page shows "28 Oct" with no year; it is long before v2.0.
  - "When assets are stacked, the children are hidden from the main timeline, and only a single (primary/parent) asset is shown."
  - "The stacked content can only be seen from the main timeline on the web and mobile app."
  - "In other views, such as album, archive, and favorite, the contents are still shown as not stacked."
  — [GitHub v1.83.0](https://github.com/immich-app/immich/releases/tag/v1.83.0)
- Later changes:
  - v3.0: up/down arrow keys navigate stacks.
  - v3.2: stacked assets sort by creation date.
  - v3.3: edits made in third-party phone apps are auto-stacked on the original.
  — [GitHub v3.0.0](https://github.com/immich-app/immich/releases/tag/v3.0.0); [GitHub v3.2.0](https://github.com/immich-app/immich/releases/tag/v3.2.0); [GitHub v3.3.0](https://github.com/immich-app/immich/releases/tag/v3.3.0)
- Third-party tools can stack automatically. immich-go's `stack` command handles RAW/JPEG and HEIC/JPEG pairs and lets you choose the cover. immich-stack groups photos by rules, including filename-based choice of the parent. — [immich-go stack man page](https://dyn.manpages.debian.org/unstable/immich-go/immich-go-stack.1); [immich-stack](https://gittrend.io/repo/Majorfi/immich-stack)

**Hardware and machine-learning needs**
- Basic requirements:
  - 64-bit Linux is recommended. Docker in LXC is "not recommended".
  - Docker Compose plugin.
  - RAM: minimum 6 GB, recommended 8 GB. 4 GB works only with ML disabled.
  - CPU: minimum 2 cores, recommended 4. Both amd64 and arm64 are supported.
  - Thumbnails and transcodes add 10–20% to library size.
  - The Postgres database (1–3 GB) must be on local SSD, "never a network share of any kind".
  - On amd64, ML in v3+ requires the x86-64-v2 level (most CPUs since about 2012). Otherwise the last compatible release is v2.7.5, which is unsupported.
  — [Immich docs: requirements.md](https://raw.githubusercontent.com/immich-app/immich/main/docs/docs/install/requirements.md)
- The FAQ says ML may be "too heavy to run on a Raspberry Pi". The options are to reduce its load, run the ML container on a more powerful machine (remote ML), or disable it, which makes search and Explore worse. To cut resource use: set job concurrency to 1, set transcoding threads to 1–2, or use the `buffalo_s` face model. Memory limits that are too low get containers killed. — [FAQ.mdx](https://raw.githubusercontent.com/immich-app/immich/main/docs/docs/FAQ.mdx)
- Hardware acceleration is optional and experimental, and only on Linux or WSL2. Backends:
  - CUDA: compute capability 5.2+ and driver 545+. The docs say "CUDA is the most reliable".
  - ROCm: needs 35 GiB of free disk.
  - OpenVINO: Intel iGPU or Arc, with higher RAM use.
  - ARM NN: Mali GPUs.
  - RKNN: RK3566, RK3568, RK3576 or RK3588.
  — [Immich docs: ml-hardware-acceleration.md](https://raw.githubusercontent.com/immich-app/immich/main/docs/docs/features/ml-hardware-acceleration.md)
- v3.3.0 offers optimized ML models as an opt-in (`MACHINE_LEARNING_MODEL_REVISION=v2`). They cut inference time and memory on all backends, including CPU, and will become the default later. — [GitHub v3.3.0](https://github.com/immich-app/immich/releases/tag/v3.3.0)

**Backups and data safety**
- Immich "does not scan the library folder, so database backups are essential."
- Back up `UPLOAD_LOCATION/library`, `upload` and `profile`; all of `UPLOAD_LOCATION` is recommended.
- Automatic database dumps run daily at 2:00 AM and keep the last 14. They are saved in `UPLOAD_LOCATION/backups`.
- The docs recommend a 3-2-1 strategy with a separate backup tool.
- Restore from the web UI under Administration > Maintenance, which creates a restore point first.
- Stop the server while backing up, or back up the database before the files.
- Database dumps "do not contain photos or videos".
— [Immich docs: backup-and-restore.md](https://raw.githubusercontent.com/immich-app/immich/main/docs/docs/administration/backup-and-restore.md)
- "No, Immich does not modify the original files". Edits go to sidecar files and the database. — [FAQ.mdx](https://raw.githubusercontent.com/immich-app/immich/main/docs/docs/FAQ.mdx)
- The remote-access guide warns: "Never forward port 2283 directly to the internet". It also says "Immich is under very active development and the existence of severe security vulnerabilities cannot be ruled out." — [Immich docs: remote-access.md](https://raw.githubusercontent.com/immich-app/immich/main/docs/docs/guides/remote-access.md)

### Inferences
- **Stability vs. upkeep.** Immich is "stable" in the sense of a committed upgrade path. It still moves fast: a major version in July 2026, three minor versions since, and three patches within a week of v3.3.0. Expect to update about monthly, read the release notes, and occasionally edit `.env` for major versions. That is moderate, not zero, upkeep. The licenses appear to be voluntary; I found no evidence that any feature is gated behind them.
- **Front/back of prints.** Stacking a print's back under its front works in the main timeline (web and mobile). The v1.83 notes say album and other views show stack members individually, and I found no later note changing that. So relatives browsing a shared album or shared link would likely see backs as separate photos (unverified for v3.3). Alternatives:
  - Transcribe the back into the description, which is searchable.
  - Rely on OCR "Text in images" search. Its accuracy on handwriting is unknown.
  - Keep backs out of the albums you share.
- **Relatives' experience.** Shared links are the zero-login route. They give a link-scoped, album-style view without comments or likes. The full chronological timeline, people, map, memories and comments need logged-in accounts. Two possible setups:
  - Separate accounts per relative.
  - One shared "family" viewer account that receives partner sharing from the archivist's account. Partner sharing excludes face data, but v3.3 shared people can supply the names.
- **Uploads by relatives.** Shared links with "Allow public user to upload" give a no-login upload drop. Album editors (account holders) can also add photos.
- **Hardware fit.** A 4 GB VPS is below the 6 GB minimum unless ML is disabled. ML powers faces and smart search, the main draw for a family archive, so 8 GB or more of RAM on an x86-64-v2 CPU is the practical floor.

### Gaps
- I did not find documentation of the timeline scrubber in the pages fetched. It is a visible UI element, but it was not verified this session.
- I could not confirm current shared-link option names or a custom-slug option from the current docs. The rule that activity is not visible via an external link comes from archived (v1.106/v1.121) docs.
- I could not verify whether a native relative date offset was added after request #9586.
- I could not retrieve GitHub star counts or commit statistics, because the GitHub API was blocked in this session.
- I did not search r/selfhosted, r/immich or HN sentiment for 2025–2026 because the search budget ran out.
- I did not check whether the 2024 license prices are still current.

## 2. PhotoPrism: features, and free vs. paid (PhotoPrism+ membership)

### Takeaway
PhotoPrism is AGPL-licensed and actively released (Oct 7 and Sep 19, 2026 builds). It is a mature AI-assisted library with face recognition (improved for small faces in group photos), auto-labels, maps, Live Photos, WebDAV and an installable PWA. It flags undated pictures as "Unknown" and keeps manual edits in its index and YAML sidecars. Per-user management is gated:
- Essentials (€2/month, about $2.30, billed annually, so about €24/yr) adds extra user roles, 3D/satellite maps and enhanced geocoding.
- Plus (from €6/month, about $7) adds the web UI for user and account management.

### Cited Findings
- Recent releases: 261007 (Oct 7, 2026), 260919 (Sep 19, 2026), 260728 (Jul 28, 2026), 260601 (Jun 1, 2026), 260523 (May 23, 2026). — [GitHub releases](https://github.com/photoprism/photoprism/releases)
- The Oct 7, 2026 release:
  - New face clusters are auto-named when all matches agree, and manual corrections are better preserved.
  - Classification and NSFW detection now use ONNX; custom TensorFlow models are no longer supported.
  - Ollama/OpenAI configuration was improved.
  - Supported NVIDIA GPUs can run all built-in AI models.
  - Hardware transcoding now applies quality and bitrate settings.
  — [GitHub releases](https://github.com/photoprism/photoprism/releases)
- The Sep 19, 2026 release:
  - New face detection and embedding models find more faces, including small ones in group photos.
  - Existing libraries keep the old model until `photoprism faces migrate`, which keeps assigned names.
  - People can be marked Private or Hidden, which conceals names and face regions from unprivileged accounts while the photos stay visible.
  - Insta360 360° media is supported, and the default file size limit is now 5 GB.
  — [GitHub releases](https://github.com/photoprism/photoprism/releases)
- The November 2025 release added a Batch Edit dialog, improved face recognition, and Ollama/OpenAI integrations. — [Linuxiac](https://linuxiac.com/photoprism-ai-powered-photos-app-adds-batch-edit-dialog/)
- Batch edit changes "the metadata, albums, and labels of many pictures at once". You can select up to 999 pictures "if this feature is enabled". Fields that differ show `<mixed>`, and a new value overwrites all selected pictures. — [PhotoPrism docs: batch-edit.md](https://raw.githubusercontent.com/photoprism/photoprism-docs/master/docs/user-guide/organize/batch-edit.md); [docs.photoprism.app batch edit](https://docs.photoprism.app/user-guide/organize/batch-edit/)
- The README lists:
  - browsing "all your pictures" without worrying about RAW or video formats
  - search filters that "can be combined"
  - it "recognizes the faces of your family and friends"
  - auto-labels by content and location
  - "Six high-resolution World Maps" and privacy-preserving geocoding
  - Live Photos that play on hover
  - WebDAV access from Explorer and Finder
  - an installable PWA
  - multi-arch images for AMD, Intel and ARM, including Raspberry Pi and Apple Silicon
  - "all you need is a Web browser and Docker"
  - AGPL-3.0 license
  — [PhotoPrism README](https://raw.githubusercontent.com/photoprism/photoprism/develop/README.md)
- Official pricing:
  - Essentials: €2/month. Plus: from €6/month. Both are billed annually.
  - Essentials includes additional user roles, 3D vector and satellite maps, and enhanced geocoding.
  - Plus adds a web interface for account and session management (every edition has a command line for this), a user management UI and private members chat.
  — [PhotoPrism Editions (search summary)](https://www.photoprism.app/editions/)
- "most of the Essentials features (except additional user roles) are included in our public repository". Plus members get a free Lifetime Essentials membership after 24 months. Members eligible for lifetime features keep them after they stop paying; everyone else keeps the free features. — [PhotoPrism Membership KB (search summary)](https://www.photoprism.app/kb/membership)
- A third-party review lists $12/$24 per month, which conflicts with the official €2/€6 figures. Treat it as unreliable. — [scored.tools](https://scored.tools/blog/photoprism-review-2026/)
- For managed hosting, PhotoPrism's cloud page points to PikaPods, with Plus "from € 6.00 / mo" (about $7). — [PhotoPrism Cloud Hosting (search summary)](https://www.photoprism.app/cloud/)
- Dates and originals:
  - When no date metadata exists, "the file system modification time is used to sort pictures".
  - Pictures without a reliable creation date are "displayed as 'Unknown'" until set manually.
  - Dates estimated from file times are left out of monthly calendar albums.
  - Editing a date updates the index, not the originals.
  — [PhotoPrism FAQ](https://raw.githubusercontent.com/photoprism/photoprism-docs/master/docs/user-guide/faq.md)
- Manual edits "are not overwritten even when you reindex your library". The edit dialog has Details (including date), Labels, People ("assign names to faces") and Location (coordinates or map picker). — [PhotoPrism docs: edit.md](https://raw.githubusercontent.com/photoprism/photoprism-docs/master/docs/user-guide/organize/edit.md)
- Sidecars and originals:
  - PhotoPrism auto-creates and updates human-readable YAML sidecars as a backup. Edits made in the YAML are not synced back.
  - Standalone `.xmp` files are read by a "proof-of-concept" reader with limited fields.
  - PhotoPrism "generally does not write to the originals folder". Exceptions include rotating, unstacking files, uploading or importing, and deleting.
  — [PhotoPrism FAQ](https://raw.githubusercontent.com/photoprism/photoprism-docs/master/docs/user-guide/faq.md)
- The FAQ says folder "trees are required to manage responsibilities & permissions, which is what our editions for teams and businesses are built for". — [PhotoPrism FAQ](https://raw.githubusercontent.com/photoprism/photoprism-docs/master/docs/user-guide/faq.md)

### Inferences
- A family wanting each relative to have their own login and role will likely need Essentials (about $28/yr) or Plus (about $84/yr). The free Community Edition manages accounts only from the command line, and the user-management UI is a Plus feature.
- The "Unknown" date state and the exclusion of estimated dates from calendars are useful for finding scans that still need a date.
- The "unstacking files" exception shows PhotoPrism has a stacking concept. Whether it would pair `_front`/`_back` scans was not verified.

### Gaps
- I could not confirm whether the date editor allows partial or approximate dates (unknown day or month). The FAQ only confirms a fully "Unknown" state.
- I could not confirm whether Batch Edit includes date and time.
- I found no documentation of dates estimated from filenames or folders.
- I did not verify PhotoPrism's share-link features (password, expiry, guest upload) or any comments/likes.
- Hardware requirements (RAM/CPU) were not in the fetched docs.
- The editions page was read only via search summary, so I could not confirm whether "from €6" varies by term.

## 3. Piwigo (incl. Piwigo.com), Lychee, LibrePhotos, Photoview, Nextcloud Memories, Ente self-hosted, HomeGallery, PiGallery2: what stands out and how active each is

### Takeaway
All eight are active in 2026, but they serve different needs:
- Nextcloud Memories (v10.1.0, Oct 14, 2026) and LibrePhotos (1.4.0, Oct 17, 2026) are the most Immich-like and both support bulk date edits.
- Lychee (v7.11.1, Oct 13) and Piwigo (16.x; hosted Piwigo.com from €5/month for 50 GB) are classic album galleries suited to curated web sharing.
- Photoview and PiGallery2 are lightweight, read-only folder browsers with password-protected share links.
- HomeGallery is single-user.
- Ente self-hosting gives end-to-end encryption, but needs S3 storage, CORS setup and CLI quota administration.

### Cited Findings
**Piwigo**
- Piwigo.com hosting tiers, all excluding VAT and billed annually (USD at the assumed rate):

  | Storage | Price | Approx. USD |
  |---|---|---|
  | 50 GB | €5/month | ~$5.80 |
  | 100 GB | €10/month | ~$11.60 |
  | 250 GB | €25/month | ~$29 |
  | 500 GB | €50/month | ~$58 |
  | 1000 GB | €100/month | ~$116 |

  Separate support plans for self-hosted installs are free, Light €39, Standard €79 and Premium €150 per month. The page's metadata suggests it may be dated. — [Piwigo pricing (search summary)](https://piwigo.com/pricing)
- Older, conflicting figures exist, such as €540/yr for 50 GB, on a page about 5 years old. — [InMotion Piwigo plans](https://www.inmotionhosting.com/support/edu/software/piwigo/piwigo-plans/)
- Self-hosting requires a web server (Apache or nginx), PHP "7.4+", MySQL 5+ or MariaDB, and ImageMagick (recommended) or GD. License: GPL v2. The README mentions "Piwigo Cloud" as the ready-to-use option. — [Piwigo README](https://raw.githubusercontent.com/Piwigo/Piwigo/master/README.md)
- Releases: 16.4.0 (03 May, "Latest"), 16.3.0 (24 Feb), 16.2.0 (30 Dec), 16.1.0 (02 Dec), 16.0.0 (24 Nov). The page shows no years. — [Piwigo GitHub releases](https://github.com/Piwigo/Piwigo/releases)

**Lychee**
- Releases (years not displayed; the page is from 2026):
  - v7.11.1 (13 Oct).
  - v7.11.0 (12 Oct), labeled "BROKEN": Laravel 13, Pocket ID login, map shown as a header.
  - v7.10.0 (28 Sep): global gallery password, video loop, XSS fixes.
  - v7.9.0 (25 Sep): S3 prefix support, search v3, timeline v3 access checks.
  — [Lychee GitHub releases](https://github.com/LycheeOrg/Lychee/releases)
- Requires PHP 8.4+. Docker is recommended, and the example uses MariaDB 11. License: MIT. — [Lychee README](https://raw.githubusercontent.com/LycheeOrg/Lychee/master/README.md)
- The Supporter Edition costs €5/month (about $5.80), paid through GitHub or Open Collective sponsorship for a license key, with no trial or refunds. Its features include:
  - library statistics and user groups
  - watermarking and AES-secured links
  - white-labeling
  - per-album timeline customization and per-user upload quotas
  - multi-admin, personal favourites, and renaming rules on import
  The Free Edition has unlimited users, albums and uploads, under the same MIT license. — [Lychee SE overview](https://lycheeorg.dev/docs/se/overview/); [fitgap](https://us.fitgap.com/products/lychee); [Korben](https://korben.info/en/lychee-6-open-source-alternative-google-photos.html)

**LibrePhotos**
- 1.4.0 (17 Oct 2026, Latest) writes edits back to files and adds bulk date and location changes, search filters, album collections and an Archive. It fixes a security problem, and everyone is told to update. — [LibrePhotos releases](https://github.com/LibrePhotos/librephotos/releases)
- 1.3.0 (11 Oct 2026) moved tagging and semantic search to a single OpenCLIP model. It added a timeline filter and better browser video playback, and fixed security bugs, including two code-execution bugs. Multi-user instances are urged to upgrade. — [LibrePhotos releases](https://github.com/LibrePhotos/librephotos/releases)
- 1.2.0 (29 Sep 2026) added a standalone Windows build that needs no Docker, ONNX Runtime models, and Memories. — [LibrePhotos releases](https://github.com/LibrePhotos/librephotos/releases)
- All releases are published by one maintainer (derneuere), whose work is sponsored by one person. Outside contributors are credited. — [LibrePhotos releases](https://github.com/LibrePhotos/librephotos/releases)

**Photoview**
- The latest tagged release is v2.4.0 (23 Jun; year not shown), "the 1st release after project restart". The project had been "on hold". The previous release was v2.3.13 (26 Jul). — [Photoview releases](https://github.com/photoview/photoview/releases)
- v2.4.0 added CR3 support, swipe gestures, a Mapbox globe view on Places, and an option to turn off face detection at build time. It fixed a directory-traversal bug. Docker users had to adopt a new config. — [Photoview v2.4.0](https://github.com/photoview/photoview/releases/tag/v2.4.0)
- Commits continue through Oct 16, 2026. They include human fixes for share-token security (Sep 22–24, 2026) and timeline stacking of same-day photos (Oct 5, 2026). — [Photoview commits](https://github.com/photoview/photoview/commits/master)
- The repository has 151 open issues and 43 open PRs. — [Photoview releases](https://github.com/photoview/photoview/releases)
- The README describes:
  - "directories are mapped to albums", with each user given a filesystem path
  - share links for albums or media, optionally password protected
  - RAW and EXIF support, video, and face recognition
  - "read-only access to your media gallery"
  - "limited support"
  - support for SQLite, MariaDB, and PostgreSQL 17/18
  — [Photoview README](https://raw.githubusercontent.com/photoview/photoview/master/README.md)

**Nextcloud Memories**
- v10.1.0 (14 Oct 2026) and v10.0.0 (12 Oct 2026). v10 added PhotoSphere panoramas, transcoding for external and object storage, direct play, multiple transcoders and resumable downloads. The next Android app will be incompatible with older Memories versions. The repo has 439 open issues. — [Memories releases](https://github.com/pulsejet/memories/releases)
- Features:
  - a timeline sorted by date taken, parsed from Exif
  - "Rewind" ("Jump to any time in the past instantly")
  - people and objects through the Recognize or Face Recognition apps
  - a map with reverse geocoding
  - albums, and sharing "with people outside of your Nextcloud instance"
  - "Edit dates and other metadata on photos quickly and in bulk"
  - HLS transcoding
  - an Android client in early access, with Nextcloud apps handling auto-upload
  — [Memories README](https://raw.githubusercontent.com/pulsejet/memories/master/README.md)

**Ente (self-hosted)**
- The quickstart script is "a quick preview".
  - Needs at least 1 GB RAM, 1 CPU core, and Docker Compose.
  - Serves the Photos web app on port 3000, the Albums app (public album links) on 3002, and Auth on 3003.
  - Mobile apps can connect to a self-hosted server.
  - The docs say "Our entire source code, [including the server]... is open source" and "This is the same code we use on production."
  — [Ente self-hosting index.md](https://raw.githubusercontent.com/ente-io/ente/main/docs/docs/self-hosting/index.md)
- The server is a "lightweight Go binary, since most of the intensive computational tasks are done on the client". It needs Docker Compose 2.30+. — [Ente requirements.md](https://raw.githubusercontent.com/ente-io/ente/main/docs/docs/self-hosting/installation/requirements.md)
- Storage:
  - S3-compatible object storage is required. MinIO is bundled "for quick testing".
  - Replication needs three buckets.
  - The client and server "must be able to reach your S3 bucket at the same address".
  - CORS misconfiguration blocks uploads.
  — [Ente object-storage.md](https://raw.githubusercontent.com/ente-io/ente/main/docs/docs/self-hosting/administration/object-storage.md)
- Users:
  - The first registered user is treated as admin until admins are whitelisted in `museum.yaml`.
  - Registration can be disabled.
  - Storage quotas are raised with the Ente CLI.
  - Without SMTP, verification codes appear in the server logs.
  — [Ente users.md](https://raw.githubusercontent.com/ente-io/ente/main/docs/docs/self-hosting/administration/users.md)

**HomeGallery**
- It has no GitHub releases. Commits continue through Oct 13, 2026 (a version API and an umlaut fix). June 22, 2026 commits hardened security: `trustProxy` is off by default and the fallback IP rule now denies. One maintainer (xemle) does most of the work, with outside contributors. The repo has 41 open issues. — [HomeGallery commits](https://github.com/xemle/home-gallery/commits/master); [HomeGallery releases page](https://github.com/xemle/home-gallery/releases)
- Features: face detection and similar-face search, reverse-image (similar image) search, tagging, video transcoding, support for read-only and offline media sources, a PWA, and it "Runs on SoC such Raspberry PI".
- Limits stated in the README:
  - "One user only - all files are served".
  - It is a "private pet/spare time project without any warranty" whose setup "requires technical knowledge and technical maintenance".
  - By default it sends preview images to a public API for object and face detection.
  - The whole media database loads into the browser: 100,000 media items are about 100 MB of JSON.
  — [HomeGallery README](https://raw.githubusercontent.com/xemle/home-gallery/master/README.md)

**PiGallery2**
- Commits land almost daily, through Oct 18, 2026. They include "Fix sharing logout loop on password protection" and "Fix default view options in SharingManager". — [PiGallery2 commits](https://github.com/bpatrik/pigallery2/commits/master)
- Releases:
  - 3.5.2 (24 Jan; year not shown): photo frame mode, file upload, a sortable faces tab, and a new docs site. It has a breaking search change that recommends deleting the database and config.
  - 3.1.0 (07 Dec): partial Smart Photo Frame mode; requires reindexing.
  - 3.0.0 (27 Oct): XMP sidecar support, extensions and scoped galleries; dropped ARMv7.
  — [PiGallery2 releases](https://github.com/bpatrik/pigallery2/releases); [PiGallery2 3.5.2](https://github.com/bpatrik/pigallery2/releases/tag/3.5.2)
- The README says it is "Optimized for low-end hardware", is directory-first, and "Your photo folder is never modified". Raspberry Pi is a key target, Docker is recommended, and the license is MIT. — [PiGallery2 README](https://raw.githubusercontent.com/bpatrik/pigallery2/master/README.md)

### Inferences
| Platform | Activity (Oct 2026) | Stands out for a family archive | Main drawback / upkeep |
|---|---|---|---|
| Nextcloud Memories | Very active (v10.x Oct 2026) | Timeline, Rewind, map, faces, bulk date/metadata edits, external sharing | Requires running and upgrading a full Nextcloud stack (heavier) |
| LibrePhotos | Very active (3 releases in 3 weeks) | Bulk date/location edits, write-back to files, OpenCLIP search, Memories | Single maintainer; recent code-execution fixes mean internet exposure needs prompt updates |
| Lychee | Very active (v7.11.x) | Polished album gallery, password-protected galleries, unlimited users free | A release shipped "BROKEN" (fixed next day), so pin versions; some features in paid SE (€5/month) |
| Piwigo | Active (16.x) | Classic album gallery; runs on plain PHP/MySQL hosting; fully managed Piwigo.com | Hosted price scales steeply with GB (500 GB ≈ €50/month); fewer AI features verified |
| Photoview | Commits active; tagged releases rare | Simple read-only folder browser with password links and faces | "Limited support"; long gaps between releases |
| PiGallery2 | Very active commits | Fastest and lightest; read-only; photo-frame mode | Several releases needed database/config resets |
| HomeGallery | Active, single maintainer | Similar-image and face search on low-end hardware | Single user, no sharing; previews sent to a public API by default |
| Ente self-hosted | Active (same code as Ente cloud) | End-to-end encryption; public album links; light server | S3/MinIO, CORS and CLI quota admin; ML runs on client devices |

### Gaps
- Piwigo: I did not verify features such as privacy levels, batch manager, mobile apps or face/AI plugins, or the release years. I could not read the Piwigo.com pricing page directly, so its currency and date are not confirmed.
- Release years were not shown for Photoview v2.4.0 (possibly 2024; unverified), PiGallery2 3.5.2 and Lychee/Piwigo tags.
- Date-editing ability was not verified for Lychee, Piwigo and Photoview.
- Ente's default storage quota for self-hosted users and its CLI commands were not shown.
- GitHub star counts could not be retrieved (API blocked).

## 4. Genealogy: Gramps Web, webtrees and TNG as a photo archive where each photo links to people in a family tree

### Takeaway
Gramps Web is the strongest open-source fit and is actively released (v26.10.1, Oct 11, 2026). Its strengths:
- Media objects carry their own dates, using Gramps' date model, which handles "about/before/after/range/estimated" and year-only dates.
- Photo regions link to people, and since v26.10.1 also to families, events and places.
- Face detection assists tagging.
- Hosted options are cheap: Grampshub €4–10/month (about $4.65–11.60), or a DigitalOcean 1-Click from $6/month.

However, it is a genealogy database first. Browsing is person- and tree-centric, not an engaging chronological photo and video feed, and video handling is undocumented. webtrees (free, PHP, 2.2.6) shows media on an individual's "Album" tab. TNG (commercial, about $35) could not be checked for photo features.

### Cited Findings
**Gramps Web**
- Releases: v26.10.1 (11 Oct 2026), v26.10.0 (6 Oct), v26.9.1 (20 Sep), v26.9.0 (13 Sep), v26.8.1 (27 Aug), v26.8.0 (13 Aug). — [Gramps Web releases](https://github.com/gramps-project/gramps-web/releases)
- v26.10.1:
  - Image regions can link to people, families, events, places, sources or citations, with several regions per object in one image.
  - Blog posts can include inline images.
  - Tree charts export to SVG and can be drawn vertically.
  - The fan chart is animated.
- v26.10.0 added map filtering by time and event type and multi-device sync tokens. Other 2026 releases added timeline view improvements (v26.6.1), OIDC (v26.6.1) and persistent access tokens (v26.8.0).
— [Gramps Web releases](https://github.com/gramps-project/gramps-web/releases)
- The README lists:
  - ancestor, descendant, fan and hourglass charts
  - interactive maps with historical map overlays
  - a blog "in story format with images"
  - search, DNA match viewing and chromosome analysis
  - AI chat with your tree
  - 40+ languages and collaborative editing
  - "advanced privacy controls"
  - bi-directional sync with Gramps Desktop
  - demo roles: owner, editor, contributor and member
  - AGPL-3.0 license, 1.7k GitHub stars
  — [Gramps Web README](https://github.com/gramps-project/gramps-web)
- Photo tagging: "Gramps Web allows tagging people in photographs, similar to Gramps Desktop, linking the person and the media object."
  - Automated face detection shows dashed boxes over the image.
  - You click a box, press "person" and pick an existing person, or draw your own rectangle.
  - It requires edit permissions: "If you do not see this button, your user does not have edit permissions."
  — [Gramps Web docs: tagging.md](https://raw.githubusercontent.com/gramps-project/gramps-web-docs/main/docs/en/user-guide/tagging.md); [grampsweb.org tagging guide](https://www.grampsweb.org/user-guide/tagging)
- In Gramps core, the `Media` class inherits `DateBase` (`class Media(CitationBase, NoteBase, DateBase, AttributeBase, PrimaryObject)`), so each photo has its own date field. — [Gramps media.py](https://raw.githubusercontent.com/gramps-project/gramps/master/gramps/gen/lib/media.py)
- Gramps dates support:
  - modifiers: `MOD_BEFORE` (bef), `MOD_AFTER` (aft), `MOD_ABOUT` (abt), `MOD_RANGE`, `MOD_SPAN`, `MOD_FROM`, `MOD_TO`, `MOD_TEXTONLY`
  - qualities: `QUAL_ESTIMATED` (est) and `QUAL_CALCULATED` (calc)
  - partial dates (year only, or year and month, where zero means unknown)
  — [Gramps date.py](https://raw.githubusercontent.com/gramps-project/gramps/master/gramps/gen/lib/date.py)
- Requirements and hosting:
  - A typical Compose setup runs 3 containers: the app, a Celery worker and Redis.
  - Third-party guides suggest about 2 GB of free RAM and 10 GB of disk, or about 1.5 GB at idle.
  - The official DigitalOcean guide recommends at least 2 GB.
  - ARM images exist, and standard shared hosting is not compatible.
  — [selfhosting.sh Gramps Web](https://selfhosting.sh/apps/gramps-web/); [selfhosting.sh best genealogy](https://selfhosting.sh/best/genealogy-family/); [grampsweb.org DigitalOcean](https://www.grampsweb.org/install_setup/digital_ocean/); [grampsweb.org setup](https://www.grampsweb.org/setup/)
- The DigitalOcean 1-Click App costs from $6/month. — [Gramps forum: DO 1-click](https://gramps.discourse.group/t/gramps-web-digitalocean-1-click-app/2733)
- Grampshub plans: FAMILY at 4 €/month (500-person tree limit) and TRIBE at 10 €/month (10,000 people). The page's structured data also lists a CLAN tier at 7 €, which is inconsistent with the visible text. The trial is 14 days (a 2023 post said 7), and you can cancel monthly. — [Grampshub (search summary)](https://www.grampshub.com/); [Grampshub 2023 getting-started](https://www.grampshub.com/blog/en/2023/10/24/getting-started-with-grampshub.html)
- The Grampshub founder said "there will not be any paid or premium features". Gramps Web stays open source and self-hostable, and the smallest plan costs less than the smallest DigitalOcean droplet that can run Gramps Web. — [Grampshub announcement](https://gramps.discourse.group/t/announcing-grampshub-a-hosting-provider-for-gramps-web/3838)
- A forum user confirmed the smallest Grampshub plan caps the tree at 500 people. — [Gramps forum: maximum size](https://gramps.discourse.group/t/gramps-web-maximum-size/6973)
- Hostinger offers a one-click Gramps Web VPS (no prices in the results). — [Hostinger Gramps Web](https://www.hostinger.com/applications/gramps-web)
- Gramps Desktop does not read XMP face regions already embedded in images; a community patch exists but is out of date. — [Gramps forum: XMP face regions](https://gramps.discourse.group/t/suggested-update-to-phototagginggramplet-to-support-xmp-face-regions/1209)

**webtrees**
- Releases: 2.2.6 (29 Apr, "Latest"), 2.1.27 (29 Apr), 2.2.5 (13 Jan), 2.1.26 (13 Jan); years not shown on GitHub. — [webtrees GitHub releases](https://github.com/fisharebest/webtrees/releases)
- The blog dates 2.1.26 to 13 January 2026 (backports from 2.2.5). It describes 2.2.6 as a security-fix release that includes a configurable slideshow delay. — [webtrees blog](https://webtrees.net/blog/); [webtrees.net](https://webtrees.net)
- The core "Album" module is "An alternative to the 'media' tab, and an enhanced image viewer". It is a tab on an individual's page that shows media linked through OBJE records the viewer is allowed to see. — [webtrees AlbumModule.php](https://raw.githubusercontent.com/fisharebest/webtrees/main/app/Module/AlbumModule.php)
- Recent media fixes: 2.2.1 (Dec 2024) fixed watermarked image cropping, and 2.2.2 (Jul 2025) fixed broken links in the re-order media page. — [webtrees 2.2.1](https://webtrees.net/blog/2024/11/30/new-webtrees-release-2-2-1.html); [webtrees 2.2.2](https://webtrees.net/blog/2025/07/29/new-webtrees-release-2-2-2.html)

**TNG (The Next Generation of Genealogy Sitebuilding)**
- The official site lists 15.0.4 as the current version. A news post says 15.0.4 "launched on October 19" (year not shown). — [tngsitebuilding.com](https://tngsitebuilding.com/); [slekt1](https://slekt1.com/en/tng-15-0-4-launched-october-19/)
- TNG is commercial: "$34.99 USD one-time license fee", quoted for version 14. Existing users get discounted upgrades. — [LCGS repost of TNG 14 announcement](https://lcgsco.org/announcing-a-major-upgrade-for-the-next-generation-of-genealogy-sitebuilding-or-tng/)

### Inferences
- Gramps Web answers "who is in this photo, how are they related, and roughly when was it taken" better than any photo app, thanks to true approximate and partial dates and person-linked regions. As the main browsing site for older relatives, it is weaker: I found no evidence of a chronological all-media feed, memories, or a polished video player.
- A common pattern would be Immich (or similar) for browsing plus Gramps Web for the tree with key photos linked. That doubles the data entry for people and dates.
- In Gramps Web, tagging requires edit rights. Older relatives would browse as members while one or two family historians tag.
- webtrees fits a PHP-hosting budget and shows each person's photos on their page. Without verified region tagging or a photo timeline, it looks more like a tree site with attached media than a photo archive.

### Gaps
- Gramps Web: I could not find out whether face detection runs in the browser or on the server, or how video media is handled. I also could not confirm whether there is a chronological or gallery view of all media, or Grampshub's media storage limits and data-center location.
- webtrees: I did not verify whether media records carry dates, whether photo-region or face tagging is available (core or third-party), or the current PHP requirement.
- TNG: I did not verify photo region tagging ("image maps") or other media features, or v15 pricing and release year.

## 5. Hosting: home NAS vs. mini PC vs. VPS for ~100–500 GB; managed hosting (PikaPods, Elestio) prices; remote access (Tailscale, Cloudflare Tunnel, reverse proxy)

### Takeaway
For 100–500 GB, the lowest-effort paid route is managed Immich on PikaPods: about $7/month at minimum, and one user reported just under $10/month for 175 GB in early 2025. Elestio starts around $11–17/month. The cheapest long-run route is a home mini PC or NAS: you pay for hardware once, then power and offsite backups.

A budget VPS is awkward:
- Immich needs 6–8 GB RAM, but Hetzner's CX23 has 4 GB.
- Hetzner raised prices on June 15, 2026, and reportedly restricted ordering of its cost-optimized plans.
- 100–500 GB needs extra block or network storage.

Piwigo.com is simplest but costs €50/month (about $58) at 500 GB. For relatives who just click a link, the server needs a public HTTPS address (reverse proxy or Cloudflare Tunnel). Tailscale-only access means installing an app on every relative's device.

### Cited Findings
**Managed hosting**
- PikaPods pricing rules:
  - The minimum pod configuration costs $1.80/month, and new accounts get a $5 welcome credit.
  - Configurations range from 0.25 to 6 CPU, 0.25 to 16 GB RAM, and 5 to 1000 GB storage.
  - Resources get cheaper per unit as you allocate more.
  - Stopped pods still pay for storage, with a $1 floor.
  - New-pod prices may change; existing pods keep their price.
  — [PikaPods](https://pikapods.com/); [PikaPods FAQ](https://docs.pikapods.com/faq)
- Immich on PikaPods:
  - "from $6.80/mo", rising with CPU, RAM and storage. This comes from a competitor's comparison, about Sep 2026. — [InstaPods vs PikaPods](https://instapods.com/vs/pikapods/)
  - A user reported "175GB of photos and videos ... just under $10 a month" (about early 2025). — [micro.blog thread](https://micro.blog/rom/55606229)
  - Storage goes up to 1 TB. — [ecosistemastartup](https://ecosistemastartup.com/?p=103989)
  - PikaPods publishes an official Immich tutorial. — [PikaPods Immich tutorial](https://docs.pikapods.com/tutorials/photo/immich-1-basics/)
- Elestio for Immich:
  - "From $11/mo" with a 3-day trial; the price varies by provider and region. — [itechguides](https://www.itechguides.com/products/elestio-immich/)
  - 2 vCPU + 4 GB RAM is about $17/month on Hetzner EU. — [Elestio vs Fly.io](https://elest.io/elestio-vs-fly-io)
  - 2 vCPU/4 GB is about $16/month on Netcup. Plans are fixed-price and billed hourly from prepaid credits. The trial gives $20 of credit valid for 3 days. Powering off does not stop billing. — [Elestio pricing FAQ](https://docs.elest.io/books/frequently-asked-questions/page/how-does-elestios-pricing-work/export/markdown)
- Other managed or low-cost options (details in Q2–Q4):
  - PhotoPrism Plus via PikaPods: from €6/month (about $7). — [PhotoPrism Cloud](https://www.photoprism.app/cloud/)
  - Grampshub: €4–10/month. — [Grampshub](https://www.grampshub.com/)
  - Gramps Web DigitalOcean 1-Click: from $6/month. — [Gramps forum](https://gramps.discourse.group/t/gramps-web-digitalocean-1-click-app/2733)
  - Piwigo.com: €10/month for 100 GB, €25 for 250 GB, €50 for 500 GB. — [Piwigo pricing](https://piwigo.com/pricing)

**VPS**
- Hetzner's June 15, 2026 price adjustment raised CX23 from €3.99 to €5.49/month, excluding IPv4 (Germany and Finland). — [Hetzner docs: price adjustment](https://docs.hetzner.com/general/infrastructure-and-availability/price-adjustment/)
- CX23 is 2 vCPU, 4 GB RAM, 40 GB SSD and 20 TB traffic, at €5.99/month including IPv4 and excluding VAT (about $6.95). — [Better Stack Hetzner review](https://betterstack.com/community/guides/web-servers/hetzner-cloud-review/)
- Third-party 2026 write-ups report two availability limits. As of 2026-10-07, Hetzner marked all Cost-Optimized plans (CX23, CAX11–41) "not available". New servers have been restricted since 26 June 2026. I did not confirm which write-up says which. — [bex.co](https://bex.co/blog/2026/10/14/hetzner-2026-price-hikes-traffic-trap); [Northflank](https://northflank.com/blog/hetzner-cloud-server-price-increases); [Bytesized Hosting](https://bytesized-hosting.com/guides/seedbox-or-a-vps-in-2026-we-priced-hetzner-after-the-june-increase)
- One review headline gives Hetzner "EU Plans From $6.49, US Plans From $20.49", so US regions cost more. — [bestusavps](https://bestusavps.com/reviews/hetzner/)
- Immich's database must sit on local SSD, never a network share. — [Immich requirements.md](https://raw.githubusercontent.com/immich-app/immich/main/docs/docs/install/requirements.md)

**Home NAS**
- Synology's 2025 Plus models, including the DS225+, officially support only Synology-branded drives.
  - DSM may block or degrade RAID creation, expansion or volume initialization with unlisted WD Red, IronWolf or N300 drives.
  - Drive pools migrated from older units are accepted, but repairing or expanding them needs compatible drives.
  — [NASCompares DS225+ review](https://nascompares.com/2025/08/04/synology-ds225-nas-review/)
- An affiliate page lists the DS225+ chassis at $364.99, which may be unreliable. — [datacenterdisk](https://datacenterdisk.com/nas-devices/synology/ds225-plus)

**Remote access (Immich's guide)**
- Each option's trade-offs:
  - VPN (WireGuard/OpenVPN): "Simple to set up and very secure", but needs Dynamic DNS, an open router port, and a client on every device.
  - Tailscale: peer-to-peer WireGuard that works through NAT with no open port and minimal configuration. It is "a paid service with a free tier for personal use", must run on both ends, and its client usually runs as root.
  - Reverse proxy with your own domain or DDNS: HTTPS like any website, and the mobile apps work without a VPN client. Setup is complex, and the web UI and API may be exposed to the internet. Let's Encrypt is the recommended certificate source.
  - Cloudflare appears only as a remote reverse proxy that hides the server's IP. Cloudflare Access can shield the instance from zero-day bugs.
  — [Immich remote-access.md](https://raw.githubusercontent.com/immich-app/immich/main/docs/docs/guides/remote-access.md)
- Cloudflare's free and Pro plans cap request bodies at 100 MB. That breaks uploads of large or long videos through a tunnel or proxy, and Immich does not split uploads into chunks. Workarounds include uploading on the LAN and bypassing the tunnel. — [localtonet guide](https://localtonet.com/blog/cloudflare-tunnel-alternative); [Immich discussion #13573](https://github.com/immich-app/immich/discussions/13573); [Immich discussion #23862](https://github.com/immich-app/immich/discussions/23862)
- Immich's Chromecast casting requires the instance to be publicly reachable over HTTPS. — [Immich casting.md](https://raw.githubusercontent.com/immich-app/immich/main/docs/docs/features/casting.md)

### Inferences
- **Realistic monthly cost bands (100–500 GB):**
  - Managed Immich: about $7–10/month near the low end of the range (PikaPods). How it scales toward 500 GB is not published, so check PikaPods' pricing slider. Elestio is about $11–17/month plus storage.
  - Piwigo.com: about $11.60 (100 GB) to $58 (500 GB) per month, plus VAT.
  - VPS: a 4 GB Hetzner box is about $6.40–7/month, but it is under-specified for Immich with ML and lacks storage for 100–500 GB.
  - Home server: no monthly fee beyond power and an offsite backup copy. Power at an assumed 10–15 W average is about 7–11 kWh/month, roughly $1.20–1.90/month at an assumed $0.17/kWh. Both the wattage and the rate are assumptions, not sourced.
- **Hybrid home setup.** A home mini PC or NAS running Immich, exposed through Cloudflare Tunnel (or a reverse proxy) for viewing, gives relatives a normal web link. The 100 MB cap only affects uploads, so the archivist uploads scans on the LAN. A Synology DS225+ adds the drive-policy restriction and probably needs a RAM upgrade for Immich (see Gaps).
- **Usability for older relatives.** A public HTTPS URL is effectively required for "click a link and browse", and for casting to a TV. Tailscale-only access means installing and signing into an app on each relative's device, which is a real barrier for non-technical users.
- **Backups.** Every self-hosted route needs a second copy. Immich's own guidance is 3-2-1 with database dumps plus originals, so budget for an offsite target.

### Gaps
- Tailscale's free-plan user and device limits, node sharing, and Funnel availability were not verified (tailscale.com was unreachable and the search budget ran out).
- I did not check Cloudflare's terms of service on serving video and large media through tunnels.
- Hetzner Volume prices and Storage Box prices are unverified. One search summary gave BX11 1 TB at €3.20/month, 5 TB €10.90, 10 TB €20.80 and 20 TB €40.60, attributed to Hetzner docs read Oct 10, 2026, but I could not identify the specific page. Prices for larger CX/CPX plans with 8 GB+ RAM were not found.
- Mini-PC hardware prices and measured power draw were not researched.
- I could not check DS225+ stock RAM or current Synology prices, or whether a DSM update after the 2025 policy relaxed third-party drive rules. My unverified understanding is that the DS225+ ships with low RAM that needs expanding for Immich's 6 GB minimum.
- Offsite backup costs were not checked (backblaze.com blocked).
- I could not find PikaPods' per-GB price, its data-center locations, or whether it hosts Gramps Web. Elestio's storage add-on prices were not found.

## 6. Which option is friendliest for non-technical relatives who just want to click a link and browse?

### Takeaway
For link-only access among self-hosted tools, Immich's public shared links are the most capable experience: no account, optional password and expiry, optional download and upload, plus a polished viewer and video player. Link viewers see a link- or album-scoped view without comments or likes. For the full experience (timeline, people, map, memories, comments, mobile app), relatives need logins.

Piwigo.com is the lowest-upkeep option for link sharing because it is fully managed. PhotoPrism, Photoview, PiGallery2, Lychee and Ente all offer password or public links. Gramps Web and webtrees are login- and tree-centric, and HomeGallery is single-user.

### Cited Findings
- Immich public links need no account. They use a random secret URL with optional password, expiry, "Show metadata", "Allow public user to download" and "Allow public user to upload". — [Immich sharing.md](https://raw.githubusercontent.com/immich-app/immich/main/docs/docs/features/sharing.md); [archived docs v1.121.0](https://v1.121.0.archive.immich.app/docs/features/shared-albums)
- Immich's archived docs say "Activity is not visible when sharing an album via external link". Comments and likes are for account holders in shared albums. — [archived docs v1.121.0](https://v1.121.0.archive.immich.app/docs/features/shared-albums)
- Immich features that suit older relatives:
  - a mobile slideshow and a "Recently Added" page (v3.0) — [GitHub v3.0.0](https://github.com/immich-app/immich/releases/tag/v3.0.0)
  - Chromecast or Nest Hub casting from the web, which needs public HTTPS — [Immich casting.md](https://raw.githubusercontent.com/immich-app/immich/main/docs/docs/features/casting.md)
  - birthday memories and shared people (v3.3) — [GitHub v3.3.0](https://github.com/immich-app/immich/releases/tag/v3.3.0)
- Immich partner sharing and shared albums require Immich accounts. Partner sharing excludes face data. — [Immich partner-sharing.md](https://raw.githubusercontent.com/immich-app/immich/main/docs/docs/features/partner-sharing.md)
- Immich's reverse-proxy option lets people use it "like any website", and the mobile apps work without VPN clients. — [Immich remote-access.md](https://raw.githubusercontent.com/immich-app/immich/main/docs/docs/guides/remote-access.md)
- PhotoPrism is an installable PWA with "a native app-like experience" and mentions sharing pictures. People can be marked Private or Hidden, which hides names and face regions from unprivileged accounts. — [PhotoPrism README](https://raw.githubusercontent.com/photoprism/photoprism/develop/README.md); [PhotoPrism releases](https://github.com/photoprism/photoprism/releases)
- Photoview shares albums or media via public link with optional password. — [Photoview README](https://raw.githubusercontent.com/photoview/photoview/master/README.md)
- PiGallery2 has password-protected sharing; fixes for it landed Oct 18, 2026. — [PiGallery2 commits](https://github.com/bpatrik/pigallery2/commits/master)
- Lychee added a global gallery password in v7.10.0; the Supporter Edition adds "AES-secured links". — [Lychee releases](https://github.com/LycheeOrg/Lychee/releases); [Lychee SE overview](https://lycheeorg.dev/docs/se/overview/)
- Ente's self-hosted Albums app (port 3002) serves public album links. — [Ente self-hosting index.md](https://raw.githubusercontent.com/ente-io/ente/main/docs/docs/self-hosting/index.md)
- Nextcloud Memories can share with "people outside of your Nextcloud instance". — [Memories README](https://raw.githubusercontent.com/pulsejet/memories/master/README.md)
- HomeGallery is "One user only". — [HomeGallery README](https://raw.githubusercontent.com/xemle/home-gallery/master/README.md)
- Gramps Web is organized around roles (owner, editor, contributor, member), and tagging requires edit permission. — [Gramps Web README](https://github.com/gramps-project/gramps-web); [Gramps Web tagging.md](https://raw.githubusercontent.com/gramps-project/gramps-web-docs/main/docs/en/user-guide/tagging.md)

### Inferences
- A plausible ranking for "click a link and browse" with low cognitive load:
  1. Immich shared link to a large "Family Archive" album, or several albums by decade.
  2. Piwigo.com or Lychee public or password galleries.
  3. PhotoPrism or Photoview links.
  4. Gramps Web or webtrees, which need logins and tree navigation.
- For the "browse everything in chronological order" goal, the best Immich setup is probably one shared viewer account. It receives partner sharing, so it sees the archivist's whole timeline, and v3.3 shared people show names. Relatives get a single username and password, or the app stays signed in on a tablet.
- Avoid VPN-only access for elderly relatives. Use HTTPS on a memorable domain.

### Gaps
- I found no usability studies or community reports (Reddit/HN) on elderly relatives using these tools; the search budget was exhausted.
- I could not confirm whether an Immich shared link to an album presents a full chronological timeline with a date scrubber.

## 7. How each platform handles scans without EXIF dates (filename-based dates, XMP sidecars, bulk date editing)

### Takeaway
None of the photo apps verified here supports true approximate dates. Immich and PhotoPrism need an exact date. For scans without a date, both fall back to file timestamps (PhotoPrism also flags them as "Unknown"). Neither has a documented filename-to-date parser.

The robust workflow is to write dates into the files before import. Use ExifTool (for example, from structured filenames), or Immich-readable XMP sidecars named `photo.jpg.xmp`. Then use bulk editing to correct remaining dates:
- Immich: set an exact date for many items; relative offsets need third-party tools.
- PhotoPrism: batch edit of up to 999 items (whether dates are included is unconfirmed).
- LibrePhotos 1.4 and Nextcloud Memories: bulk date edits.

Only Gramps' date model handles "about 1955", ranges, "estimated" and year-only dates natively.

### Cited Findings
**Immich**
- Date fallback: one user reported thousands of EXIF-less photos all showing the date the files were moved to the drive. A search summary attributed a fallback rule to the Immich FAQ: file create date first, then modified date. The current FAQ.mdx on main does not contain that wording, so treat the exact order as unconfirmed. — [Immich discussion #7654](https://github.com/immich-app/immich/discussions/7654); [Immich FAQ.mdx](https://raw.githubusercontent.com/immich-app/immich/main/docs/docs/FAQ.mdx)
- The FAQ notes that for files with no metadata (for example WhatsApp), "Immich has no way of knowing the original date". — [Immich FAQ.mdx](https://raw.githubusercontent.com/immich-app/immich/main/docs/docs/FAQ.mdx)
- Immich reads XMP sidecars:
  - Dates are taken in priority order, from `exif:SubSecDateTimeOriginal` through `xmp:DateTimeCreated`.
  - Also read: description (`dc:description`), rating, tags (digiKam, Lightroom, IPTC keywords) and GPS.
  - Naming: `IMG_0001.jpg.xmp` is preferred, with `IMG_0001.xmp` as a fallback; `.jpg.xmp` wins if both exist.
  — [Immich xmp-sidecars.md](https://raw.githubusercontent.com/immich-app/immich/main/docs/docs/features/xmp-sidecars.md)
- Immich writes back to XMP:
  - It automatically queues a Sidecar Write job after edits to description, rating or tags.
  - Date (`exif:DateTimeOriginal`, `photoshop:DateCreated`) and GPS are listed as written fields.
  - Writes merge with existing sidecar content.
  - On read-only mounts, "metadata edits will silently fail".
  — [Immich xmp-sidecars.md](https://raw.githubusercontent.com/immich-app/immich/main/docs/docs/features/xmp-sidecars.md)
- Edited metadata is saved to `.xmp` sidecars and the database, and originals are not modified. In read-only external libraries, timestamps can't be edited at all. — [Immich FAQ.mdx](https://raw.githubusercontent.com/immich-app/immich/main/docs/docs/FAQ.mdx)
- Bulk editing:
  - Change-date sets one exact date and time across the selection; there is no native relative offset. — [Immich discussion #9586 (mirror)](https://git.tdem.in/immich-app/immich/discussions/9586)
  - Folder view supports multi-select change date and location (since v1.124). — [Linuxiac](https://linuxiac.com/immich-1-124-brings-tagging-fixes-and-enhancements/)
  - immich-power-tools adds a "Bulk Date Offset". — [BrightCoding](https://blog.brightcoding.dev/2026/09/24/immich-power-toolsimmich-power-tools-bulk-organize-your-self-hosted-immich-library)
- v3.2.0 sorts photos taken in the same second by filename. v3.0.0 keeps the chosen timezone on date edits. — [GitHub v3.2.0](https://github.com/immich-app/immich/releases/tag/v3.2.0); [GitHub v3.0.0](https://github.com/immich-app/immich/releases/tag/v3.0.0)

**Pre-import tooling**
- ExifTool's author, Phil Harvey, gave a command that sets `AllDates` (DateTimeOriginal, CreateDate, ModifyDate) from filenames of the form `YYYY-MM-DD HH:MM:SS`, only when no date tags exist. — [ExifTool forum](https://exiftool.org/forum/index.php?msg=86063)
- A community script, immich-datetime-fix, tries several other date tags before falling back to the file change date. — [Immich discussion #7654](https://github.com/immich-app/immich/discussions/7654)

**PhotoPrism**
- It uses file modification time for sorting when no date metadata exists. Pictures without a reliable date show as "Unknown" until set manually. Dates estimated from file times are excluded from monthly calendars. Edits change only the index. — [PhotoPrism FAQ](https://raw.githubusercontent.com/photoprism/photoprism-docs/master/docs/user-guide/faq.md)
- Edits survive reindexing. PhotoPrism writes YAML sidecars, and its XMP reading is a limited "proof-of-concept". — [PhotoPrism edit.md](https://raw.githubusercontent.com/photoprism/photoprism-docs/master/docs/user-guide/organize/edit.md); [PhotoPrism FAQ](https://raw.githubusercontent.com/photoprism/photoprism-docs/master/docs/user-guide/faq.md)
- Batch edit covers up to 999 pictures ("metadata, albums, and labels"); whether date is included was not confirmed. — [PhotoPrism batch-edit.md](https://raw.githubusercontent.com/photoprism/photoprism-docs/master/docs/user-guide/organize/batch-edit.md)
- An ExifTool forum user reported PhotoPrism did not pick up dates stored in XMP until they were copied into the creation-date tag. — [ExifTool forum](https://exiftool.org/forum/index.php?msg=81864)

**Others**
- LibrePhotos 1.4.0 supports bulk date and location changes and writes edits back to files. — [LibrePhotos releases](https://github.com/LibrePhotos/librephotos/releases)
- Nextcloud Memories: "Edit dates and other metadata on photos quickly and in bulk"; its timeline uses the date taken from Exif. — [Memories README](https://raw.githubusercontent.com/pulsejet/memories/master/README.md)
- PiGallery2 3.0.0 added XMP sidecar support. "Your photo folder is never modified", so dates must be fixed outside the app. — [PiGallery2 releases](https://github.com/bpatrik/pigallery2/releases); [PiGallery2 README](https://raw.githubusercontent.com/bpatrik/pigallery2/master/README.md)
- Photoview parses EXIF and provides "read-only access"; its README mentions no date editing. — [Photoview README](https://raw.githubusercontent.com/photoview/photoview/master/README.md)
- HomeGallery's README does not mention date editing, and its sources are read-only. — [HomeGallery README](https://raw.githubusercontent.com/xemle/home-gallery/master/README.md)
- Gramps and Gramps Web:
  - Media objects have their own date. — [Gramps media.py](https://raw.githubusercontent.com/gramps-project/gramps/master/gramps/gen/lib/media.py)
  - Dates support before, after, about, range, span, from and to; estimated and calculated qualities; and year-only or year-month values. — [Gramps date.py](https://raw.githubusercontent.com/gramps-project/gramps/master/gramps/gen/lib/date.py)

### Inferences
- **Suggested pipeline for prints.**
  1. Name scans with a sortable date prefix and sequence, for example `1962-07-00_Richards_beach_01.jpg`.
  2. Run ExifTool to write DateTimeOriginal into the JPEG or an XMP sidecar, with a convention for unknown parts (for example July 1 for "summer 1962", or January 1 for year-only).
  3. Record "circa"/"approx." in the description or a tag, because Immich and PhotoPrism can't store uncertainty.
  4. Import into a writable (upload or read-write) library, so in-app date fixes are possible and written to sidecars.
  5. Keep the archive's master metadata in the files and sidecars, so a future move to another platform or a custom site preserves the dates.
- Because Immich sorts same-second items by filename, a batch of scans given one approximate date will still display in scan or filename order.
- If approximate dates must be shown honestly ("about 1955"), only Gramps Web models that natively. A photo app would need a naming or description convention.

### Gaps
- I found no documentation of filename-based date parsing in Immich or PhotoPrism, so it is assumed absent but unconfirmed.
- I could not confirm whether PhotoPrism's date editor accepts unknown day or month values, or whether its batch edit includes dates.
- Date-editing support in Lychee, Piwigo and Photoview was not verified.
- Whether Immich writes date edits into XMP automatically (as it does for description, rating and tags) is implied by the "written fields" list but not explicitly stated.
