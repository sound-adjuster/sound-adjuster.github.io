# Sound Adjuster website

Product website and interactive audio demo for [Sound Adjuster for Firefox](https://addons.mozilla.org/firefox/addon/sound-adjuster/).

Website: https://sound-adjuster.github.io/

## Editing

This is a static website. `index.html` contains the home page and translated audio demo, `guides.html` the listening guide hub, `privacy.html` the website privacy notice, and `locales.js` translations in English, German, Japanese, Turkish, Spanish, and European Portuguese. Extension labels within instructional prose stay in English so readers can find the matching controls in Firefox.

`default-audio-settings.html` is the English guide to per-site Remember settings, global defaults, Reset and keyboard shortcuts. Its five `default-audio-settings-{de,ja,tr,es,pt}.html` translations are complete static HTML, readable without JavaScript. After editing the English article or its translations in `locales.js`, run `python scripts/build-audio-guide.py` with Python 3 to regenerate the article pages. The generator uses only the standard library. Other pages need no build step.

`article-language.js` switches between article language URLs. `i18n.js` keeps the home page and guide hub links aligned with the selected site language. Keep the updated script/style version parameters together when releasing changes, so returning visitors load a consistent set of assets.

Styles and scripts are served locally. The audio demo generates its sample in the browser and uses local storage for preferences and saved demo profiles.

## Publishing

Website repository: https://github.com/sound-adjuster/sound-adjuster.github.io

GitHub repository settings: **Pages → Deploy from a branch → main → /(root)**. Changes committed to `main` are published automatically. `.nojekyll` keeps this a plain static site.

Keep `index.html` at the repository root and upload the contents of the website folder, including `assets`. Do not upload the ZIP archive itself. The original extension source is maintained separately at https://github.com/tropicaddons/sound-adjuster.

Font and icon license notices are included in `assets`.

## Search discovery

`robots.txt` allows crawling and points to `sitemap.xml`. The sitemap lists the home page, guide hub, privacy notice and all six article URLs. Update each page's `lastmod` only when that page changes meaningfully. The home page includes WebSite structured data; each article has its own canonical URL, reciprocal language alternatives and Article structured data matching the visible text. Guides remain readable without JavaScript.

To monitor indexing, add `https://sound-adjuster.github.io/` as a URL-prefix property in Google Search Console, verify ownership with the HTML tag or file provided by Google, and submit `sitemap.xml`. Keep the verification tag/file in future updates. These steps help discovery; they do not guarantee indexing or ranking.

The home page, guide hub and privacy notice still use one URL each with client-side language selection. The new defaults/per-site article has six independently accessible language URLs. It does not automatically redirect visitors based on browser language.

Keep both the Google and Bing ownership meta tags in the home page when updating or replacing it.
