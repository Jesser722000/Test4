# Low-code and template-based archive, collection, timeline, and photo-storytelling builders for a private Richards/Arant family photo + home-video archive (state as of October 2026)

*How these notes were gathered: GitHub repository activity ("last push" dates, stars, open issues) comes from GitHub's repository-search API, retrieved 2026-10-18. Release dates come from each project's public GitHub releases page or `releases.atom` feed. WebFetch could not resolve several official domains (collectionbuilder.github.io, omeka.net, timeline.knightlab.com, tiki-toki.com, sigal.readthedocs.io). Facts from those domains come from search-engine summaries of the pages, so their exact wording was not checked directly. The session's web-search budget ran out before the last few checks, and the Gaps sections list what is still open.*

## CollectionBuilder (CollectionBuilder-GH, -CSV, -Sheets): metadata CSV, Browse/Subjects/Map/Timeline/Data pages, video and audio, hosting, family-only privacy, examples

### Takeaway
CollectionBuilder fits the "spreadsheet of metadata plus a folder of files" workflow most directly. CollectionBuilder-CSV is the actively developed variant: last push 2026-10-08. From one metadata CSV it builds Browse, Subjects, Map, Timeline, and Data pages, and it can play self-hosted video files in an HTML5 `<video>` player as well as embedding YouTube and Vimeo. CollectionBuilder has no login or access control of its own. A family-only site has to get privacy from the host (for example, Netlify's visitor-access controls). The CB-Sheets variant is built around a *published* Google Sheet, so its metadata is public.

### Cited Findings
- **What it is / variants:** CB-GH is "A framework for creating digital exhibits from a folder of files and a spreadsheet." It is a GitHub template repo, MIT-licensed, 130 stars, last push 2025-10-06, with a demo at collectionbuilder.github.io/collectionbuilder-gh/. — [GitHub: collectionbuilder-gh](https://github.com/CollectionBuilder/collectionbuilder-gh)
- The GitHub Pages version (CB-GH) takes a CSV of collection metadata and a folder of JPEG images, PDF documents, MP3s, or links to videos. CollectionBuilder comes from the University of Idaho Library. — [GitHub: collectionbuilder-gh](https://github.com/CollectionBuilder/collectionbuilder-gh); [About CollectionBuilder](https://collectionbuilder.github.io/about.html)
- CB-CSV is described as a "stand alone" template for creating digital collection and exhibit websites using Jekyll and a metadata CSV. Repo stats: 44 stars, 46 forks, 696 commits, 31 open issues, last push 2026-10-08, no GitHub Releases published. "The static site can run on any basic web server" and can be built automatically with GitHub Actions. — [GitHub: collectionbuilder-csv](https://github.com/CollectionBuilder/collectionbuilder-csv)
- CB-Sheets is "A framework for creating digital exhibits by loading collection metadata directly from a CSV (such as a published Google Sheet!)." Repo stats: 15 stars, last push 2026-10-02, demo at collectionbuilder.github.io/collectionbuilder-sheets/. — [GitHub: collectionbuilder-sheets](https://github.com/CollectionBuilder/collectionbuilder-sheets)
- **Metadata CSV (CB-CSV):** The `object_location` field can hold a file path or an external link. The item's `display_template` value decides how it renders (for example, a download button, an image gallery, or a video viewer). Built-in templates generally cover jpg, png, pdf, and mp3, plus YouTube, Vimeo, and external links. — [CB docs: Recipes for CSV Object Locations](https://collectionbuilder.github.io/cb-docs/docs/metadata/object-paths/)
- **YouTube items:** set `display_template` to `video` and put the full YouTube link in `object_location`. The docs suggest building an `image_small` thumbnail URL from the YouTube video ID. **Vimeo items:** same setup, but Vimeo has no documented thumbnail API, so the docs suggest making screenshots as derivative images. If `image_thumb` is blank, the item shows a video icon. — [CB docs: object-paths](https://collectionbuilder.github.io/cb-docs/docs/metadata/object-paths/)
- **Metadata-only records:** "You can leave 'object_location', 'image_small', and 'image_thumb' blank, and your record will be a metadata-only record." — [CB docs: object-paths](https://collectionbuilder.github.io/cb-docs/docs/metadata/object-paths/)
- **GH/Sheets metadata differs from CSV:** these variants use `youtubeid` and `vimeoid` fields ("only required for YouTube/Vimeo video items") and leave `filename` blank for those items. — [CB docs: GH and SHEETS Metadata](https://collectionbuilder.github.io/cb-docs/docs/metadata/gh_metadata/)
- **Self-hosted video and audio in CB-CSV:** the template's `_includes/item` folder contains `audio-player.html`, `video-player.html`, `video-embed.html`, `ia-embed.html` (Internet Archive), `pdf-embed.html`, `panorama.html`, `3d-model-viewer.html`, `iiif-manifest-universal-viewer.html`, `image-gallery.html`, and `mini-map.html`. — [GitHub: CB-CSV _includes/item](https://github.com/CollectionBuilder/collectionbuilder-csv/tree/main/_includes/item)
- `video-player.html` "Adds html video element with source given in object_location." It uses `image_small` as the poster image and falls back to a download link in browsers that can't play video. It contains no YouTube or Vimeo logic; those go through the separate embed include. — [GitHub: video-player.html](https://github.com/CollectionBuilder/collectionbuilder-csv/blob/main/_includes/item/video-player.html)
- **Pages:**
  - Map: Leaflet-based clusters that open the related objects; needs latitude/longitude fields.
  - Timeline: browse the collection chronologically. Dates should be formatted yyyy-mm-dd, and the docs suggest keeping messy or uncertain dates in a separate field such as "date_created."
  - Subjects: a word cloud from the `subject` field. Values are semicolon-separated, and the field must be named exactly "subject."
  - Data: a table view of all metadata, with downloads.
  - Browse: the main listing of all items.
  — [UTK Open Sandbox CollectionBuilder workshop](https://utk-collection-builder.readthedocs.io/en/latest/contents/1_outline.html); [CB docs: GH and SHEETS Metadata](https://collectionbuilder.github.io/cb-docs/docs/metadata/gh_metadata/)
- **Hosting:** CB docs say a variety of third-party cloud hosts can integrate with GitHub to build and host the static site, "often free of charge." The biggest named are Cloudflare, Netlify, and Render. On Render, `url` and `baseurl` in `_config.yml` must be left blank. — [CB docs: Deploy via Third Party Services](https://collectionbuilder.github.io/cb-docs/docs/deploy/thirdparty/)
- **Family-only access via host (Netlify):** visitor access is set under Project configuration > General > Visitor access. There are two options: "Password" (one shared password, Pro only) or "Private" (team members and invitees, enforced with a Netlify login). Netlify recommends Private because you can invite people by email and there's no shared secret. — [Netlify KB: password-protect a site](https://www.netlify.com/knowledge-base/how-to-password-protect-a-netlify-site-or-deploy-previews/); [Netlify docs: Password Protection](https://docs.netlify.com/manage/security/secure-access-to-sites/password-protection/)
- An older Netlify blog post says Free/Personal plans can require a username and password through a small config file in the repo. This conflicts with the current docs, which describe password protection as a Pro feature, so treat it as possibly outdated. — [Netlify blog](https://www.netlify.com/blog/restricting-access-to-netlify-sites-with-passwords/); contrast [Netlify docs](https://docs.netlify.com/manage/security/secure-access-to-sites/password-protection/)
- AWS S3 has no built-in site password. The `s3-basic-auth` npm package puts Basic Authentication in front of a bucket, but it requires running an Express server. — [npm: s3-basic-auth](https://www.npmjs.com/package/s3-basic-auth)
- **Learning resources and example uses:**
  - CollectionBuilder's tutorials walk through building an example collection from demo metadata. — [CB Tutorials](https://collectionbuilder.github.io/tutorials.html)
  - A Programming Historian lesson builds a digital exhibition with CollectionBuilder and the Internet Archive; its required `filename` field holds a direct URL to each object. — [Programming Historian](https://programminghistorian.org/en/lessons/digital-exhibition-collectionbuilder)
  - The GLAM Workbench's Trove Data Guide shows how to share a Trove list as a CollectionBuilder exhibition. — [Trove Data Guide](https://tdg.glam-workbench.net/pathways/collections/collectionbuilder.html)
  - CollectionBuilder also publishes an oral-history site/template. — [cb-oralhistory](https://collectionbuilder.github.io/cb-oralhistory/)

### Inferences
- CB-CSV is the variant to use for a private family archive. It is the most actively pushed of the three, plays self-hosted MP4/WebM files through `video-player.html`, and doesn't need a published Google Sheet. CB-GH (last push October 2025) handles video only as YouTube/Vimeo IDs or links. CB-Sheets reads its metadata from a CSV "such as a published Google Sheet," and a published sheet can be read by anyone with the link, including names, dates, and captions. The same issue applies to TimelineJS (see that section).
- Self-hosting home videos as files puts them behind the same host access control as the rest of the site. Unlisted YouTube or Vimeo embeds would depend on those platforms' own privacy settings, which were not researched here.
- Scanned prints often have uncertain dates. Because the timeline needs yyyy-mm-dd, the CSV likely needs both a sortable "best-guess" `date` column (for example 1955-01-01) and a free-text display date such as "circa mid-1950s", as the docs suggest.
- Adding photos later means appending CSV rows, adding files, regenerating derivatives (thumbnails and small images), and rebuilding. An AI coding assistant can script all of this; it's an architecture inference, as the derivative tasks weren't checked.
- What a finished site looks like: a home page plus Browse, Subjects (word cloud), Map, Timeline, and Data pages, and one page per item with a viewer, metadata, and download buttons. The demo sites linked above show the default look.

### Gaps
- No published CollectionBuilder site built from family photos was found.
- The exact `display_template` value for self-hosted MP4 and audio items, and the derivative-generation (rake) tasks, were not confirmed from the docs. The include files exist, but the docs site couldn't be fetched directly.
- Whether CB-Sheets reads the published sheet at build time or at runtime was not verified.
- Whether GitHub Pages access control is limited to GitHub Enterprise Cloud could not be checked (search budget ran out). Cloudflare Access was also not checked. Both should come from the hosting research.

## Omeka S and Omeka Classic: timeline, mapping, exhibit, and Neatline add-ons; Omeka.net pricing; private sites and user roles; video; self-hosting effort

### Takeaway
Both Omeka platforms are actively maintained: Omeka S v4.2.1 shipped 2026-06-18 and Omeka Classic v3.2.2 (a security release) shipped 2026-10-02. Omeka S has the stronger built-in privacy model: private sites, pages, and items, a site "Viewer" role, and the RestrictedSites and View Private Resources modules. It also has maintained Mapping (with a date-ordered timeline) and Timeline (Knight Lab/Simile) modules. The cost is running and patching a PHP/MySQL server. The Omeka S port of Neatline looks dormant since 2023. Omeka.net is hosted Omeka Classic, priced $35–$1,000 a year with storage caps of 2–50 GB, which is tight for home video.

### Cited Findings
- **Omeka S releases:**
  - v4.2.1 (2026-06-18): PHP 8.5 support; fixes a security issue where navigation allowed `javascript:` URLs; batch edit can set custom thumbnails.
  - v4.2.0 (December 2025; the page says 04 Dec, the feed timestamp is 2025-12-12): minimum PHP raised to 8.1, PHP 8.4 supported; new IIIF image and presentation page blocks; item stubs; PDF thumbnails use the CropBox.
  - v4.1.1 (2024-06-20) and v4.1.0 (2024-04-18).
  — [GitHub: omeka-s releases](https://github.com/omeka/omeka-s/releases); [releases.atom](https://github.com/omeka/omeka-s/releases.atom)
- Omeka S repo: last push 2026-10-17, 521 stars, 279 open issues, GPL-3.0. — [GitHub: omeka/omeka-s](https://github.com/omeka/omeka-s)
- **Omeka Classic releases:**
  - v3.2.2 (2026-10-02): a security update, "All users should upgrade"; adds a "Server URL" setting.
  - v3.2.1 (2026-06-18): PHP 8.5 support.
  - v3.2 (2025-08-28): PHP 8.4 support; minimum PHP 7.1 and MySQL 5.5.5.
  - v3.1.2 (2023-10-05).
  - The repo's last push was 2026-10-16 (556 stars).
  — [GitHub: Omeka releases.atom](https://github.com/omeka/Omeka/releases.atom); [GitHub: omeka/Omeka](https://github.com/omeka/Omeka)
- **Omeka S roles:** six roles. Researchers have search and read access only. Authors add and edit their own items and, with site permissions, can build exhibits. Editors have full content privileges. — [Omeka S User Manual: Users](https://omeka.org/s/docs/user-manual/admin/users/)
- By default, Authors and Researchers can't see non-public resources owned by others; all other roles can. The View Private Resources module lets admins let Researchers and/or Authors view, but not edit, those private items, item sets, and media. — [View Private Resources module](https://omeka.org/s/modules/ViewPrivateResources/); [manual page](https://omeka.org/s/docs/user-manual/modules/viewprivateresources/); [Omeka forum](https://forum.omeka.org/t/user-roles-view-only/16945)
- **Private sites and pages (Omeka S):** an eye-icon toggle sets visibility for a page or a whole site. Private pages are visible only to logged-in users with site permissions; Supervisors and Global Admins can always see them. — [Omeka S manual: Site Pages](https://omeka.org/s/docs/user-manual/sites/site_pages/); [Site Admin](https://omeka.org/s/docs/user-manual/sites/site_settings/)
- A forum answer says that to make a site login-only, you make the site private and give visitors the "Viewer" site role; the resources must also be private. — [Omeka forum: Restrict access](https://forum.omeka.org/t/restrict-acces-to-omeka-site/27277)
- The RestrictedSites module limits public sites to a list of registered users and sends anonymous visitors to a login page. It doesn't change how private sites or the API behave. — [Omeka S: RestrictedSites](https://omeka.org/s/modules/RestrictedSites/)
- Private item sets are visible to all users of the installation, just not to the public. — [Omeka S manual: Item Sets](https://omeka.org/s/docs/user-manual/content/item-sets/)
- Omeka announced new modules for resource visibility, discoverability, and restricted access in March 2023. — [Omeka news, 2023-03-30](https://omeka.org/news/2023/03/30/resource-visibility-discoverability/)
- **Omeka Classic access:** logged-in Super, Admin, Contributor, and Researcher users can see non-public items, collections, and pages. — [Omeka Classic manual: Users](https://omeka.org/classic/docs/Admin/Users/)
- **Video in Omeka S:**
  - Core ships with an upload ingester for local files plus oEmbed, YouTube, and URL ingesters. — [Omeka S dev docs: media ingesters/renderers](https://omeka.org/s/docs/developer/modules/media_ingesters_renderers/)
  - oEmbed URLs must match a built-in whitelist; more providers can be added in `config/local.config.php`. — [Omeka forum: Adding Vimeo video](https://forum.omeka.org/t/adding-vimeo-video/5023)
  - Omeka S has to fetch the page behind an embed URL, so a domain-restricted Vimeo video failed with a 404 in one report. — [Omeka forum: embedded media does not work](https://forum.omeka.org/t/embedded-media-video-does-not-work-url-oembedded-nor-html-with-source-editor/23994)
  - The Transcript module supports WebVTT subtitles for locally uploaded audio and video, but serves only the source resolution and is not recommended for large files. — [Omeka S: Transcript module](https://omeka.org/s/modules/Transcript/)
- **Mapping module (Omeka S):**
  - Maps can include a timeline that lets visitors step through items in date order.
  - There are three page blocks: "Map by query," "Map by attachments," and "Map by groups." The groups block has no timeline.
  - The timeline needs the Numeric Data Types module and items with a timestamp or interval property. This comes from an older manual mirror.
  - Version 2.2.0 was released 2025-08-14 and added a timeline Theme option. A 2.3.0 entry is dated 2026-10-06, which matches the repo's last push that day.
  — [Omeka S manual: Mapping](https://omeka.org/s/docs/user-manual/modules/mapping/); [Mapping module page](https://omeka.org/s/modules/Mapping/); [older manual mirror](https://nakamura196.github.io/omeka-s-enduser/modules/mapping/); [GitHub: omeka-s-modules/Mapping](https://github.com/omeka-s-modules/Mapping)
- **Timeline module (Omeka S, by Daniel-KM):** "integrates the Simile Timeline widget and the online Knightlab timeline to create timelines." Last push 2026-10-14. — [GitHub: Omeka-S-module-Timeline](https://github.com/Daniel-KM/Omeka-S-module-Timeline); [Omeka S: Timeline module](https://omeka.org/s/modules/Timeline/)
- A George Mason University guide shows how to add a Knight Lab Timeline or StoryMap to Omeka S. — [GMU InfoGuides](https://infoguides.gmu.edu/omekas/knightlab)
- **Neatline for Omeka S:** performant-software/neatline-omeka-s is "A module for Omeka S that provides an API for the Neatline 3 single page application." Last push 2023-03-26, 46 open issues. Its companion scholarslab/neatline-omeka-s-docker is archived (last push 2020). — [GitHub: neatline-omeka-s](https://github.com/performant-software/neatline-omeka-s); [GitHub: neatline-omeka-s-docker](https://github.com/scholarslab/neatline-omeka-s-docker)
- **Omeka.net pricing (hosted, per year, excluding taxes):**

  | Plan | Price/year | Storage | Sites | Plugins |
  |---|---|---|---|---|
  | Plus | $35 | 2 GB | 2 | 25 (and 10 themes) |
  | Silver | $75 | 5 GB | 5 | 38 |
  | Gold | $350 | 10 GB | 10 | not stated |
  | Platinum | $1,000 | 50 GB | unlimited | 41 |
  | Free trial | $0 | 500 MB | 1 | — |

  Custom plans are available beyond Platinum. — [Omeka.net signup](https://www.omeka.net/signup); Gold price per [ELIP review](https://ojs.lib.uwo.ca/index.php/elip/article/download/8625/8703/30034) and [Omeka.net 2017 post](https://info.omeka.net/2017/08/coming-soon-more-plugins-themes-storage/)
- Older guides quote different Omeka.net prices (for example a 2010-era Silver plan at $99/year), which are now outdated. — [H-Net announcement](https://networks.h-net.org/node/3276/discussions/192363/announcement-new-plans-and-pricing-omekanet)
- The theme "The Daily" is available only on Gold and Platinum. — [Omeka.net: Manage Themes](https://info.omeka.net/build-a-website/manage-themes/)
- Library guides describe Omeka.net as the hosted way to run Omeka Classic; Classic itself is free but needs your own hosting. — [U. Rochester LibGuide](https://libguides.lib.rochester.edu/omeka); [Wikipedia: Omeka](https://en.wikipedia.org/wiki/Omeka)
- Third-party Omeka hosting: LibraryHost's "Omeka Light" is $359/year with 5 GB of cloud storage. — [LibraryHost pricing](https://libraryhost.com/pricing/)

### Inferences
- Of the classic digital-humanities platforms, Omeka S comes closest to a real "family-only" setup with individual logins: a private site, a Viewer role for each family member, private items, and RestrictedSites if needed. It is a server application, though. Both Omeka S and Classic shipped security releases in 2026, so the owner has to keep up with patches.
- Omeka.net's 2 GB (Plus) and 5 GB (Silver) caps would likely fill quickly with digitized home video. Embedding videos from YouTube or Vimeo via oEmbed avoids the storage limit but moves privacy control to those platforms.
- For a combined map-and-timeline story, the maintained Mapping module's timeline is a safer bet than Neatline for Omeka S, which has had no push since March 2023.
- Adding photos later in Omeka means web-form uploads or a batch import. That suits non-technical family contributors, but it's slower than editing a spreadsheet unless a CSV import module is used (not verified here).

### Gaps
- No Omeka.net-specific private-site or password option was found, and omeka.net could not be fetched directly.
- Neatline for Omeka Classic, Neatline Time, Exhibit Builder, Geolocation, and CSV Import were not checked for current status.
- How Omeka S plays uploaded MP4 files (codecs, HTML5 player) was not confirmed.
- Omeka S server requirements beyond the PHP version (MySQL version, ImageMagick), and typical self-hosting cost, were not verified.

## Wax (minicomp Jekyll framework) and other minimal-computing archive tools

### Takeaway
Wax is maintained but slow-moving (last push 2025-11-26). It is image-focused (IIIF zoom via OpenSeadragon, client-side search via elasticlunr) and has no documented video or audio support. That makes it a weaker fit than CollectionBuilder for photos plus home videos, though it suits deep-zoom viewing of high-resolution scans.

### Cited Findings
- Wax is a "Jekyll based framework for minimal exhibitions with IIIF." Repo topics: digital-humanities, elasticlunr, iiif, jekyll, openseadragon, static-site. Stats: MIT license, 181 stars, 15 open issues, GitHub template repo, last push 2025-11-26, demo at minicomp.github.io/wax/. — [GitHub: minicomp/wax](https://github.com/minicomp/wax)
- It describes itself as "an extensible workflow for producing scholarly exhibitions with minimal computing principles." It has three parts: the Ruby gems `wax_tasks` and `wax_iiif`, the `wax_theme` Jekyll theme, and documentation. Requirements are Git, Ruby >= 3.2 with Bundler (natively or in Docker), ImageMagick, and Ghostscript; Vips is planned to replace ImageMagick. Support is via GitHub issues and the Code4Lib Slack channel #minicomp-wax. — [GitHub: minicomp/wax README](https://github.com/minicomp/wax)
- The README mentions only images, with no video or audio support, and shows no version number beyond a gem badge. — [GitHub: minicomp/wax README](https://github.com/minicomp/wax)

### Inferences
- Wax fits a scanned-print gallery where zooming into detail matters, such as faces in group photos or handwriting on the backs of prints. Home videos would need a custom layout or external embeds.
- Like CollectionBuilder, Wax generates a static site with no access control of its own, so privacy has to come from the host.
- Adding images means re-running Wax's derivative and IIIF tasks and rebuilding, which is heavier than CollectionBuilder for large batches (inference from the gem architecture; not measured).

### Gaps
- How Wax collections are defined (CSV/JSON/YAML), the latest gem versions, and whether video can be added were not confirmed.
- Other minimal-computing tools (for example Ed. or other GO::DH-listed tools) were not surveyed.

## Knight Lab TimelineJS and StoryMapJS: media and video, the Google Sheets workflow, and privacy (does the sheet have to be published?)

### Takeaway
TimelineJS is still maintained (last push 2026-09-22). It supports YouTube, Vimeo, and DailyMotion page URLs and direct links to .mp4 files. Its Google Sheets workflow requires publishing the sheet to the web, so the timeline data is public. A private family timeline should instead use TimelineJS's JSON format with self-hosted files behind access control. StoryMapJS is also maintained, but it needs a Google sign-in, stores projects on Knight Lab servers, and published maps are reportedly public with no password option.

### Cited Findings
- **TimelineJS3 repo:** MPL-2.0, 3,225 stars, 646 forks, 229 open issues, last push 2026-09-22. — [GitHub: NUKnightLab/TimelineJS3](https://github.com/NUKnightLab/TimelineJS3)
- TimelineJS is an open-source tool for building "visually rich, interactive timelines," and beginners can start from just a Google spreadsheet. — [York U: About the Knight Lab tools](https://pressbooks.library.yorku.ca/csiw-workshops/chapter/about-the-knight-labs-tools)
- **The sheet must be published:** Google Sheets are private by default, and TimelineJS can't read the data until the sheet is published (File > Share > Publish to web). Knight Lab now recommends using the URL from the "Publish to the web" dialog. It also warns not to set the sheet to "anyone with the link can edit." — [Knight Lab TimelineJS](https://timeline.knightlab.com); [UT Austin guide](https://guides.lib.utexas.edu/latinx-digital-worlds/publishing-your-timelinejs); [Bridgewater State KB](https://bridgew.teamdynamix.com/TDClient/1926/Portal/KB/Article/170724/FACULTY-Creating-Interactive-Timelines-with-TimelineJS)
- **Media:** TimelineJS accepts a link to a video file on the internet, and "currently only .mp4 files work." Online videos use the page URL for Vimeo, DailyMotion, Vine, and YouTube. — [Knight Lab: Supported Media Types](https://timeline.knightlab.com/docs/media-types.html); [UAB guide](https://guides.library.uab.edu/c.php?g=1532569&p=11483842)
- **JSON and self-hosting:** JSON is TimelineJS's native data format, and the docs warn that a misplaced comma or quote can stop a timeline from loading. — [GitHub: NUKnightLab/TimelineJS](https://github.com/NUKnightLab/TimelineJS); [Knight Lab FAQ](https://timeline.knightlab.com/docs/faq.html)
- A community template shows how to self-host TimelineJS with the standalone JavaScript and JSON files. Its authors say this avoids API outages and changes, and the privacy tradeoffs of relying on Google. It is not an official Knight Lab resource. — [GitHub: timelinejs-selfhosted](https://github.com/amazighdotmobi/timelinejs-selfhosted)
- The tools are still in active teaching use: Northeastern University lists a hybrid workshop on 2026-10-27 covering TimelineJS, StoryMapJS, and StorylineJS. — [Northeastern CDS event](https://cds.library.northeastern.edu/events/intro-to-knightlab-timeline-storymap-and-storyline/)
- **StoryMapJS repo:** 250 stars, 114 open issues, last push 2026-09-13. — [GitHub: NUKnightLab/StoryMapJS](https://github.com/NUKnightLab/StoryMapJS)
- StoryMapJS's editor uses Google login so that only the author can edit, and asks only for a profile identifier. Projects were once stored in Google Drive but have moved; long-time users may be asked to grant Drive access so old projects can be migrated. — [StoryMapJS](https://storymap.knightlab.com/); [StoryMapJS select page](https://storymap.knightlab.com/select/)
- StoryMapJS requires a Google account, and it works like a slide presentation laid over a map. — [Grinnell guide](https://vivero.sites.grinnell.edu/?p=1278)
- Third-party guides say published StoryMaps are public: anyone with the URL can view them, and there's no password option. No official Knight Lab statement was found. — [UMW DKC](https://dkc.umw.edu/tools/storymapjs/); [Gettysburg DH toolkit](https://dh.sites.gettysburg.edu/toolkit/tools/storymap-js/)
- A journalism security review says StoryMap data is stored on Northwestern/Knight Lab servers in the US. It suggests self-hosting the open-source library for sensitive projects and avoiding exact coordinates of sensitive locations. — [fieldwork.news: Knight Lab StoryMap](https://fieldwork.news/tools/knight-lab-storymap)

### Inferences
- For family privacy, the convenient Google Sheet workflow is the problem: a sheet published to the web exposes names, dates, places, and captions to anyone with the link. The private route is TimelineJS's JSON format, generated from the family metadata CSV by a script, with timeline.js and the MP4 and image files hosted on the same access-controlled site. A JSON timeline could even be embedded as a "Timeline" page inside a CollectionBuilder or Hugo site.
- A family timeline would mostly use direct .mp4 links or unlisted YouTube/Vimeo embeds. Other formats such as .mov or .avi would need converting to MP4 first.
- StoryMapJS (for example, a "where the Richards and Arant families lived" map) has the same issue: it's public by default. A private version would mean self-hosting the library.
- Longevity: self-hosting the JavaScript and JSON avoids depending on Knight Lab's hosted CDN and authoring tool if Knight Lab ever changes or retires them. That is speculative; no retirement announcement was found.

### Gaps
- TimelineJS3's latest release number and date were not retrieved (GitHub release access was restricted and the CHANGELOG URL returned 404).
- Whether the official docs still list only .mp4 in October 2026 couldn't be checked directly (the knightlab.com fetch failed).
- No official Knight Lab page confirming that StoryMapJS has no private option was found.

## Other timeline and storytelling tools: Tiki-Toki (3D view, pricing), Preceden, Sutori, Time.Graphics, Scalar, Shorthand, Exposure, Adobe Express web pages

### Takeaway
These hosted tools are easy to set up but limited on privacy and longevity, and none is designed to hold a whole archive. Privacy options vary:
- Time.Graphics: private timelines on Premium.
- Exposure: site passwords on Pro ($14/month billed yearly), aimed partly at families.
- Adobe Express: password-protected webpages, but video only via YouTube/Vimeo.
- Scalar: free hosted "books" that can require login and invite specific readers.
- Sutori: private hosting only on a custom-quote tier.
- Shorthand: expensive ($60 up to $1,750 a month).

Tiki-Toki's 3D timeline view is distinctive, but its official pricing pages look several years old.

### Cited Findings
- **Tiki-Toki:**
  - Its homepage says timelines can be viewed in three dimensions. It lists Bronze at $9.50/month and Silver at $25/month, both with "access to new features." Search metadata suggests the pricing snapshot is about 2,100 days old, and the FAQ about 1,750 days old. — [Tiki-Toki](https://www.tiki-toki.com/); [Tiki-Toki FAQs](https://www.tiki-toki.com/faqs/)
  - A 2026 roundup still lists Bronze $9.50, Silver $25, and Teacher $150/year, calls it a 3D timeline maker, and lists a separate desktop product for Mac and Chromebook at $49.99. — [itechguides 2026](https://www.itechguides.com/8-best-interactive-timeline-makers-free-and-paid/)
  - An education resource says a paid Teacher account allows up to 25 timelines plus the 3D version, group editing, and embedding. — [EdTech Books: Tiki-Toki](https://edtechbooks.org/onlinetools/tiki-toki)
  - The free plan covers one timeline. One third-party review gives limits of 200 entries, 50 categories, and 5 timeline spans; it's unclear which of these roundups was the source. — [iSpring roundup](https://www.ispringsolutions.com/blog/top-10-free-and-paid-interactive-timeline-makers); [itechguides](https://www.itechguides.com/8-best-interactive-timeline-makers-free-and-paid/)
  - Student rates are on a separate page. — [Tiki-Toki student rates](https://www.tiki-toki.com/studentrates/)
- **Preceden:**
  - Free: $0, unlimited timelines, 10 events per timeline.
  - Basic: $10/month billed annually or $25/month billed monthly.
  - Pro: $16/month billed annually or $40/month billed monthly.
  - Paid plans have a 15-day money-back guarantee.
  - Older third-party prices ($12/month, $29/month Pro) conflict with these.
  — [Preceden pricing](https://www.preceden.com/pricing)
- **Sutori:**
  - The free Essential plan includes Sutori branding and caps embeds at 1,000 views/month.
  - Sutori Pro is $399/year with unlimited unbranded stories and 50,000 monthly embed views.
  - The education plan is about $99/year per educator.
  - Aggregators place private hosting and a custom domain on a quote-priced Custom tier, and some list conflicting Pro prices such as $25/month.
  — [Sutori Business](https://www.sutori.com/en/business); [SaaSworthy](https://www.saasworthy.com/product/sutori/pricing); [Crozdesk](https://crozdesk.com/software/sutori/pricing)
- **Time.Graphics:**
  - The official FAQ says Premium is sold as a 2-day plan that auto-renews until cancelled.
  - The premium page lists $4.9 for 2 days, $18.9 for 1 month, and $97.9 for 1 year, "valid until September 30, 2026," a date that has now passed.
  - Private timelines and share-by-link require Premium. If Premium lapses, private timelines stay viewable but can no longer be edited.
  - Teacher pricing starts at $100.
  — [Time.Graphics FAQ](https://time.graphics/faq); [Time.Graphics Premium](https://time.graphics/premium)
- **Scalar:**
  - A free, open-source platform for long-form, born-digital scholarship from the Alliance for Networking Visual Culture at USC. It can be used on USC's servers after registering, or downloaded and self-hosted. — [Brooklyn College LibGuide](https://libguides.brooklyn.cuny.edu/digitaltoolbox/scalar); [Scalar sign-up](http://scalar.usc.edu/scalar/sign-up/); [U. South Carolina guide](https://guides.library.sc.edu/digitalscholarship/cms)
  - Repo: last push 2026-10-13, 243 stars, 51 open issues. — [GitHub: anvc/scalar](https://github.com/anvc/scalar)
  - Library guides describe it as ideal for linear, book-style narratives that integrate images and video. They advise linking media from reliable archives, report that images and videos over 2 MB can't be embedded, and note account creation can take some back-and-forth with USC. These are unverified secondary claims, and the guides date from 2014–2020. — [Brooklyn College LibGuide](https://libguides.brooklyn.cuny.edu/digitaltoolbox/scalar); [NJIT guide](https://researchguides.njit.edu/scalar)
  - Privacy settings: "Make URL public?" controls whether a book opens without login. "Display in Scalar indexes?" controls whether it is listed. Specific users can be added as readers in the Book Users tab. — [Scalar guide: Sharing](https://scalar.usc.edu/works/guide/sharing); [York U: The permissions section](https://scalar.library.yorku.ca/learning-scalar/the-permissions-section); [NJIT: Setup](https://researchguides.njit.edu/scalar/setup)
- **Shorthand:**
  - Directories list a $200/month flat rate, possibly stale. — [Capterra](https://www.capterra.com/p/233334/Shorthand/)
  - A page refreshed 2026-05-06 says pricing starts at $60/month across 3 tiers, all tiers route to a sales contact form, and there is no free tier. — [xpay.sh](https://www.xpay.sh/saas-pricing/shorthand/)
  - A competitor's comparison page lists Starter at $60/month (12 published stories a year), Team at $875/month, and Business at $1,750/month. It is a rival's marketing, so treat it with caution. — [Scrollytelling.ai](https://scrollytelling.ai/vs/shorthand/)
- **Exposure:**
  - Pro is $14/month billed yearly and is aimed at "creators, hobbyists, and families." Pro Plus is $29/month and adds ecommerce and a custom domain. Business starts at $99/month or $999/year. The pricing page text was jumbled, so these figures need checking. — [Exposure pricing](https://exposure.co/pricing)
  - The pricing page lists "Password protect your site or specific stories." — [Exposure pricing](https://exposure.co/pricing); [Exposure for Business](https://www.exposure.co/for-business)
  - A support article says site passwords apply only to the site, not individual stories, which "will still be accessible if a visitor has the exact URL." It also says site passwords are a Pro-and-above feature. — [Exposure support: Password protect your site](https://support.exposure.co/en/articles/2343234-password-protect-your-site)
- **Adobe Express web pages:**
  - Publishing uses Share > Publish to web, with a Password protection toggle before the link is created. Remix is unavailable on password-protected links, and pages can be republished or unpublished. — [Adobe help: Publish webpages](https://helpx.adobe.com/express/using/hosting-projects.html); [Adobe help (NZ)](https://helpx.adobe.com/nz/express/web/design-webpages/host-webpages.html)
  - A 2022 community thread saying password protection wasn't supported is now outdated. — [Adobe Community 2022](https://community.adobe.com/t5/adobe-express-discussions/password-protected-web-page/td-p/12628765)
  - Video: webpages can embed only YouTube or Vimeo videos, or Adobe Express videos, which are cut to their first 5 minutes when embedded. Users commonly upload to YouTube as unlisted and link from there. — [Adobe help: embed YouTube videos](https://helpx.adobe.com/uk/express/web/bring-in-assets-from-other-apps/import-files-from-other-apps/embed-youtube-videos.html); [Adobe Community](https://community.adobe.com/t5/adobe-express-discussions/can-video-be-embedded-on-express-page/m-p/14034539); [Adobe Community 2025](https://community.adobe.com/questions-329/how-on-earth-do-i-attatch-a-video-to-web-page-1224147)
  - Embedding an Express design on another site makes the design public. — [Adobe help: Embed designs](https://helpx.adobe.com/express/web/publish-and-share/manage-project-links/embed-designs.html)

### Inferences
- None of these tools can serve as the main archive: they're built for authored stories or timelines, not hundreds or thousands of catalogued items. At most, they could host a few curated "chapters" (for example, a "Richards family 1940–1970" story) that link back to the main archive.
- Among them, Exposure Pro and Adobe Express come closest to "family-only" for photo stories. Both use shared passwords, and Exposure's story-level URLs may bypass the site password. Scalar can be login-only with invited readers at no cost, but USC account gatekeeping and possibly small upload limits make it awkward for video.
- Tiki-Toki's 3D view is the most "engaging" timeline display listed here, but the seemingly years-old pricing pages raise a longevity concern. Time.Graphics' 2-day auto-renew model and expired price list suggest unstable pricing.
- Longevity risk is highest for the commercial hosted tools: if the vendor folds or reprices, the content may become uneditable (as with Time.Graphics after Premium lapses) or disappear. The open-source and static tools in the other sections avoid this.

### Gaps
- Tiki-Toki's current official pricing, whether Bronze and Silver include the 3D view, its video support, and any private or password option were not confirmed (the official site couldn't be fetched, and the FAQ and pricing pages appear years old).
- Preceden's privacy options and media support, and Sutori's free-tier privacy, were not found.
- Shorthand's privacy options (for example, password-protected stories) were not verified.
- Exposure's video support was not checked.

## Mukurtu CMS: community archives with cultural/access protocols, and fit for giving different family members different access levels

### Takeaway
Mukurtu 4 reached stable releases in September–October 2026 (4.0.0 on 2026-09-09, 4.0.5 on 2026-10-05, the latest). Its communities-and-cultural-protocols model could technically give different family branches or members different access: open protocols are visible to everyone, and strict protocols only to logged-in members, now assignable per media item. But it's a Drupal-based platform designed for Indigenous communities' heritage management, with real hosting and administration overhead. It is likely overkill for one family's archive unless fine-grained, per-branch restrictions are a firm requirement.

### Cited Findings
- **Repo:** "Mukurtu CMS v4," GPL-3.0, 32 stars, 105 open issues, last push 2026-10-17. — [GitHub: MukurtuCMS/Mukurtu-CMS](https://github.com/MukurtuCMS/Mukurtu-CMS)
- **Releases:**
  - 4.0.0-rc was marked pre-release (05 Sep). 4.0.0 (09 Sep 2026) "is intended for beta testers to use as a step between 4.0.0-beta37 and 4.0.1."
  - New installs should use 4.0.1 (10 Sep).
  - Migrations from Mukurtu 3 should use 4.0.4 (2026-09-16), because 4.0.3 had user-migration defects.
  - 4.0.5 (2026-10-05) is the latest.
  — [GitHub: Mukurtu releases](https://github.com/MukurtuCMS/Mukurtu-CMS/releases); [releases.atom](https://github.com/MukurtuCMS/Mukurtu-CMS/releases.atom)
- **Mukurtu 4 protocol changes:** protocols can now be assigned to media, and users are prompted to assign one to each media asset at upload. Protocol selection becomes mandatory for protocol-aware content. Communities, cultural protocols, and categories stay largely the same. Mukurtu's page also says Drupal 7 (the base of Mukurtu 3) is no longer supported after January 5, 2025. — [Mukurtu CMS 4](https://upgrade.mukurtu.org/mukurtu-4/); [mukurtu.org/mukurtu-4](https://mukurtu.org/mukurtu-4/)
- **Protocols:** "open" protocols are visible to all visitors, including those without accounts; "strict" protocols are visible only to logged-in protocol members. — [Mukurtu User Manual: Understanding Communities and Cultural Protocols](https://docs.mukurtu.org/communities-cultural-protocols-categories/UnderstandingCommunitiesAndCulturalProtocols/); [Sustainable Heritage Network](https://sustainableheritagenetwork.org/digital-heritage/mukurtu-cms-communities-cultural-protocols-and-categories)
- **Cost and hosting:**
  - The software is free and open source, but self-hosting needs server capacity and ongoing IT support. — [Mukurtu FAQ](https://upgrade.mukurtu.org/faqs); [Get Mukurtu CMS](https://upgrade.mukurtu.org/?p=1273)
  - Mukurtu's Reclaim Hosting guide quotes Organizational Shared Hosting at about $100/year "at the time of writing," recommended for smaller sites, and Professional Services at $600/year. These figures are dated and may predate v4. — [Mukurtu support: Reclaim Hosting](https://upgrade.mukurtu.org/support/using-reclaim-hosting-to-host-your-mukurtu-cms-site)
  - Mukurtu Hosting, run with Digital Scholar, offers shared hosting and dedicated support; no published prices were found. — [Digital Scholar](https://digitalscholar.org/blog/digital-scholar-supports-mukurtu-hosting/)
  - Andornot also offers managed Mukurtu hosting. — [Andornot](https://andornot.com/managed-hosting/mukurtu-indigenous-content-management-system-hosting/)
- Mukurtu is designed to support Indigenous communities in managing and sharing cultural heritage. — [Kanopi: Supporting Indigenous Communities with Mukurtu CMS](https://kanopi.com/blog/mukurtu-cms/); [Sustainable Heritage Network intro](https://sustainableheritagenetwork.org/digital-heritage/introduction-mukurtu-content-management-system-cms-providing-digital-access)

### Inferences
- Mapping families onto Mukurtu is possible in principle: "Richards" and "Arant" become communities, with protocols such as "All family (strict)," "Richards siblings only (strict)," or "Public (open)." Each photo or video then carries a protocol. That is real per-branch access control, which none of the static tools offer.
- Practical fit is weak. Version 4.0.x is weeks old, the 4.0.0 notes themselves call it a step for beta testers, it runs on Drupal and needs hosting and updates, and its terms and workflows are built around Indigenous cultural protocols. Omeka S with private sites, Viewer roles, and separate private sites per family branch is likely a simpler way to get tiered access.

### Gaps
- Mukurtu 4's server requirements (Drupal version, PHP), video handling, timeline or map features, and current v4 hosting prices were not verified.
- No examples of Mukurtu used by a single family were found.

## Static photo gallery generators and templates: Thumbsup, sigal, Expose, Photo Stream, Fussel, Hugo/Jekyll gallery themes (date sorting and video)

### Takeaway
For "a folder of photos and videos into a chronological gallery," thumbsup and sigal fit best:
- Both are maintained (last pushes 2026-02-28 and 2026-10-01).
- Both transcode video with FFmpeg.
- Both can sort by EXIF date taken.
- sigal also has an `encrypt` plugin for password protection.

The others are weaker for this use:
- Fussel (last push 2026-10-08) adds face-tag "people" galleries but documents no video support.
- The Hugo themes (hugo-theme-gallery and Gallery Deluxe) are maintained but image-only.
- Expose is dormant (last push March 2022).
- The original Photo Stream repo now returns 404; the waschinski fork carries it on.

### Cited Findings
- **thumbsup:** "Generate static HTML photo / video galleries." Repo: MIT, 865 stars, 104 open issues, last push 2026-02-28, site at thumbsup.github.io. — [GitHub: thumbsup/thumbsup](https://github.com/thumbsup/thumbsup)
  - Nested folders become albums, and photos, videos, and raw files can be included or excluded.
  - Video is transcoded with FFmpeg to MP4 or WebM, with quality, bitrate, and optional VAAPI hardware-acceleration settings.
  - Media sorts by filename or date taken, ascending or descending. Albums sort by title, start date, or end date, and are built from `--albums-from` (folder path by default).
  - Keywords and people can be used as album-name placeholders.
  - Four themes: classic, cards, mosaic, and flow.
  - Output is static HTML with relative paths, so it can be deployed anywhere, including S3.
  - It "only rebuilds changed files," with `--scan-mode` set to full, partial, or incremental.
  - Requires Node.js, exiftool, and GraphicsMagick. FFmpeg, Gifsicle, dcraw, and ImageMagick (for HEIC) are optional. A Docker image at ghcr.io/thumbsup/thumbsup bundles everything.
  — [GitHub: thumbsup README](https://github.com/thumbsup/thumbsup)
- **sigal:** "yet another simple static gallery generator." Repo: MIT, 948 stars, 98 open issues, last push 2026-10-01. Requires Python 3.11+. Features include three themes (colorbox, galleria, photoswipe), zip download, EXIF support, relative links, and parallel processing. — [GitHub: saimn/sigal](https://github.com/saimn/sigal)
  - Video: the default converter is ffmpeg. `video_extensions` covers .mov, .avi, .mp4, .webm, .ogv, and .3gp. `video_format` defaults to webm (mp4 optional). `video_size` defaults to (480, 360); set it to `None` to disable resizing.
  - Sorting: `medias_sort_attr` defaults to `filename`; `'date'` sorts by EXIF date and `'meta.key'` by a metadata key. `albums_sort_attr` defaults to `name`.
  - Plugins: adjust, compress_assets, copyright, encrypt (options `password` and `ask_password`), extended_caching, feeds, media_page, nomedia, nonmedia_files, watermark, and zip_gallery.
  — [sigal sample config (sigal.conf.py)](https://github.com/saimn/sigal/blob/main/src/sigal/templates/sigal.conf.py)
- **Expose:** "A simple static site generator for photoessays." Repo: 4,436 stars, last push 2022-03-16. — [GitHub: Jack000/Expose](https://github.com/Jack000/Expose)
  - It is a Bash script: subfolders become nested gallery sections, and a "_" prefix excludes items.
  - Videos go through FFmpeg into several resolutions and codecs (for example 640-h264.mp4) with poster images; clips can be trimmed, and image sequences turned into video.
  - Items sort alphabetically, with numeric prefixes for custom order.
  - A text file with the same name as an image provides its caption, with YAML metadata.
  - Two themes are included. It was tested on Windows/Cygwin and OS X.
  — [GitHub: Expose README](https://github.com/Jack000/Expose)
- **Photo Stream:**
  - The original maxvoltar/photo-stream URL returned HTTP 404 on 2026-10-18. — [GitHub: maxvoltar/photo-stream (404)](https://github.com/maxvoltar/photo-stream)
  - Fork READMEs describe a minimalist, self-hosted, Jekyll-built photo stream that can be hosted on Netlify or GitHub Pages. Features include lazy loading, loading larger resolutions only when needed, unique URLs per photo, an RSS feed, and light and dark themes. — [GitHub: pr0PM/photo-stream](https://github.com/pr0PM/photo-stream); [awesome-selfhosted listing](https://git.9x0rg.com/Git/awesome-selfhosted/commit/17c21bba0fb78decdeb52e47f83f1b8fdbcdf471)
  - The waschinski/photo-stream fork is "Self-hosted, super simple photo stream" (topics docker, jekyll), with 488 stars, 22 open issues, and a last update of 2026-09-26. That is an `updated_at` timestamp, not a push date. — [GitHub: waschinski/photo-stream](https://github.com/waschinski/photo-stream)
  - nmasse-itix/photo-stream is a Hugo theme "based on maxvoltar's photo-stream," last updated 2025-12-20. — [GitHub: nmasse-itix/photo-stream](https://github.com/nmasse-itix/photo-stream)
- **Fussel:** "A static photo gallery generator." Repo: MIT, 312 stars, last push 2026-10-08. — [GitHub: cbenning/fussel](https://github.com/cbenning/fussel)
  - Each subfolder becomes an album. It supports JPEG, PNG, and GIF.
  - It reads face tags from XMP metadata and builds a gallery per person, with face rectangles shown over photos.
  - The all-photos view sorts by date or filename.
  - Output is a static React/Vite site. It needs Python 3.10+, uv, Node.js, and Yarn, or the Docker image ghcr.io/cbenning/fussel.
  - Downloads of originals can be turned off (`allow_download`), and watermarks are optional. The EXIF panel shows GPS coordinates if present.
  - Video is not mentioned.
  — [GitHub: Fussel README](https://github.com/cbenning/fussel)
- **hugo-theme-gallery:** "Gallery Theme for Hugo." Repo: MIT, 761 stars, last push 2026-05-28, demo at nicokaiser.github.io/hugo-theme-gallery/. — [GitHub: nicokaiser/hugo-theme-gallery](https://github.com/nicokaiser/hugo-theme-gallery)
  - Page bundles become albums. Albums sort by their `date` front matter, newest first. Photos sort by `sort_by` (Name by default, or Date) and `sort_order`.
  - `params.private: true` removes an album from the overview and RSS feeds.
  - Uses the PhotoSwipe lightbox. Needs Hugo Extended 0.123.0+ and no Node.js.
  - The README warns against WebP because of a Hugo resize bug. Video is not mentioned.
  — [GitHub: hugo-theme-gallery README](https://github.com/nicokaiser/hugo-theme-gallery)
- **Gallery Deluxe (by Hugo's lead developer bep):** "Fast Hugo gallery theme/module suitable for lots of images." Repo: MIT, 216 stars, last push 2026-09-18. Sorting options are only `shuffle` and `reverse`. It has an optional `enable_exif` setting, uses the Pig.js library, and its demo is staticbattery.com. Video is not mentioned. — [GitHub: bep/gallerydeluxe](https://github.com/bep/gallerydeluxe)

### Inferences
- **The date problem with scanned prints:** "date taken" sorting in thumbsup, sigal, and Fussel reads embedded EXIF/XMP dates. A scanner writes the *scan* date, not the date the photo was taken. To get a true chronological gallery, a script (for example exiftool driven by the metadata spreadsheet) would need to write each print's estimated DateTimeOriginal first. Alternatively, name files and folders by date (for example `1958/1958-07-04_picnic.jpg`) and sort by filename. This step is critical for every EXIF-sorted tool.
- **Family-only access:** hugo-theme-gallery's `private: true` only hides an album from listings; anyone with the URL can still open it. It is not access control. sigal's `encrypt` plugin is the only built-in password feature found among these generators. How it works (client-side encryption) and how strong it is weren't verified. Every other option needs host-level access control, the same as CollectionBuilder.
- **Video:** thumbsup and sigal are the best fits for mixed photo and home-video folders, since both transcode to web-playable MP4/WebM. sigal's default 480x360 video size would need raising for digitized home video. Expose handles video well but is unmaintained.
- **Adding photos later** is easiest with these tools: drop new files into a folder and rebuild. thumbsup's incremental scan mode reprocesses only changed files.
- **The trade-off:** these generators show *albums and streams*, not a catalogued archive. They have no subject/person/place browsing (apart from Fussel's people galleries), no map, and no metadata table. CollectionBuilder (sections above) offers those.

### Gaps
- Latest release versions for thumbsup, sigal, and Fussel were not retrieved (GitHub release API access was restricted).
- How strong sigal's `encrypt` plugin is was not verified (its readthedocs site couldn't be fetched).
- Whether Fussel or the Hugo themes have added video support since their README snapshots is unknown.
- Jekyll gallery themes beyond Photo Stream were not surveyed; the search budget ran out.

## Cross-tool: active maintenance in 2025–2026, what a finished site looks like, and the work to add new photos later

### Takeaway
Most of the open-source options are actively maintained as of October 2026. CollectionBuilder-CSV, Omeka S and Classic, Mukurtu, TimelineJS, StoryMapJS, Scalar, sigal, Fussel, and Gallery Deluxe all had pushes in September–October 2026. CollectionBuilder-GH (October 2025), Wax (November 2025), thumbsup (February 2026), and hugo-theme-gallery (May 2026) are quieter. Expose (2022) and the original Photo Stream repo (now 404) are effectively unmaintained. The spreadsheet-driven static tools make adding photos later the easiest, but none has built-in access control; Omeka S and Mukurtu provide real logins at the cost of running a server.

### Cited Findings
"Last push" dates are as of 2026-10-18. Dashes mean nothing was found or retrieved.

| Tool | Last push | Latest release found | Video handling | Built-in access control | Adding new items later |
|---|---|---|---|---|---|
| CollectionBuilder-CSV | 2026-10-08 ([GitHub](https://github.com/CollectionBuilder/collectionbuilder-csv)) | None on GitHub | Self-hosted HTML5 player plus YouTube/Vimeo ([video-player.html](https://github.com/CollectionBuilder/collectionbuilder-csv/blob/main/_includes/item/video-player.html); [docs](https://collectionbuilder.github.io/cb-docs/docs/metadata/object-paths/)) | None; host-level only ([CB deploy docs](https://collectionbuilder.github.io/cb-docs/docs/deploy/thirdparty/)) | Add CSV rows and files, rebuild |
| CollectionBuilder-GH | 2025-10-06 ([GitHub](https://github.com/CollectionBuilder/collectionbuilder-gh)) | — | `youtubeid`/`vimeoid` fields ([docs](https://collectionbuilder.github.io/cb-docs/docs/metadata/gh_metadata/)) | None | Add CSV rows and files |
| CollectionBuilder-Sheets | 2026-10-02 ([GitHub](https://github.com/CollectionBuilder/collectionbuilder-sheets)) | — | Same fields as GH ([docs](https://collectionbuilder.github.io/cb-docs/docs/metadata/gh_metadata/)) | None; metadata from a published sheet | Edit the sheet |
| Wax | 2025-11-26 ([GitHub](https://github.com/minicomp/wax)) | — | None documented | None | Re-run IIIF/derivative tasks |
| Omeka S | 2026-10-17 ([GitHub](https://github.com/omeka/omeka-s)) | v4.2.1, 2026-06-18 ([releases](https://github.com/omeka/omeka-s/releases.atom)) | Upload, YouTube, and oEmbed ingesters ([dev docs](https://omeka.org/s/docs/developer/modules/media_ingesters_renderers/)) | Private sites/pages/items, roles, modules ([manual](https://omeka.org/s/docs/user-manual/sites/site_pages/)) | Web admin uploads |
| Omeka Classic / Omeka.net | 2026-10-16 ([GitHub](https://github.com/omeka/Omeka)) | v3.2.2, 2026-10-02 ([releases](https://github.com/omeka/Omeka/releases.atom)) | Not verified | Non-public items visible to logged-in roles ([manual](https://omeka.org/classic/docs/Admin/Users/)) | Web admin uploads |
| TimelineJS3 | 2026-09-22 ([GitHub](https://github.com/NUKnightLab/TimelineJS3)) | — | .mp4 links plus YouTube/Vimeo/DailyMotion ([docs](https://timeline.knightlab.com/docs/media-types.html)) | None; the sheet must be published ([Knight Lab](https://timeline.knightlab.com)) | Add sheet rows or JSON entries |
| StoryMapJS | 2026-09-13 ([GitHub](https://github.com/NUKnightLab/StoryMapJS)) | — | Not verified | None; reportedly public ([UMW](https://dkc.umw.edu/tools/storymapjs/)) | Online editor |
| Scalar | 2026-10-13 ([GitHub](https://github.com/anvc/scalar)) | — | Images and video, often linked from archives ([Brooklyn](https://libguides.brooklyn.cuny.edu/digitaltoolbox/scalar)) | Login-required URL plus invited readers ([Scalar guide](https://scalar.usc.edu/works/guide/sharing)) | Online editor |
| Mukurtu CMS 4 | 2026-10-17 ([GitHub](https://github.com/MukurtuCMS/Mukurtu-CMS)) | 4.0.5, 2026-10-05 ([releases](https://github.com/MukurtuCMS/Mukurtu-CMS/releases.atom)) | Not verified | Communities plus open/strict protocols ([manual](https://docs.mukurtu.org/communities-cultural-protocols-categories/UnderstandingCommunitiesAndCulturalProtocols/)) | Web admin; a protocol on every media item |
| thumbsup | 2026-02-28 ([GitHub](https://github.com/thumbsup/thumbsup)) | — | FFmpeg to MP4/WebM | None | Drop files in, incremental rebuild |
| sigal | 2026-10-01 ([GitHub](https://github.com/saimn/sigal)) | — | FFmpeg to WebM (default) or MP4 ([config](https://github.com/saimn/sigal/blob/main/src/sigal/templates/sigal.conf.py)) | `encrypt` plugin (password) ([config](https://github.com/saimn/sigal/blob/main/src/sigal/templates/sigal.conf.py)) | Drop files in, rebuild |
| Expose | 2022-03-16 ([GitHub](https://github.com/Jack000/Expose)) | — | FFmpeg, multiple resolutions | None | Drop files in; existing outputs aren't overwritten |
| Photo Stream (waschinski fork) | 2026-09-26, `updated_at` ([GitHub](https://github.com/waschinski/photo-stream)) | — | Not documented | None | Add photos, rebuild |
| Fussel | 2026-10-08 ([GitHub](https://github.com/cbenning/fussel)) | — | Not mentioned | None (download toggle only) | Regenerate |
| hugo-theme-gallery | 2026-05-28 ([GitHub](https://github.com/nicokaiser/hugo-theme-gallery)) | — | Not mentioned | `private: true` only hides from listings | Add a page-bundle folder |
| Gallery Deluxe | 2026-09-18 ([GitHub](https://github.com/bep/gallerydeluxe)) | — | Not mentioned | None | Add images |

- **What finished sites look like:** live demos are at collectionbuilder.github.io/collectionbuilder-gh/ ([GitHub](https://github.com/CollectionBuilder/collectionbuilder-gh)), minicomp.github.io/wax/ ([GitHub](https://github.com/minicomp/wax)), thumbsup.github.io ([GitHub](https://github.com/thumbsup/thumbsup)), nicokaiser.github.io/hugo-theme-gallery/ ([GitHub](https://github.com/nicokaiser/hugo-theme-gallery)), and staticbattery.com for Gallery Deluxe ([GitHub](https://github.com/bep/gallerydeluxe)).
- CollectionBuilder sites have Browse, Subjects, Map, Timeline, and Data pages. — [UTK workshop](https://utk-collection-builder.readthedocs.io/en/latest/contents/1_outline.html)
- thumbsup offers classic, cards, mosaic, and flow themes. — [GitHub](https://github.com/thumbsup/thumbsup)

### Inferences
- "Last push" counts a push to any branch, including automated dependency bumps, so it overstates feature development somewhat. Release cadence, where available (Omeka S and Classic, Mukurtu), is the more reliable sign of maintenance.
- A likely combined architecture, given a technically capable user with an AI assistant:
  - CollectionBuilder-CSV as the catalogue (Browse, Subjects, Map, Timeline, Data, with self-hosted MP4 home videos).
  - Optionally, a TimelineJS JSON "story" page generated from the same CSV.
  - The whole static output deployed to a host with login-based access, such as Netlify's "Private" visitor access, or an equivalent covered by the hosting research.
  - Omeka S is the fallback if family members need their own logins to *contribute* items through a web form, or if tiered access by family branch becomes a requirement. Mukurtu is overkill.
- Longevity ranking, from most to least durable: static generators (plain HTML/CSS/JS output that can be copied anywhere) > self-hosted open-source servers (Omeka, Mukurtu: durable but need patching) > hosted commercial SaaS (Tiki-Toki, Time.Graphics, Sutori, Shorthand, Exposure, Adobe Express: vendor-dependent).

### Gaps
- Some fetches and checks failed: GitHub release versions for TimelineJS3, thumbsup, sigal, Fussel, and Wax could not be retrieved because per-repo GitHub API calls were restricted to the session's own repository. Some official doc sites also couldn't be fetched (DNS failures in the fetch tool).
- The web-search budget ran out before these checks: GitHub Pages private access (Enterprise Cloud), Cloudflare Access, Neatline for Omeka Classic, Jekyll gallery themes, and Wax video.
- Real-world build times and storage needs for large scan and video sets were not measured for any tool.
