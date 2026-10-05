"""Generate the plain text sitemap from sitemap.xml using Python 3 stdlib."""
from pathlib import Path
from xml.etree import ElementTree

root = Path(__file__).resolve().parents[1]
namespace = {'s': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
document = ElementTree.parse(root / 'sitemap.xml')
urls = [node.text.strip() for node in document.findall('s:url/s:loc', namespace)]
if not urls or len(urls) != len(set(urls)):
    raise ValueError('The XML sitemap must contain a nonempty, unique URL list.')
if any(not url.startswith('https://sound-adjuster.github.io/') or any(char.isspace() for char in url) for url in urls):
    raise ValueError('Every entry must be an absolute site URL without whitespace.')
(root / 'sitemap.txt').write_text('\n'.join(urls) + '\n', encoding='utf-8')
print(f'Built sitemap.txt with {len(urls)} URLs from sitemap.xml.')
