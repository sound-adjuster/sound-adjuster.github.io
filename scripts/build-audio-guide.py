"""Rebuild the five static article translations from the English page/locales.js.

Run with Python 3 from any directory. Uses only the standard library.
The rest of this site still needs no build step.
"""
from pathlib import Path
from html.parser import HTMLParser
from html import escape
import json
import re

ROOT = Path(__file__).resolve().parents[1]
LANGUAGES = ('en', 'de', 'ja', 'tr', 'es', 'pt')
LANG_TAGS = {'pt': 'pt-PT'}
BASE = 'https://sound-adjuster.github.io/'
NAMES = ('English', 'Deutsch', '日本語', 'Türkçe', 'Español', 'Português')
VOID = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'}

def filename(lang):
    return f'default-audio-settings{"" if lang == "en" else "-" + lang}.html'

locale_source = (ROOT / 'locales.js').read_text(encoding='utf-8-sig')
rows = json.loads(locale_source[locale_source.index('['):locale_source.rindex(']') + 1])
translations = {row[0]: row for row in rows}
source = (ROOT / filename('en')).read_text(encoding='utf-8-sig')

# Keep a single, repeatable set of reciprocal language annotations in the source.
source = re.sub(r'\s*<link rel="alternate" hreflang="[^"]*" href="[^"]*">', '', source)
alternates = '\n'.join(f'  <link rel="alternate" hreflang="{LANG_TAGS.get(lang, lang)}" href="{BASE + filename(lang)}">' for lang in LANGUAGES)
alternates += f'\n  <link rel="alternate" hreflang="x-default" href="{BASE + filename("en")}">'
source = source.replace('</head>', alternates + '\n</head>')
source = re.sub(r'\s*<nav class="article-language-links".*?</nav>', '', source, flags=re.S)
language_links = '<nav class="article-language-links" aria-label="Read this guide in another language"><p>Read this guide in another language</p>'
language_links += ''.join(f'<a href="{filename(lang)}" lang="{LANG_TAGS.get(lang, lang)}" hreflang="{LANG_TAGS.get(lang, lang)}">{name}</a>' for lang, name in zip(LANGUAGES, NAMES)) + '</nav>'
source = source.replace('  </main>', '    ' + language_links + '\n  </main>')
(ROOT / filename('en')).write_text(source, encoding='utf-8')

class ArticleTranslation(HTMLParser):
    def __init__(self, lang):
        super().__init__(convert_charrefs=True)
        self.lang, self.index = lang, LANGUAGES.index(lang)
        self.url = BASE + filename(lang)
        self.stack, self.output = [], []
    def t(self, value):
        return translations.get(value, [value] * len(LANGUAGES))[self.index]
    def handle_decl(self, decl): self.output.append(f'<!{decl}>')
    def handle_comment(self, value): self.output.append(f'<!--{value}-->')
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        skip = (self.stack[-1][1] if self.stack else False) or attrs.get('translate') == 'no' or tag in ('script', 'style', 'option')
        if tag == 'html': attrs['lang'] = LANG_TAGS.get(self.lang, self.lang)
        if tag == 'link' and attrs.get('rel') == 'canonical': attrs['href'] = self.url
        if tag == 'meta' and attrs.get('property') == 'og:url': attrs['content'] = self.url
        if tag == 'option':
            attrs.pop('selected', None)
            if attrs.get('value') == self.lang: attrs['selected'] = None
        if not skip:
            for attr in ('aria-label', 'placeholder', 'title', 'content'):
                if attr in attrs and attrs[attr] is not None: attrs[attr] = self.t(attrs[attr])
        rendered = ''.join(' ' + key if value is None else f' {key}="{escape(value, quote=True)}"' for key, value in attrs.items())
        self.output.append(f'<{tag}{rendered}>')
        if tag not in VOID: self.stack.append((tag, skip, attrs))
    def handle_endtag(self, tag):
        self.output.append(f'</{tag}>')
        if self.stack and self.stack[-1][0] == tag: self.stack.pop()
    def handle_data(self, value):
        if self.stack and self.stack[-1][0] == 'script':
            if self.stack[-1][2].get('type') == 'application/ld+json':
                schema = json.loads(value)
                schema.update(headline=self.t(schema['headline']), description=self.t(schema['description']), mainEntityOfPage=self.url, inLanguage=LANG_TAGS.get(self.lang, self.lang))
                value = '\n' + json.dumps(schema, ensure_ascii=False, indent=2) + '\n'
            self.output.append(value)
        elif self.stack and self.stack[-1][1]: self.output.append(value)
        else:
            content = value.strip()
            before = re.match(r'^\s*', value)[0]
            after = re.search(r'\s*$', value)[0] if content else ''
            self.output.append(escape(before + self.t(content) + after, quote=False))

for lang in LANGUAGES:
    translator = ArticleTranslation(lang)
    translator.feed(source)
    translator.close()
    (ROOT / filename(lang)).write_text(''.join(translator.output), encoding='utf-8')

print('Built six static language pages from the English article and locales.js.')
