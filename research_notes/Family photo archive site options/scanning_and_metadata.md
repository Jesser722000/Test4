# Scanning, Metadata, Dating, and Home-Video Digitization for a Chronological Family Archive (as of October 2026)

*Retrieval note for the report writer: direct page fetches failed with DNS errors for every site tried (digitizationguidelines.gov, law.cornell.edu, blogs.loc.gov, thephotomanagers.com, immich.app). All findings below come from search-engine summaries of the cited pages. Where one summary merged several pages and did not say which page made which claim, I cite the whole set and mark it "(merged summary)". Vendor or competitor sources are flagged.*

## 1. What resolution, file format, bit depth, and color mode should be used for prints, slides, and negatives?

### Takeaway
Current US federal benchmarks set photographic prints at a minimum of 400 ppi (NARA's 2023 rule and FADGI 3-star). FADGI 4-star is about 600 ppi, and 35mm film is about 3000–4000 ppi at 16 bits per channel. Masters should be lossless TIFF. The Library of Congress's older consumer figure of 300 ppi is a floor, not a target. For a family site where people will zoom and crop, the defensible default is 600 ppi for standard prints, 1200 ppi for wallet-size and smaller prints, TIFF masters, and JPEG derivatives for the web.

### Cited Findings
- FADGI's *Technical Guidelines for Digitizing Cultural Heritage Materials*, Third Edition (May 9, 2023), is the current US federal digitization guideline. I could not retrieve the full text; the numbers below come from secondary summaries — [FADGI 3rd ed. PDF](https://www.digitizationguidelines.gov/guidelines/FADGI%20Technical%20Guidelines%20for%20Digitizing%20Cultural%20Heritage%20Materials_3rd%20Edition_05092023.pdf)
- FADGI thresholds for prints, as given in a vendor summary citing FADGI §3.8: 3-star is 400 ppi (published as ≥392 ppi, net of a 2% scale tolerance) and 4-star is 600 ppi (≥594 ppi). Bit depth is 8 or 16 bits at 3-star and 16 bits at 4-star — [Interscan FADGI star comparison (vendor)](https://www.interscanllc.com/resources/fadgi/fadgi-star-rating-comparison)
- University of Illinois Library: a photograph must be captured at a minimum of 600 ppi (±6 ppi) to meet FADGI 4-star for reproduction scale accuracy — [Illinois "FADGI in Practice"](https://exhibits.library.illinois.edu/s/illinois-digitization/page/FADGIpractice)
- **Conflict:** a 2024 FADGI white paper reproduces a 400 ppi tier at 16-bit and a 300 ppi tier at 8 or 16 bits. It also says resolutions above 400 ppi "may suit some materials but aren't required for 4-star." That disagrees with the Illinois and Interscan readings — [FBC/QAI "Ask the Expert" FADGI white paper (2024)](https://www.fbcinc.com/source/virtualhall_images/2024_Virtual_Events/USDA_Innovation/QAI/AsktheExpert_FADGI_whitepaper_061124.pdf)
- The June 2022 draft of FADGI's 3rd edition says "all master files from both color and black and white originals are to be imaged in 16 bit color at or above 3-star performance." This argues for scanning black-and-white prints in color. It is a draft, so confirm it in the final edition — [FADGI June 2022 draft](https://www.digitizationguidelines.gov/guidelines/DRAFT%20Technical%20Guidelines%20for%20Digitizing%20Cultural%20Heritage%20Materials%20-%203rd%20Edition.pdf)
- FADGI for negatives (35mm up to 4x5), as transcribed by a forum user: 3-star is 3000 ppi at 16-bit and 4-star is 4000 ppi at 16-bit. This is secondhand, so verify it — [PentaxForums transcription](https://www.pentaxforums.com/forums/107-film-processing-scanning-darkroom/463839-negative-scanning-3.html)
- NARA's 36 CFR 1236.50, from the 2023 rule, has a separate table (Table 2 to paragraph (e)) for "photographic prints and paper records with fine detail." It requires a minimum of 400 ppi sized to the source, 8 or 16 bits per channel, and color or grayscale mode. Modern textual paper needs only 300 ppi. The specs are based on FADGI 3-star targets, and agencies may exceed them — [eCFR §1236.50](https://www.ecfr.gov/current/title-36/chapter-XII/subchapter-B/part-1236/subpart-E/section-1236.50); [govinfo CFR 2025 §1236.50](https://www.govinfo.gov/content/pkg/CFR-2025-title36-vol3/pdf/CFR-2025-title36-vol3-sec1236-50.pdf); [NARA Records Express, June 2023](https://records-express.blogs.archives.gov/2023/06/07/digitizing-records-requirements-for-paper-and-photographs/)
- NARA's final rule says the requirements are "based on FADGI and ISO specifications" and are a minimum. Agencies should evaluate their source records and choose specifications "through testing and analysis" — [Federal Register, May 4, 2023](https://www.federalregister.gov/documents/2023/05/04/2023-09050/federal-records-management-digitizing-permanent-records-and-reviewing-records-schedules)
- NARA has no digitization standards yet for negatives and slides. The older 36 CFR 1237.28(d) now covers only those — [Federal Register 2024 (public inspection PDF)](https://public-inspection.federalregister.gov/2024-06406.pdf)
- Library of Congress: a 2013 post on its *The Signal* blog says LoC's personal digital archiving resources recommend 300 dpi/ppi for common print sizes up to 8x10. It adds that the right resolution depends on the original's quality, whether higher ppi shows more detail or just grain and dust, and whether the original is a print or a negative. **Possibly outdated:** this predates FADGI 2023 and NARA 2023 — [LoC The Signal, July 2013](https://blogs.loc.gov/thesignal/2013/07/you-say-you-want-a-resolution-how-many-dpippi-is-too-much/)
- LoC's own collection notes say very high-resolution images "require significantly increased costs, particularly in time spent capturing, inspecting, and loading the files" — [LoC Prints & Photographs digitizing note](https://www.loc.gov/pictures/collection/ggbain/digitizing.html)
- A 2025 personal digital archiving quick-reference guide (Washington State Archives material distributed by Sno-Isle Libraries, citing LoC) recommends: documents 300–400 PPI; standard photos 600 PPI; photos for enlargement 600–1200 PPI; slides and negatives 1200+ PPI. It recommends 24-bit color for color photos and 8-bit grayscale for black-and-white photos — [Sno-Isle 2025 quick reference guide](https://www.sno-isle.org/wp-content/uploads/sites/90/2025/10/2025_personal-digital-archiving_quick-reference-guide.docx)
- Smithsonian Institution Archives Q&A: save color as 24-bit TIFF and grayscale as 8-bit TIFF — [SI Archives "You Asked, We Answered"](https://siarchives.si.edu/blog/you-asked-we-answered-taking-care-your-own-archives); [NMAH version](https://americanhistory.si.edu/explore/stories/you-asked-we-answer-taking-care-your-own-archives)
- State Library of New South Wales guideline (Australia): 3000 ppi for transparencies and negatives; 48-bit (16 bits per channel) for transparencies and negatives; black-and-white negatives may be saved as 16-bit grayscale; 24-bit masters for reflective originals such as prints. Attribution comes from a merged summary — [SLNSW Public Library Services "Still images"](https://pls.sl.nsw.gov.au/node/59)
- Practitioner sources on 35mm: the working range is 3,000–4,000 ppi, and going above 4,000 ppi is "probably a waste." A scanner's real resolving power may be below its nominal rating; one slide scanner measured about 3,900 dpi on a USAF-1951 chart against a nominal 4,500. These are vendor or practitioner sources (merged summary) — [Each Moment (UK lab)](https://www.eachmoment.co.uk/blog/2-000-35mm-slides-scanned-resolution-file-sizes-and-what-a-real-carousel-looks); [Smooth Photo Scanning](https://smoothphotoscanning.com/whats-the-best-resolution-dpi-for-scanning-old-35mm-slides/); [Film Camera Basics](https://filmcamerabasics.com/blog/ultimate-2025-guide-35mm-negatives-to-digital/)
- Masters should be uncompressed or losslessly compressed TIFF (LZW/ZIP); JPEG is for access copies. Higher resolution isn't always better, because at extreme settings "you start capturing the texture of the paper." Merged summary — [Rocky Nook](https://rockynook.com/article/scanning-photos/); [Genealogical Forum of Oregon handout](https://gfo.org/file_download/inline/88118312-526a-4cdd-a77a-a06ebacd1cf3); [Incarn blog](https://www.incarn.co/en/blog/how-to-scan-old-photos)

### Inferences
- **Settings to use today**, derived from the findings above:
  - **4x6 and 5x7 prints: 600 ppi.** This matches FADGI 4-star and is 50% above NARA's minimum. A 4x6 becomes 2400×3600 px (8.6 MP), about 26 MB as an uncompressed 8-bit/channel RGB TIFF or about 52 MB at 16-bit.
  - **8x10: 400–600 ppi** (3200×4000 to 4800×6000 px; 38–86 MB uncompressed at 8-bit).
  - **Wallet (2.5x3.5) and smaller (photo-booth strips, tiny contact prints): 1200 ppi true optical** (3000×4200 px, 12.6 MP). At 600 ppi a wallet print is only 1500×2100 px (3.2 MP). The FastFoto's 1200 dpi is interpolated (see Q3), so small prints belong on a flatbed.
  - **The FastFoto's 300 dpi "speed" setting** gives a 4x6 only 1200×1800 px (2.2 MP), below both the NARA and FADGI print minimums. Use it only for quick reference passes, not masters.
  - **35mm slides and negatives: 3000–4000 ppi at 16 bits per channel.** A 35mm frame at 4000 ppi is about 5670×3780 px (21 MP), roughly 128 MB as a 48-bit TIFF.
  - **Black-and-white prints:** scan in RGB color, following the FADGI draft. Color capture preserves sepia and toning, foxing and stains, and colored ink on backs, and a grayscale copy can be made later. The simpler guidance (Smithsonian, Washington State) accepts 8-bit grayscale. NARA permits either, so this is a judgment call.
  - **Bit depth:** 8 bits per channel meets NARA and FADGI 3-star. Use 16 bits for badly faded color prints so color correction has headroom.
  - **Format:** TIFF masters with lossless LZW or ZIP compression, and JPEG web derivatives made from the masters.
- **Storage:** 10,000 prints at 600 ppi as 24-bit TIFF is about 260 GB before lossless compression. Plan backup drives for 2–3× that across copies (see Q8).

### Gaps
- I could not retrieve the FADGI 2023 tables directly. Before stating 4-star numbers as definitive, confirm in §3.8 whether 4-star for prints is 600 ppi; the FBC/QAI paper conflicts.
- I found no Smithsonian-specific ppi numbers, only the 24-bit/8-bit TIFF advice.
- I could not check whether LoC's current personal-archiving page (digitalpreservation.gov/personalarchiving) still says 300 ppi.

## 2. Should the backs be scanned, and how should front and back files be paired and named?

### Takeaway
Yes. Backs carry handwritten captions, lab processing-date stamps, and photo-paper backprints, which are primary dating evidence (see Q6). Give both sides the same base ID and a side suffix. Epson FastFoto already does this (no suffix = front original, `_b` = back, `_a` = auto-enhanced copy), but by default it seems to capture the back only when it detects writing.

### Cited Findings
- FastFoto naming: a file with no suffix is the original scan with no enhancements; `_a` is the automatically color-enhanced version; `_b` is the scanned back — [Geauga County Public Library auto-feeder scanner tutorial, Sept 2025](https://geaugalibrary.net/wp-content/uploads/2025/09/Auto-Feeder-Scanner-Written-Tutorial-9.2025.pdf)
- Pairing example: front = `your_name_001`, back = `your_name_001_b` — [Best Buy Q&A (FF-640)](https://www.bestbuy.com/site/questions/epson-fastfoto-ff-640-high-speed-photo-scanning-system-black/5495311/question/70b9e5e0-4677-372e-b58e-9a06e760c762)
- Epson's `_a`/`_b` suffixes are not customizable — [PhotoStructure forum](https://forum.photostructure.com/t/filename-based-file-aggregation-for-epson-fastfoto-enhanced-and-reverse-side-photos/1593)
- A `_b` file is created "if something is detected during the scan process" — [Monroe County (MI) District Library FastFoto guide](https://www.mcdl.info/sites/default/files/migrated/FHLC_FastFoto.pdf)
- Conflicting user report: a Best Buy user said the software "simply duplicates the scanned image creating double files" — [Best Buy Q&A](https://www.bestbuy.com/site/questions/epson-fastfoto-ff-640-high-speed-photo-scanning-system-black/5495311/question/b58f9826-97ec-38be-93c4-4158dbe28a0f)
- Backprints are datable: "A KODAK PAPER" appears roughly 1961–1972, and "THIS PAPER MANUFACTURED BY KODAK" from mid-1972 to early 1991. This is a single commercial guide — [TimelineScan](https://timelinescan.com/how-to-date-old-photos/)
- Machine-printed dates on prints are the date the print was developed, not the date the photo was taken — [Maureen Taylor, "How to Date an Old Photograph"](https://maureentaylor.com/learn/how-to-date-an-old-photograph/)
- Captions on backs must be questioned, because "you don't necessarily know who wrote that caption or when" — [Family Locket podcast RLP 120 with Maureen Taylor](https://familylocket.com/rlp-120-identifying-and-preserving-photographs-with-maureen-taylor/)

### Inferences
- Capture the back of every print, not only those with writing. Faint paper-brand backprints may not trigger auto-detection, and backprints date the paper even when nothing is handwritten. Check the FastFoto software for a setting that forces back scanning. If there isn't one, run batches of pre-1995 prints in a mode that always captures the back.
- Choose one pairing convention and never rename one side without the other. Either keep Epson's front/`_b`/`_a`, or use explicit suffixes such as `RICH-B01-A03-P012-04_f.tif` and `RICH-B01-A03-P012-04_b.tif`. Epson's suffixes can't be changed, so mixing schemes means a renaming script later.
- Transcribe the back's text into the front file's caption metadata, since the front is what the website will show. Keep the back image linked by ID. Many gallery platforms show backs as separate items, so the site should hide or stack `_b` files under their fronts.
- Treat `_a` (auto-enhanced) files as derivatives, never as masters.

### Gaps
- I did not retrieve any FADGI, NARA, or NEDCC guidance on capturing the back (verso).
- I could not confirm that FastFoto has an "always scan back" option, or which software version behaves which way.

## 3. What are the scanner options (FastFoto FF-680W, Epson V600/V850 flatbeds, phone apps) and their trade-offs and 2026 prices?

### Takeaway
The Epson FastFoto FF-680W is still the main high-speed photo feeder. I found no successor as of October 2026, and it sells for about $400 refurbished to $630 new. It suits sturdy loose prints, but its optical limit is 600 dpi, it needs regular roller cleaning, and it can leave streaks or roller marks. A flatbed is needed for fragile, small, thick, mounted, album-bound, and film originals, but Epson's V600 and V850 are reported discontinued (V850 Pro listed at $1,999). Phone apps (Google PhotoScan is free but unmaintained since 2023; Photomyne is about $60 a year) are for quick captures, album pages, and relatives, not masters.

### Cited Findings
**Epson FastFoto FF-680W**
- Prices: Epson store $529.99 (marked down from $629.99); Epson Certified ReNew $399.99; Walmart $629.99; Amazon about $560 per Yahoo Tech; eBay new $475 from a third-party seller — [Epson](https://epson.com/For-Home/Scanners/Photo-Scanners/FastFoto-FF-680W-Wireless-High-speed-Photo-Scanning-System/p/B11B237201); [Epson ReNew](https://epson.com/Certified-ReNew/Scanners/FastFoto-FF-680W-Wireless-High-speed-Photo-Scanning-System---Certified-ReNew/p/B11B237201-N); [Walmart](https://www.walmart.com/c/kp/fastfoto); [Yahoo Tech review](https://tech.yahoo.com/cameras/articles/epson-fastfoto-ff-680w-review-163843285.html); [eBay](https://www.ebay.com/itm/166907165382)
- No successor model turned up in an October 2026 search. Epson's US page still lists the FF-680W. This is negative evidence only — [Epson](https://epson.com/For-Home/Scanners/Photo-Scanners/FastFoto-FF-680W-Wireless-High-speed-Photo-Scanning-System/p/B11B237201)
- Speed: one 4x6 photo per second at 300 dpi, based on Epson's test of 36 4x6 photos in landscape orientation. It cannot scan negatives — [Yahoo Tech](https://tech.yahoo.com/cameras/articles/epson-fastfoto-ff-680w-review-163843285.html); [B&H listing](https://www.bhphotovideo.com/c/product/1424870-REG/epson_b11b237201_fastfoto_ff_680w_photo_scanner.html)
- Specs (merged summary of retailer listings and the manual): 600 dpi optical, 1200 dpi maximum interpolated; photo sizes from wallet (2.5x3.5") up to 8.5x36" panoramas (Epson marketing says "up to 8x10"); feeder holds 36 photos or 100 sheets; one listing gives maximum media thickness as 9 mil (0.3 mm); listings say it handles "Polaroid photos and panoramas" within the 8.5" width — [B&H](https://www.bhphotovideo.com/c/product/1424870-REG/epson_b11b237201_fastfoto_ff_680w_photo_scanner.html); [Epson manual specs (manuals.co.uk)](https://www.manuals.co.uk/epson/fastfoto-ff-680w/specifications); [Costco listing](https://www.costco.com/p/-/epson-fastfoto-ff-680w-wireless-high-speed-photo-scanning-system/4000238458); [Fstoppers review (~2022, $499 then)](https://fstoppers.com/reviews/quickly-and-easily-archive-photos-review-epson-fastfoto-ff-680w-scanner-610270)
- Reviews: TechGearLab (June 2025) ranked it #1 of 13 scanners with a score of 89, noting the high price — [TechGearLab](https://www.techgearlab.com/reviews/small-and-home-office/scanner/epson-fastfoto-ff-680w). A long-term user reported more than 8,000 photos scanned without problems — [LowEndBox](https://lowendbox.com/blog/after-8000-photos-scanned-my-review-of-the-the-epson-ff-680w-its-a-powerhouse/). Epson's site averages about 4.07 stars from 387 reviews — [Epson](https://epson.com/For-Home/Scanners/Photo-Scanners/FastFoto-FF-680W-Wireless-High-speed-Photo-Scanning-System/p/B11B237201)
- Streaks: Epson's manual links dust on photos to white lines in scans. It says to wipe both sides of each photo and clean the rollers with the included microfiber cloth every 300 scans or before each session. Room temperatures below about 59°F (15°C) can make photos curl — [Epson FF-680W User's Guide](https://files.support.epson.com/docid/cpd5/cpd55191.pdf)
- Epson's support FAQs say: if streaks appear in every scan, clean the glass; turn on the "Detect Glass Dirt" alert; use the "Reduce lines and streaks" option, which can't fix every line. Clean rollers only with a genuine Epson cleaning kit or the included cloth, never alcohol, paint thinner, or hard brushes, because a dry cloth can damage the roller surface. Press the scan button to rotate the separation rollers while wiping them. If cleaning doesn't help, scan the affected photos one at a time — [Epson FAQ 1](https://epson.com/faq/SPT_B11B237201~faq-000067D-ff680w?faq_cat=faq-8796127275084); [Epson FAQ 2](https://epson.com/faq/SPT_B11B237201~faq-0000bba-ff680w?faq_cat=faq-topFaqs)
- Marks: an Epson representative said the feed roller assembly "may leave track marks" on photos — [Best Buy Q&A (FF-680W)](https://www.bestbuy.com/site/questions/epson-fastfoto-ff-680w-wireless-high-speed-photo-scanning-system-black/6280709/question/55caf264-003f-3efd-bb6e-89c8f29976dd). Some Amazon reviewers report fine vertical scratches, most visible on glossy prints, while others saw none — [Amazon Q&A](https://www.amazon.com/ask/questions/Tx1PSL6IVJP3PKW/). One user found feeder dust produced vertical streaks that showed up as fine scratches — [Adobe Community](https://community.adobe.com/t5/photoshop-ecosystem-discussions/how-to-remove-thin-vertical-streaks-in-scanned-photos-caused-by-auto-feeder-scratches/m-p/13453779)

**Flatbeds (Epson Perfection V600 / V850 Pro)**
- A comment on Larry Jordan's review says Epson stated both the V600 and V850 are discontinued because their CCDs are no longer made. Forum threads discuss "the discontinued Epson V600," and an Australian retailer lists the V600 as "Discontinued, Replaced by V850." A PetaPixel article, cited in a forum thread, disputed reports that Epson was dropping its film scanners — [Larry Jordan review](https://larryjordan.com/articles/product-review-epson-v600-vs-v850-photo-scanners/); [Photrio thread](https://www.photrio.com/forum/threads/what-replaces-the-discontinued-epson-v600-scanner.219019/); [Topbanana (AU)](https://topbanana.com.au/epson-v600-scanner-discontinued-replaced-by-v850); [TalkPhotography thread](https://www.talkphotography.co.uk/threads/epson-discontinue-high-end-scanners.765777/)
- Larry Jordan: the V600 makes scans "the equal of the V850 for 1/4 the price" at roughly the same speed, while the V850 is better for dust removal and difficult originals — [Larry Jordan](https://larryjordan.com/articles/product-review-epson-v600-vs-v850-photo-scanners/)
- Prices: Epson lists the V850 Pro at $1,999.00 — [Epson V850 Pro](https://epson.com/For-Work/Scanners/Photo-and-Graphics/Epson-Perfection-V850-Pro-Photo-Scanner/p/B11B224201). The V600 was $249.99 at the time of an older review (**outdated**). Used V600s now sell for about $325–$500 on eBay, and a forum post mentions a certified refurbished unit for about $300 — [eBay V600 listings](https://www.ebay.com/shop/epson-perfection-v600?_nkw=epson+perfection+v600); [Photrio](https://www.photrio.com/forum/threads/what-replaces-the-discontinued-epson-v600-scanner.219019/)

**Phone apps**
- Google PhotoScan is still free and downloadable, but it was last updated in November 2022 on iOS and July 2023 on Android, so no new features are coming. Some Android devices may not be offered it in the Play Store — [Lightroom Tools blog, 2026](https://lightroom-tools.com/blog/google-photoscan-still-available-2026); [AppBrain (last update 2023-07-24)](https://www.appbrain.com/app/photoscan-by-google-photos/com.google.android.apps.photos.scanner)
- PhotoScan's anti-glare mode stitches five angles into one scan. Guides recommend it for single glossy prints, and Photomyne for scanning multiple photos or album pages quickly. These are 2026 app roundups (merged summary) — [PhotoWorkout](https://www.photoworkout.com/best-photo-scanning-apps/); [ExpertPhotography](https://expertphotography.com/photo-scanner-apps)
- Photomyne detects the edges of several photos in one capture and lets users add names, locations, and dates, tag faces, attach audio recordings, and colorize photos — [Photomyne](https://babe.photomyne.com/get-photomyne)
- Photomyne pricing from an undated article: $59.99 a year ($5/month billed annually), $19.99 month-to-month, or $119.99 lifetime. Photomyne's sister apps FilmBox and SlideScan show yearly plans of $29.99–$49.99 in 2026 price trackers — [CyberGuy](https://cyberguy.com/how-to/how-to-digitize-old-photos-slides/amp/); [App Pricing Lab: FilmBox](https://apppricinglab.com/iap/apple/1495155880); [App Pricing Lab: SlideScan](https://apppricinglab.com/iap/apple/1485358131)

### Inferences
- **Hybrid workflow:**
  - Use the **FastFoto at 600 dpi** for sturdy loose prints from the 1960s–2000s drugstore era.
  - Use a **flatbed** for wallet-size and smaller prints (needs true 1200 ppi), cracked, brittle, or curled prints, mounted and cabinet cards, anything over about 0.3 mm thick, album pages, prints with tape or adhesive residue, and film.
  - Thick integral instant prints (Polaroid SX-70/600) conflict with the 0.3 mm listed maximum even though a retailer says Polaroids are supported. Safer on the flatbed.
- **Test first:** feed about 20 expendable prints and inspect them at 100% for streaks. Clean the rollers on Epson's schedule and keep the room above 59°F.
- **Avoid the feeder for one-of-a-kind or glossy-fragile prints**, given Epson's own statement that roller marks are possible.
- **Flatbed buying in 2026:** the V600 may only be available refurbished or used at near-original prices, and the V850 Pro at $1,999 is costly. Other flatbeds or a camera-scanning rig may be worth evaluating (not researched here).
- **PhotoScan and Photomyne** suit relatives who won't lend originals, and quick "context" shots of album pages. Don't treat them as masters, and note that PhotoScan is no longer maintained.

### Gaps
- FastFoto's throughput at 600 dpi, its TIFF output option, and whether its batch "date"/"description" fields write to EXIF/XMP are unverified. I believe the FastFoto software offers TIFF output and lets you set dates and descriptions per batch, but no source in this pass confirmed it.
- No 2025–2026 successor to the FastFoto was found; this is negative evidence only.
- I did not research alternatives such as other Epson, Canon, or Plustek flatbeds, dedicated film scanners, or camera scanning.
- I found no source for flatbed throughput (prints per hour).

## 4. What file naming and folder structure preserve provenance, and should whole album pages be scanned too?

### Takeaway
Name files by where the physical item lives (family, box or album, page, position, side), not by what it shows. Keep dates, people, and stories in embedded metadata, because they will change as relatives identify things. Write down the scheme and store it with the originals. Scan each whole album page before scanning or removing the individual photos on it.

### Cited Findings
- Use only letters, numbers, hyphens, and underscores in filenames; no spaces or special characters. Merged summary, so attribution is approximate — [App Initio (Medium)](https://appinitio.medium.com/naming-conventions-for-scanned-photos-45a7fd2eb681)
- An archive-focused guide recommends against descriptive names such as person plus place plus year. It uses a code for where the physical item is stored plus a sequence number (e.g., `KFA-AG01-ALB01-IMG01`), and stores the archive reference in the image's description field so the file stays linked to the original — [Camera-Digitize-Archive, Sept 2025](https://camera-digitize-archive.com/2025/09/19/camera-scanning-archive-structure-priorities/)
- An ISO-style date prefix (YYYY-MM or YYYY-MM-DD) makes computers sort files chronologically, with placeholders for unknown parts — [BringBack.pro family photo metadata checklist](https://bringback.pro/guides/family-photo-metadata-checklist)
- Write a document explaining your file-naming format and keep it with the originals so relatives can understand it later — [Lightroom Queen forum](https://www.lightroomqueen.com/community/threads/naming-convention-for-scanned-images.39996/)
- A filename number is "only a reference number linking a print to its scan, and it's often not representative of order" — [Scan Your Entire Life](https://www.scanyourentirelife.com/numbering-system-filenames-linking-scanned-photos/)
- Archival practice for multi-page items uses a trailing page number such as `_001` — [Digital Lab File Naming Convention (2017)](https://watermelon-bear-hd8l.squarespace.com/s/File-Naming_2017-02_website.pdf)
- Photomyne is better than PhotoScan for album pages and multiple photos at once (merged summary of app roundups) — [PhotoWorkout](https://www.photoworkout.com/best-photo-scanning-apps/)

### Inferences
- **Proposed scheme, usable now:**
  - Folders: `Richards/RICH-B01 <box label>/RICH-B01-A03 <album label>/`. Use the `ARAN-` prefix later for the Arant family.
  - Album items: `RICH-B01-A03-P012-04.tif` = box 01, album 03, page 012, position 04 (numbered left to right, top to bottom). Use `-00` for the whole-page scan, e.g., `RICH-B01-A03-P012-00.tif`. Add `_b` for backs and `_a` for enhanced copies.
  - Loose prints: `RICH-B02-E05-0137.tif` = box 02, envelope 05, item 137.
  - Keep dates out of master filenames, because estimated dates will be revised. The website should sort by metadata, not filename. Date-prefixed names can be generated for exported copies if wanted.
  - Physically label the box, envelope, or album with the same ID.
- **Album pages: scan the whole page first.** That keeps the handwritten album captions, the arrangement (often chronological), and album-era clues. Then scan individual photos, in place if they can't be safely removed.
- **Keep order:** record each photo's album/page/position sequence in metadata so the site can offer an "album view" alongside the chronological view.
- **Keep envelope groups together**, because prints from one photofinishing envelope usually come from one roll and can share a date estimate (see Q6).

### Gaps
- I found no archival-institution source (NEDCC, LoC, NARA) on the page-scan-then-item-scan workflow; most naming sources are blogs and forums.
- I found no sourced guidance on removing photos from "magnetic" self-adhesive albums (see Q8).
- A FamilySearch "first steps" PDF surfaced but was not read — [FamilySearch first-steps PDF](https://cms-b-assets.familysearch.org/a6/12/f2eea93f0b7fc47060113624a563/first-steps.pdf)

## 5. Which metadata standards and fields should be used, how should approximate dates be recorded, which tools help, and what metadata survives uploads to Google Photos and Immich?

### Takeaway
Use a two-field date strategy:
- Put the honest, possibly partial date in XMP. ExifTool confirms XMP dates can be a year alone (e.g., "1965" or "1972-07"), conventionally in photoshop:DateCreated.
- Put a full, sortable "best estimate" timestamp in EXIF DateTimeOriginal, which requires all six date/time components.
- Write "circa" or "estimated" plus the evidence in the caption and keywords.

Embed everything in the masters. Google Photos ignores caption edits made after upload and exports its own edits as JSON sidecars. Immich can import MWG face regions (e.g., from digiKam), but that import has open bugs in v3.2.

### Cited Findings
**Dates**
- EXIF date/time values must include all six fields; XMP date values need only the year — [ExifTool FAQ](https://exiftool.org/faq.html)
- XMP can hold a partial date but EXIF usually needs a full one. The usual workaround is the earliest moment in the known period, e.g., January 1 of a known year — [ExifTool forum #11575 "Which Field & Format For Date Of Old Photo?"](https://exiftool.org/forum/index.php?topic=11575.0)
- Zeros for an unknown month or day trigger a "Month '00' out of range" warning; one user used `01` placeholders instead — [ExifTool forum #12518](https://exiftool.org/forum/index.php?topic=12518.0)
- macOS Photos and Preview showed midnight when XMP-photoshop:DateCreated had no time. Adding a time or removing the tag fixed it — [ExifTool forum #13624](https://exiftool.org/forum/index.php?topic=13624.0)
- ExifTool returns year-only XMP dates as numbers in JSON output, and its documentation of XMP date formats is incomplete — [ExifTool GitHub issue #182](https://github.com/exiftool/exiftool/issues/182)
- IPTC's user guide notes that "Date Created" can be derived from Exif DateTimeOriginal where software supports it — [IPTC Photo Metadata User Guide](https://www.iptc.org/std/photometadata/documentation/userguide/)

**Source type, people, and regions**
- IPTC's Digital Source Type vocabulary has `print` ("Digitised from a non-transparent medium") and `negativeFilm` ("Digitised from a transparent negative", a relabeled term) — [IPTC Digital Source Type NewsCodes](https://cv.iptc.org/newscodes/digitalsourcetype/)
- IPTC updated the vocabulary in its 2024 Q3 NewsCodes release and has extended it to label synthetic or AI-generated media, which is relevant for marking AI-restored derivatives — [IPTC 2024 Q3 release](https://iptc.org/news/newscodes-2024-q3-release-including-media-topics-and-digital-source-type-updates/); [IPTC synthetic-media draft announcement](https://iptc.org/news/iptc-releases-draft-of-digital-source-type-vocabulary-to-support-synthetic-media/)
- IPTC Image Region lets you outline each person's face or body (rectangle, circle, or polygon) and give it an ID and a name. "Person Shown" lives in the IPTC Extension schema, and Image Region is a bag of ImageRegion entries — [IPTC User Guide](https://www.iptc.org/std/photometadata/documentation/userguide/); [Exiv2 IPTC Extension tag list](https://exiv2.org/tags-xmp-iptcExt.html)
- digiKam writes MWG face regions to XMP sidecars; the Immich face-import PR documents a workflow based on this — [Immich PR #6455](https://github.com/immich-app/immich/pull/6455)
- IPTC also publishes a Video Metadata Hub for video files — [IPTC Video Metadata Hub User Guide](https://www.iptc.org/std/videometadatahub/userguide/)

**Google Photos**
- For descriptions, IPTC:Caption-Abstract or XMP:Description are the most reliable fields. This forum thread is about seven years old (**possibly outdated**) — [ExifTool forum #10161](https://exiftool.org/forum/index.php?topic=10161.0)
- Forum users report that Google Photos ignores caption changes made after upload, so the file must be deleted, edited, and re-uploaded. Imported keywords are not displayed — [ExifTool forum #8536](https://exiftool.org/forum/index.php?topic=8536.0); [ExifTool forum #10161](https://exiftool.org/forum/index.php?topic=10161.0)
- A vendor blog says Google Photos keeps but doesn't show IPTC metadata (only "Title" appears), and that date/time is the only EXIF field you can edit in Google Photos. This conflicts with forum reports of captions being displayed — [Pics.io blog (vendor)](https://blog.pics.io/google-photos-metadata-everything-you-need-to-know-about-photo-metadata/)
- A vendor blog says Google has never published a complete list of the metadata fields it parses — [ExifInjector 2026 (vendor)](https://exifinjector.com/blog/exif-vs-iptc-vs-xmp-2026)
- Google Takeout: edits made inside Google Photos are not written into the image files. They come out in separate JSON sidecars, and community tools write them back into EXIF — [google-photos-exif (GitHub)](https://github.com/mattwilson1024/google-photos-exif). Captions added in Google Photos exist only in the JSON — [MetadataFixer (vendor)](https://metadatafixer.com/learn/google-takeout-json-files-explained). An unverified vendor blog says the sidecars were renamed `.supplemental-metadata.json` in 2024 — [TakeoutJSON blog](https://takeoutjson.com/blog)

**Immich (v3.x in 2026)**
- Immich's "Import faces from metadata" setting reads face regions from embedded or sidecar XMP, and it must be turned on for digiKam regions to appear — [Immich PR #6455](https://github.com/immich-app/immich/pull/6455); [Discussion #15076](https://github.com/immich-app/immich/discussions/15076)
- In v3.2.0, the metadata extraction job fails for any asset whose XMP names a person Immich doesn't already know. Sidecars written by ExifTool and osxphotos both triggered it — [Issue #31544](https://github.com/immich-app/immich/issues/31544)
- Imported face boxes are stored at the original's dimensions while face detection runs on the preview, so the boxes don't line up on large originals — [Issue #32076](https://github.com/immich-app/immich/issues/32076). Immich also creates duplicate ML faces on top of imported ones instead of merging them — [Discussion #15107](https://github.com/immich-app/immich/discussions/15107)
- The community tool immich-export writes Immich faces and keywords back out to XMP sidecars for digiKam or Lightroom — [immich-export (GitHub)](https://github.com/peemot/immich-export)

### Inferences
- **Field plan for each master file:**
  1. **EXIF DateTimeOriginal** (and XMP-exif:DateTimeOriginal): a sortable best estimate, e.g., `1965:07:01 12:00:00` for "circa 1965". Pick one convention and document it: January 1 (ExifTool forum's "earliest moment") puts year-only photos at the start of the year, while mid-year (July 1) centers the error. Noon reduces the risk that time-zone handling shifts the day. The seconds field can preserve album or roll order among photos with the same estimate (…:01, …:02).
  2. **XMP-photoshop:DateCreated:** the honest precision, e.g., `1965`, `1972-07`, or a full date.
  3. **Caption** (XMP dc:description plus IPTC Caption-Abstract): who, what, where, plus dating evidence, e.g., "circa 1965 — square Instamatic print, 'A KODAK PAPER' backprint; Jim (b. 1960) looks about 5."
  4. **Keywords:** a date-quality flag (`date-exact` / `date-lab-stamp` / `date-estimated`), surname, and archive ID.
  5. **People:** XMP-iptcExt:PersonInImage plus MWG face regions (digiKam writes them; Immich can import them).
  6. **Provenance:** archive ID (box/album/page/position) in the description or a source field, and IPTC DigitalSourceType = `print` or `negativeFilm`.
- **Finalize metadata before uploading** to Google Photos, and don't use Google Photos as the place metadata lives: edits made there don't get back into the files.
- **Test the target platform first:** upload five test images with every field filled in, and check what appears and how they sort before batch-processing thousands.

### Gaps
- I could not retrieve the MWG Guidelines (2010) on dates and regions.
- Tropy, Photo Mechanic, Adobe Lightroom/Bridge, and XnView capabilities (partial dates, IPTC Extension, MWG regions) were not verified. Only ExifTool, digiKam (via the Immich PR), and Immich were sourced.
- I could not resolve whether and how Immich reads XMP description and keywords, or which date field it prefers (docs fetch failed).
- How Google Photos currently (2026) handles XMP and IPTC captions has no authoritative source; test it.
- Unverified (standard EXIF semantics, not sourced in this pass): EXIF CreateDate/DateTimeDigitized is the right place to keep the scan date while DateTimeOriginal holds the date the photo was taken.

## 6. How can undated photos be dated (print formats, borders, backprints, stamps, clothing, cars, known ages, AI)?

### Takeaway
Bracket each photo with at least two or three independent clues:
- **Physical format** gives hard "not before" dates: 126 square prints from 1963, 110 from 1972, SX-70 integral prints from 1972.
- **Paper backprints** give date ranges.
- **Lab border stamps** give the processing date; the photo was taken on or before it.
- **Clothing, hair, and cars** narrow the decade.
- **Known birth years** of the people shown narrow it further.

AI dating, such as MyHeritage PhotoDater, is free. MyHeritage says about 60% of its estimates fall within 5 years, so treat it as a starting point to confirm, not an answer.

### Cited Findings
- 19th-century process dates: daguerreotypes from 1839, ambrotypes from 1854, tintypes from 1856, cartes de visite after 1859. Photographer imprints can fix a date window — [Maureen Taylor, "How to Date an Old Photograph"](https://maureentaylor.com/learn/how-to-date-an-old-photograph/)
- Skirt and dress length, which "got shorter throughout most of the last century," helps tell a 1940s photo from a 1970s one; men's fashions added bold patterns and colors — [Maureen Taylor, Family Tree Magazine "Dating Modern Photos"](https://familytreemagazine.com/premium/uncategorized/dating-modern-photos/)
- Machine-printed dates are when the print was developed, not when the photo was taken — [Maureen Taylor](https://maureentaylor.com/learn/how-to-date-an-old-photograph/). One guide says automated machines printed the processing month and year on the white border from about 1952 onward (merged summary) — [The Photo Managers](https://thephotomanagers.com/photo-detective-dating-family-snapshots/); [HistoricalSite.org](https://historicalsite.org/articles/how-to-date-old-photographs.html); [Flickr discussion of border date stamps](https://www.flickr.com/groups/67377471@N00/discuss/72157627666139108/)
- Handwritten captions should be questioned, since the writer and the date of writing are unknown — [Family Locket RLP 120 (Maureen Taylor)](https://familylocket.com/rlp-120-identifying-and-preserving-photographs-with-maureen-taylor/)
- **Backprints, with conflicting ranges** (merged summary): "Velox" alone, late 1920s to late 1940s; Kodak Velox common in the 1950s and 1960s; "A Kodak Paper," late 1960s to early 1970s — [The Photo Managers](https://thephotomanagers.com/photo-detective-dating-family-snapshots/); [Good Life Photo Solutions](https://goodlifephotosolutions.com/ultimate-guide-to-dating-family-photos/); [Everpresent](https://everpresent.com/how-old-are-my-photos/). A single commercial guide gives "A KODAK PAPER" as 1961–1972 and "THIS PAPER MANUFACTURED BY KODAK" as mid-1972 to early 1991 — [TimelineScan](https://timelinescan.com/how-to-date-old-photos/)
- **Deckled edges** (merged summary): fashionable from the 1930s into the late 1950s. But manufacturers sold pre-trimmed deckled paper, and Kodak made it "until the later '60s or early 70's," so the edge may reflect cutting rather than date — [Dickerman Prints](https://www.dickermanprints.com/why-do-old-time-photos-have-jagged-edges/); [Seattle Star](https://www.seattlestar.net/2022/09/encounters-with-anonymous-time-passages/); [The Photo Managers](https://thephotomanagers.com/photo-detective-dating-family-snapshots/)
- **126 film:** introduced by Kodak in 1963 with the Instamatic line, with a 28×28 mm square frame — [Wikipedia: 126 film](https://en.wikipedia.org/wiki/126_film). "A square drugstore print is almost never earlier" than 1963 — [TimelineScan](https://timelinescan.com/how-to-date-old-photos/)
- **110 film:** introduced by Kodak in 1972 with the Pocket Instamatic — [Wikipedia: 110 film](https://en.wikipedia.org/wiki/110_film)
- **Polaroid SX-70/600:** square integral prints with a thick bottom edge date from 1972 onward. **Borderless glossy 3½×5 or 4×6** color prints point to the late 1970s through the 1990s. Rounded-corner square color prints suggest the Instamatic era (1963 onward) — [TimelineScan](https://timelinescan.com/how-to-date-old-photos/). Forum anecdotes about rounded corners conflict — [Flickr Polaroid group](https://www.flickr.com/groups/52241149316@N01/discuss/72157604680323431/)
- You can usually place an undated print within a decade from the print itself; let two or three clues agree before trusting a year — [TimelineScan (commercial)](https://timelinescan.com/how-to-date-old-photos/)
- Wedding rings can show marital status and help place a photo in time (merged summary) — [Family History Daily](https://familyhistorydaily.com/genealogy-help-and-how-to/decipher-old-family-photos/)
- **MyHeritage PhotoDater:**
  - Free, launched August 2023, designed for undated photos taken between 1860 and 1990. Trained on "tens of thousands" of firmly dated historical photos from open repositories such as the Library of Congress, not on user uploads. MyHeritage says nearly 60% of estimates fall within 5 years. It shows a histogram, a confidence level, and an average error range — [MyHeritage blog, Aug 2023](https://blog.myheritage.com/2023/08/introducing-photodater-an-exclusive-free-new-feature-to-estimate-when-old-photos-were-taken/)
  - Added to the MyHeritage and Reimagine mobile apps in November 2023 — [MyHeritage blog, Nov 2023](https://blog.myheritage.com/2023/11/photodater-now-available-on-the-myheritage-and-reimagine-mobile-apps/)
  - Independent tests: PetaPixel's beta-era test dated a 1942 photo to 1947 and an 1884 photo to 1880 — [PetaPixel](https://petapixel.com/2023/11/16/this-ai-tool-will-estimate-when-an-old-photo-was-taken/). An informal genealogy-blog test on 19th-century photos was always within 3–4 years — [Genealogy à la Carte](https://genealogyalacarte.ca/?p=41627)

### Inferences
- **Dating worksheet per batch.** Intersect these ranges:
  - format → "not before";
  - backprint → paper era;
  - border lab stamp → "taken on or before" (often within a year);
  - apparent ages → (known birth year + apparent age ± a margin; children's ages are the tightest anchors);
  - fashion, cars, interiors → decade.
- **Envelopes and rolls:** prints from one envelope or roll usually share a range, so date the roll and apply it to every frame. Use any exactly dated frame (a birthday cake, a dated event) to anchor the rest.
- **Record the reasoning** in the caption (see Q5) so later corrections can be traced and the site can show "circa" honestly.
- **Run PhotoDater** on hard cases only and record its output as one clue, e.g., "PhotoDater: 1968 ±5".

### Gaps
- I found no primary Kodak documentation on backprint eras; the ranges come from secondary and commercial guides and conflict.
- I did not retrieve FamilySearch or National Genealogical Society guidance on dating photos.
- No source covered age-based dating methods; the margins above are my own reasoning. A write-up on AI estimating a photo's year from people's ages surfaced but was not read — [Unite.AI](https://www.unite.ai/ai-can-guess-a-photos-year-from-peoples-ages)
- Polaroid peel-apart formats (e.g., Polacolor), 1990s orange date imprints, and APS prints were not sourced.

## 7. How should restoration be handled (dust and scratches, Digital ICE, faded color, AI restoration)?

### Takeaway
The untouched scan is the master. Restored, colorized, or AI-processed versions are separate, labeled derivatives. Infrared Digital ICE is a film technology: it works on color film and chromogenic black-and-white film but not on silver-based black-and-white film, and results on Kodachrome are mixed. AI restoration can invent plausible-looking faces that aren't the real person.

### Cited Findings
- Digital ICE finds dust through an infrared channel. Metallic silver blocks infrared much as dust does, so traditional silver black-and-white films are not supported, while chromogenic black-and-white films are. Kodachrome is a partial case, and the developer says some scans may lose image detail. Merged summary — [Wikipedia: Digital ICE](https://en.wikipedia.org/wiki/Digital_ICE); [Nikon support: What is Digital ICE?](https://www.nikonproductsupport.com/s/article/2604?language=en_US); [filmscanner.info on Kodachrome](https://www.filmscanner.info/en/Kodachrome.html); [Wikipedia: Ilford XP](https://en.wikipedia.org/wiki/Ilford_XP)
- Wikipedia says Digital ICE is "used to detect scratches and dust during transparent film scan and is not applicable for opaque document scanning" — [Wikipedia: Digital ICE](https://en.wikipedia.org/wiki/Digital_ICE)
- The FastFoto saves an auto-enhanced `_a` copy next to the untouched original — [Geauga County Public Library tutorial](https://geaugalibrary.net/wp-content/uploads/2025/09/Auto-Feeder-Scanner-Written-Tutorial-9.2025.pdf). It also has a "Reduce lines and streaks" option — [Epson FAQ](https://epson.com/faq/SPT_B11B237201~faq-000067D-ff680w?faq_cat=faq-8796127275084)
- AI restoration (merged summary of vendor and opinion sources):
  - When the evidence in the scan is weak, the model may produce a face that is "statistically plausible but historically uncertain," and it struggles with large missing areas.
  - Suggested mitigations: lower face-restoration strength, compare side by side with the scan, restore faces separately.
  - Keep three files: the untouched scan, a restrained restoration, and a clearly labeled colorized or creative version.
  - Sources — [EnhancerFree](https://enhancerfree.com/blog/why-ai-photo-restoration-changes-faces); [Denyse Allen (Substack)](https://denyseallen.substack.com/p/ai-photo-restoration-explained); [DEV Community](https://dev.to/tonytoolbox/ai-photo-restoration-keeps-changing-faces-heres-the-pipeline-that-stops-it-400n)
- IPTC's Digital Source Type vocabulary now includes terms for labeling synthetic or AI-generated media — [IPTC synthetic-media draft announcement](https://iptc.org/news/iptc-releases-draft-of-digital-source-type-vocabulary-to-support-synthetic-media/); [IPTC NewsCodes](https://cv.iptc.org/newscodes/digitalsourcetype/)

### Inferences
- **Name derivatives clearly** (e.g., `..._r1.jpg` for restored, `..._col.jpg` for colorized). Note "AI-restored, not original" in the caption and set the matching IPTC Digital Source Type, so relatives don't mistake AI output for the real image.
- **Website default:** show the faithful scan, or a light manual cleanup, and offer AI versions as labeled alternates.
- **Dust and scratches on prints:** wipe prints before scanning, as Epson's manual advises. Use the flatbed and manual spot-healing for important images, and remember the FastFoto feeder itself can cause streaks.
- **Faded color:** capture at 16 bits for heavily faded prints (see Q1) so correction has room. Keep Epson's `_a` files only as convenience copies.

### Gaps
- I could not verify Epson's "Digital ICE for prints," a non-infrared method marketed on some flatbeds, or whether current Epson flatbeds offer it.
- I found no NEDCC, IPI, or LoC position statements on AI restoration. One search summary claimed an LoC quote ("reconstruction alters the historical record") that I could not verify, so it is excluded.
- I found no sources on specific color-fading correction tools (Epson "restore color," Photoshop/Lightroom, SilverFast).

## 8. How should files be backed up and verified, and how should the original prints be stored?

### Takeaway
For files: three copies on at least two kinds of media, one off-site (3-2-1); migrate to new media every 5–7 years; use checksums (e.g., BagIt manifests) to catch silent corruption. For prints: keep them cool, dry, and stable (NEDCC suggests about 70°F or below and 30–50% relative humidity) in enclosures that passed the Photographic Activity Test (PAT), in living spaces, not attics or basements.

### Cited Findings
- 3-2-1: make three copies, store two on different types of media, and keep one in a different location — [Texas State Library (2018)](https://www.tsl.texas.gov/slrm/blog/2018/11/3-2-1-backup-rule/); [Recollection Wisconsin 3-2-1 plan (2024)](https://recollectionwisconsin.org/wp-content/uploads/2024/09/321Plan_RWDI_2024.pdf); [LoC The Signal (2013)](https://blogs.loc.gov/thesignal/2013/07/what-people-are-asking-about-personal-digital-archiving-part-2/)
- Move the collection to new media roughly every five to seven years, because storage devices become obsolete (merged summary) — [Recollection Wisconsin](https://recollectionwisconsin.org/wp-content/uploads/2024/09/321Plan_RWDI_2024.pdf); [Texas State Library](https://www.tsl.texas.gov/slrm/blog/2018/11/3-2-1-backup-rule/)
- Fixity confirms a file hasn't changed, and checksums are the usual tool for monitoring it — [DPC Digital Preservation Handbook](https://www.dpconline.org/handbook/technical-solutions-and-tools/fixity-and-checksums). Backups protect against loss; fixity checks catch silent changes; together, fixity finds the bad copy and the backup supplies a good one — [CASRAI](https://casrai.org/guides/checksum-verification-and-fixity-checking-for-archived-research-data)
- LoC's BagIt packages files with a manifest of checksums. Free fixity tools include the BagIt command line, QuickHash, and MD5summer — [Orbis Cascade digital preservation steps](https://orbiscascadeulc.github.io/digprezsteps/fixity.html)
- Smithsonian Archives: save digital images to a computer that is backed up, and also keep them on external media — [SI Archives Q&A](https://siarchives.si.edu/blog/you-asked-we-answered-taking-care-your-own-archives)
- LoC: if seeing the original photographs matters to you, keep them; scanning can serve for sharing copies (merged summary) — [LoC The Signal "Scanning: DIY or Outsource"](https://blogs.loc.gov/thesignal/2013/01/scanning-diy-or-outsource/); [LoC The Signal 2016](https://blogs.loc.gov/thesignal/2016/05/how-to-begin-a-personal-archiving-project/)
- NEDCC family-collections guide: aim for about 70°F and relative humidity under 55%, and "work within your means." Use living spaces and avoid attics, basements, and outside walls — [NEDCC Caring for Private and Family Collections (2021)](https://www.nedcc.org/assets/media/documents/Preserving%20Family%20Collections%202021.pdf)
- NEDCC leaflet 5.3, Care of Photographs:
  - Keep mixed photo collections at 30–50% relative humidity, with daily swings under 5%.
  - The rate of chemical deterioration roughly doubles with each 10°F rise.
  - High humidity drives fading and silver mirroring; high humidity plus heat invites mold and insects; very dry air causes curling and flaking.
  - All enclosures should pass the PAT. Polyester, polyethylene, and polypropylene are acceptable; PVC and vinyl are not. Paper enclosures should be lignin-free, buffered or neutral.
  - Albums should have buffered or neutral paper, or PAT-passed polyester, polypropylene, or polyethylene pages.
  - Source — [NEDCC 5.3 Care of Photographs](https://www.nedcc.org/free-resources/preservation-leaflets/5.-photographs/5.3-care-of-photographs)
- NARA's looser target: keep temperature below 75°F and relative humidity below 65% — [NARA: How to Preserve Family Archives](https://www.archives.gov/preservation/family-archives/storing)
- Syracuse University Libraries, citing AIC: 68°F and 30–40% relative humidity is ideal — [Syracuse University Libraries](https://library.syracuse.edu/blog/Preserving-Your-Heritage-How-to-Care-for-the-Family-Album/)

### Inferences
- **A 3-2-1 setup for this project:**
  1. The working drive or NAS holding the TIFF masters.
  2. An external drive (a different device) updated after each scanning session.
  3. An off-site or cloud copy of the masters.
- **The website is not a backup** unless it stores the full-resolution masters with their metadata; most will hold derivatives.
- **Checksums:** create a BagIt bag or a SHA-256 manifest for each box folder when it's finished, and verify every copy once a year.
- **Prints back in place:** return them to PAT-passed boxes and enclosures labeled with the same box/album IDs as the files, stored in an interior closet of the living space.

### Gaps
- I did not read the Image Permanence Institute's own guidance; its Media Storage Quick Reference surfaced but wasn't read — [IPI MSQR](https://s3.cad.rit.edu/ipi-assets/publications/msqr.pdf)
- I found no sourced guidance on "magnetic" self-adhesive albums (whether and how to remove prints).
- I did not retrieve the NDSA Levels of Digital Preservation.
- I did not research cloud versus NAS products or prices (possibly covered by other researchers).

## 9. How should home videos be digitized (DIY vs. services, 2026 costs, master and viewing formats, deinterlacing, frame rates, splitting tapes)?

### Takeaway
- **MiniDV (and Digital8) is already digital.** Transfer it over FireWire as native DV with no recompression, though the adapter chain on 2026 Macs is fragile.
- **Analog tape (VHS, VHS-C, Hi8, Video8)** needs a good deck, ideally with a time-base corrector (TBC). Capture a lossless, still-interlaced master (FFV1 in MKV, or ProRes 422 HQ if you'll edit) and make deinterlaced H.264/H.265 MP4 viewing copies.
- **Film** (Regular 8 at 16 fps, Super 8 at 18 fps silent or 24 fps sound) is best scanned frame by frame by a service.
- **Retail:** in 2026, Costco, Walmart, CVS, and Sam's Club tape transfers are fulfilled by Capture (formerly YesVideo). Mail-in services cost roughly $15–35 per tape depending on promotions.

### Cited Findings
**Retail and mail-in services, 2026 (mostly competitor sources)**
- Costco no longer runs its own tape transfer; its Costco Next listing is handled by Capture, the former YesVideo — [Capture blog](https://www.capture.com/blog/costco-video-transfer-alternative); [Legacy Digital (competitor)](https://legacydigital.net/versus/costco-video-transfer-alternative/)
- As of August 2026, CVS, Walmart, and Sam's Club send tapes to Capture (YesVideo, Inc.) in Norcross, Georgia, and the stores disclaim responsibility for the work. One source says Walgreens runs its own DVD transfer service with an unnamed processor — [Legacy Digital (competitor)](https://legacydigital.net/versus/legacy-digital-vs-big-box-stores/)
- Retail per-tape prices conflict: $19.95–$28.50 on one page, $25.99 tape-to-DVD on another — [Legacy Digital](https://legacydigital.net/versus/legacy-digital-vs-big-box-stores/); [Legacy Digital: Costco](https://legacydigital.net/versus/costco-video-transfer-alternative/)
- Turnaround: Capture says under 30 days; Capture quoted 2–3 weeks to a competitor — [TapeSave vs Costco (competitor)](https://www.tapesave.com/vs/costco)
- iMemories:
  - List prices on September 18, 2026: $29.99 per videotape, $29.99 per 50 feet of film, $0.99 per photo. Promotions such as SAVE50 often bring tapes to $14.99.
  - The SafeShip kit is $29.99 extra. Cloud access costs $7.99 a month or $49.99 a year after a 30-day trial.
  - Trustpilot rating 4.4 from 1,474 reviews, with complaints about unexpected total costs and incomplete transfers.
  - Sources — [Pixoneye iMemories cost guide 2026](https://pixoneye.com/imemories-cost/); [Legacy Digital iMemories vs Legacybox](https://legacydigital.net/imemories-vs-legacybox/)
- Legacybox:
  - Prices by kit size, not per tape (September 2026 snapshot): $69.98 for up to 2 items, $319.98 for 10, $639.98 for 20, $1,249.98 for 40. That works out to about $31–35 per item, and an item can be a tape, a film reel, or a set of photos.
  - Another source lists $59.99 for two items.
  - A 2026 comparison mentions a $5.99 digital-download charge and says Legacybox publishes a 480p standard-definition spec for film.
  - Sources — [Legacy Digital iMemories vs Legacybox](https://legacydigital.net/imemories-vs-legacybox/); [Zoopy comparison](https://www.zoopy.com/imemories-vs-legacybox/)
- DIY cost estimate: $80–200 in total, from a single vendor-style guide — [RetroTechLab](https://www.retrotechlab.com/how-to-digitize-vhs-tapes-in-2025-best-hardware-software-guide/)

**DIY analog capture**
- A TBC buffers the unsteady signal coming off a tape and releases it at a steady rate — [Wikipedia: Time base correction](https://en.wikipedia.org/wiki/Time_base_correction)
- Consumer capture devices lack a TBC, so tracking wobble and jitter get "permanently encoded" in the file (merged summary) — [Each Moment](https://www.eachmoment.co.uk/blog/improve-old-video-quality); [RetroTechLab](https://www.retrotechlab.com/how-to-digitize-vhs-tapes-in-2025-best-hardware-software-guide/)
- A TBC "usually can help, but will not solve all problems resulting from bad tape" — [digitalFAQ forum](https://www.digitalfaq.com/forum/video-capture/10993-best-time-base.html)
- The open-source vhs-decode project performs time-base correction in software from RF captures — [vhs-decode wiki](https://github.com/oyvindln/vhs-decode/wiki)
- Master format: vhs-decode's default is lossless FFV1 in an MKV container, recommended "if you're not editing... use the archival FFV1 codec & .mkv" — [vhs-decode Digital Tape Guide](https://github.com/oyvindln/vhs-decode/wiki/Digital-Tape-Guide). Internet Archive VHS uploads use FFV1 — [Internet Archive example item](https://archive.org/details/uncommon-ephemera-vhs-V2046)
- ProRes 422 HQ is presented as an editing-friendly alternative, not the preservation default; these are weaker sources — [One Bright Guide](https://onebrightguide.com/vhs-for-preservation-which-format-should-you-keep/); [Quora (old)](https://www.quora.com/What-are-good-video-settings-for-encoding-captured-VHS-video)
- Keep the master interlaced and deinterlace only the viewing copies — [One Bright Guide](https://onebrightguide.com/vhs-for-preservation-which-format-should-you-keep/). The two main deinterlacers are QTGMC and BWDIF, with QTGMC recommended — [vhs-decode wiki: Standards of Public Archives](https://github.com/oyvindln/vhs-decode/wiki/Standards-of-Public-Archives/21d972d66e74de2e2e392e40f5f39d1c5aa905a9)
- Access copies: H.264 MP4; guides suggest 8–12 Mbps, or 3–6 Mbps / CRF 20–23. MKV for masters and MP4 (H.264 or H.265) for viewing (merged summary) — [One Bright Guide](https://onebrightguide.com/vhs-for-preservation-which-format-should-you-keep/); [Quora](https://www.quora.com/What-are-good-video-settings-for-encoding-captured-VHS-video)

**MiniDV over FireWire, 2026**
- The Mac adapter chain is: Thunderbolt 3 to Thunderbolt 2 adapter, then Thunderbolt 2 to FireWire 800, then a 9-pin to 4-pin cable to the camcorder. Apple's adapter costs about $49. DaVinci Resolve (free) captures DV at native resolution without recompression, and vRecord is a command-line option. These are single-source claims — [VintageCamcorder.com 2026 guide](https://vintagecamcorder.com/capture-minidv-to-modern-mac-2026)
- Apple's FireWire-to-Thunderbolt adapter (MD464ZM) "appears to be discontinued" and is in short supply, and many users of this route report problems — [Apple Community](https://discussions.apple.com/thread/255423558)
- An older (2021) report says QuickTime Player and iMovie capture DV through the FireWire→Thunderbolt 2→Thunderbolt 3 chain — [Apple Community](https://discussions.apple.com/thread/256058940)
- A 2026 opinion piece says modern macOS software often drops frames or silently aborts transfers during tape glitches — [Each Moment](https://www.eachmoment.co.uk/blog/minidv-firewire-to-thunderbolt-4-the-2026-mac-connection-nightmare)
- On Windows, a FireWire card worked for DV capture in Premiere (2021) — [Adobe Community](https://community.adobe.com/t5/premiere-pro-discussions/dv-firewire-to-windows-using-apple-adapters/m-p/12487681)

**8mm and Super 8 film**
- Super 8 runs at 18 fps for silent film and 24 fps for sound; Regular 8 runs at 16 fps — [Wikipedia: Super 8 film](https://en.wikipedia.org/wiki/Super_8_film); [Film Preservation Lab](https://filmpreservationlab.com/services/super-8)
- 18 fps causes compatibility problems; one service recommended 25 fps, and ProRes and common apps "handle 18 fps poorly." Modern scanning can deliver 18p, frame for frame, with no interlacing or added frames — [Apple Community](https://discussions.apple.com/thread/251056966); [Pro8mm](https://www.pro8mm.com/blogs/blog/pro8mm-purchase-new-software-which-renders-a-better-viewing-experience-for-8mm-super8mm-and-16mm-archival-footage-originally-shot-at-18-frames-per-second)
- Professional services offer 4K ProRes masters at their preservation tier, or scan every frame at 2.7K. Consumer all-in-one film scanners output 1080p MP4 (MJPEG) with no audio — [Film Preservation Lab](https://filmpreservationlab.com/services/super-8); [Two Squares](https://www.twosquares.com/film/frame-by-frame-scanning/); [Amazon film-converter listing](https://www.amazon.com/Digital-MovieMaker-Converter-Digitizer-Machine/dp/B097RMKXR1)

### Inferences
- **Choice by format:**
  - **MiniDV:** do it yourself over FireWire as lossless native DV, if a working camcorder or deck and adapters can be found. Otherwise use a service and ask for native .dv files, not MP4 only.
  - **VHS, VHS-C, Hi8:** use a service unless you're willing to source a TBC-equipped deck.
  - **Film:** use a frame-by-frame service. Keep masters at the native 16/18/24 fps and make 24 or 30 fps access copies for the website.
- **Questions to ask any service:**
  - Is the deliverable a lossless or high-bitrate master, or MP4 only?
  - Are files interlaced, and at what resolution?
  - Is footage split into chapters or scenes, and are the originals returned?
  - Legacybox's 480p film spec suggests checking film resolution before ordering.
  - Avoid DVD-only delivery.
- **Splitting long tapes:** keep the whole-tape master untouched. Cut access clips per event, and give each clip its own best-estimate date from tape labels, on-screen date burn-in, or content, using the same exact/estimated scheme as photos (Q5). The website can then mix clips and photos in one timeline.
- **Video metadata:** EXIF doesn't apply to video, so store dates and descriptions in container metadata or sidecars (e.g., following IPTC Video Metadata Hub) and also in the website's database.

### Gaps
- I did not retrieve the Library of Congress Recommended Formats Statement for video, which would be the authoritative US source on FFV1 vs. ProRes masters.
- I did not research local-shop pricing, the Kodak Digitizing Box, Southtree, or other services.
- Hi8/Digital8 specifics (whether Digital8 decks play analog Hi8 out over FireWire) were not sourced.
- Unverified: DV streams embed a per-frame recording date and time that tools could use to split scenes and date clips automatically. I could not source this.
- I found no sourced storage-per-hour figures for FFV1 or ProRes standard-definition masters.

## 10. How can relatives be involved in identifying people and dates and in recording stories?

### Takeaway
Hold small, focused "photo detective" sessions (one album or box at a time) where relatives bring their own albums. Use the photos to prompt recorded oral-history conversations, ask the same open-ended questions for every photo, and log answers against the file ID so they go straight into metadata. The Smithsonian's National Museum of African American History and Culture (NMAAHC) has an oral-history guide, and Photomyne can attach audio recordings to scans.

### Cited Findings
- Host a "Photo Detective Party," or post photos to family groups or Facebook; invite cousins, aunts, and uncles to bring their albums for an afternoon, since their copies may carry captions (merged summary) — [The Photo Managers: Dating and Identifying Old Family Photographs](https://thephotomanagers.com/dating-identifying-old-family-photographs/)
- Work through one envelope, album, or box at a time (merged summary) — [Lisa Lisson: Family Photo Organization](https://lisalisson.com/what-genealogists-ought-to-know-about-photo-organization/)
- Use photos as icebreakers at the start of oral-history interviews; a preliminary conversation helps the narrator recall their life timeline before recording — [Smithsonian NMAAHC: Capturing Your Family's Oral History](https://nmaahc.si.edu/explore/stories/capturing-your-familys-oral-history); [Lisa Lisson](https://lisalisson.com/what-genealogists-ought-to-know-about-photo-organization/)
- Ask the same set of questions for each photo: who is pictured, where and when, what was happening, who took it, and why it was kept. Avoid leading questions. Merged summary; one source is a commercial scanning service — [Family History Daily](https://familyhistorydaily.com/genealogy-help-and-how-to/decipher-old-family-photos/); [ScanMyPhotos (commercial), Sept 2026](https://www.scanmyphotos.com/blog/2026/09/identifying-people-old-photos.html)
- Clothing, hairstyles, backgrounds, photographer stamps, and wedding rings help with dating and identification — [Family History Daily](https://familyhistorydaily.com/genealogy-help-and-how-to/decipher-old-family-photos/)
- Photomyne lets you add names, dates, and locations, tag faces, and attach audio recordings to scans — [Photomyne](https://babe.photomyne.com/get-photomyne)

### Inferences
- **Session format:**
  - Show the day's scans on a TV from the scanning laptop.
  - One person enters names and dates against the file ID (e.g., `RICH-B01-A03-P012-04`) in digiKam or a shared spreadsheet, with a confidence note ("Aunt X certain" / "guess").
  - A phone records audio, with everyone's consent.
  - Save each recording as a WAV master plus an M4A/MP3 access copy, named with the same album ID, so stories can be attached to photos on the website.
- **Prioritize the oldest relatives' sessions first**, since their knowledge is the most at risk.
- **Remote relatives:** a website gallery with a "who is this / when was this" comment or suggestion feature lets people contribute IDs remotely. The site platform research (other researchers) should check whether chosen platforms support this.
- **Bring dating clues to sessions:** ask relatives about known events (moves, cars owned, house remodels, babies), which anchor dates better than "what year was this?"

### Gaps
- I did not research StoryCorps, the Library of Congress American Folklife Center's fieldwork guide, or FamilySearch Memories (which allows audio attached to photos).
- I found no sourced guidance on consent or release forms for recording and sharing relatives' oral histories.
