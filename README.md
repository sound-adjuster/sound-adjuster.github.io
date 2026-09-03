# Sound Adjuster website

Product website and interactive audio demo for [Sound Adjuster for Firefox](https://addons.mozilla.org/firefox/addon/sound-adjuster/).

Website: https://sound-adjuster.github.io/

## Editing

This is a static website with no build step. `index.html` contains the home page, `guides.html` three short guides to volume, saved settings and stereo balance, `privacy.html` the website privacy notice, and `locales.js` translations in English, German, Japanese, Turkish, Spanish, and European Portuguese. The extension preview and control names intentionally stay in English to match the released extension.

Styles and scripts are served locally. The audio demo generates its sample in the browser and uses local storage for preferences and saved demo profiles.

## Publishing

Website repository: https://github.com/sound-adjuster/sound-adjuster.github.io

GitHub repository settings: **Pages → Deploy from a branch → main → /(root)**. Changes committed to `main` are published automatically. `.nojekyll` keeps this a plain static site.

Keep `index.html` at the repository root and upload the contents of the website folder, including `assets`. Do not upload the ZIP archive itself. The original extension source is maintained separately at https://github.com/tropicaddons/sound-adjuster.

Font and icon license notices are included in `assets`.

## Search discovery

`robots.txt` allows crawling and points to `sitemap.xml`. The sitemap lists the three canonical pages. Update each page's `lastmod` only when that page changes meaningfully. The home page includes WebSite structured data for the Sound Adjuster site name. Guides are ordinary, visible HTML content and remain readable without JavaScript.

To monitor indexing, add `https://sound-adjuster.github.io/` as a URL-prefix property in Google Search Console, verify ownership with the HTML tag or file provided by Google, and submit `sitemap.xml`. Keep the verification tag/file in future updates. These steps help discovery; they do not guarantee indexing or ranking.

The language selector currently uses one URL. It does not create six independently indexable language pages.

Keep both the Google and Bing ownership meta tags in the home page when updating or replacing it.
