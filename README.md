# Sound Adjuster website

Product website and interactive audio demo for [Sound Adjuster for Firefox](https://addons.mozilla.org/firefox/addon/sound-adjuster/).

Website: https://sound-adjuster.github.io/

## Editing

This is a static website with no build step. `index.html` contains the home page, `privacy.html` the website privacy notice, and `locales.js` translations in English, German, Japanese, Turkish, Spanish, and European Portuguese. The extension preview intentionally stays in English to match the released extension.

Styles and scripts are served locally. The audio demo generates its sample in the browser and uses local storage for preferences and saved demo profiles.

## Publishing

Website repository: https://github.com/sound-adjuster/sound-adjuster.github.io

GitHub repository settings: **Pages → Deploy from a branch → main → /(root)**. Changes committed to `main` are published automatically. `.nojekyll` keeps this a plain static site.

Keep `index.html` at the repository root and upload the contents of the website folder, including `assets`. Do not upload the ZIP archive itself. The original extension source is maintained separately at https://github.com/tropicaddons/sound-adjuster.

Font and icon license notices are included in `assets`.

## Search discovery

`robots.txt` allows crawling and points to `sitemap.xml`. The sitemap lists the two canonical pages. Update each page's `lastmod` only when that page changes meaningfully. The home page includes WebSite structured data for the Sound Adjuster site name.

To monitor indexing, add `https://sound-adjuster.github.io/` as a URL-prefix property in Google Search Console, verify ownership with the HTML tag or file provided by Google, and submit `sitemap.xml`. Keep the verification tag/file in future updates. These steps help discovery; they do not guarantee indexing or ranking.

The language selector currently uses one URL. It does not create six independently indexable language pages.
