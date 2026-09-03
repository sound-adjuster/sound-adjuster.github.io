# Sound Adjuster website

Product website and interactive audio demo for [Sound Adjuster for Firefox](https://addons.mozilla.org/firefox/addon/sound-adjuster/).

Website: https://tropicaddons.github.io/sound-adjuster-website/

## Editing

This is a static website with no build step. `index.html` contains the home page, `privacy.html` the website privacy notice, and `locales.js` translations in English, German, Japanese, Turkish, Spanish, and European Portuguese. The extension preview intentionally stays in English to match the released extension.

Styles and scripts are served locally. The audio demo generates its sample in the browser and uses local storage for preferences and saved demo profiles.

## Publishing

GitHub repository settings: **Pages → Deploy from a branch → main → /(root)**. Changes committed to `main` are published automatically. `.nojekyll` keeps this a plain static site.

Keep `index.html` at the repository root and upload the contents of the website folder, including `assets`. Do not upload the ZIP archive itself. The original extension source is maintained separately at https://github.com/tropicaddons/sound-adjuster.

Font and icon license notices are included in `assets`.
