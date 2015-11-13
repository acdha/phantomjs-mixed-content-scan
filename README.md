# Report mixed content on web pages using PhantomJS

This is a simple script which loads HTTPS pages and reports any resources which are loaded insecurely and are thus likely to be blocked by modern browsers.

Note that it does not include a spider – you may use a tool like [LinkChecker](https://wummel.github.io/linkchecker/) to generate a big list or something like [extract-urls](https://github.com/acdha/unix_tools/blob/master/bin/extract-urls) to load a list from a page:

    http loc.gov | extract-urls | grep -F .gov | cut -f1 -d"'" | grep -vF cdn.loc.gov | grep -vE '/(images|js|javascript|stylesheets|css|foresee)/' | grep -vE '[.](js|css)$' | perl -pe 's|^(?!http://)|http://|' | sort -ifu | xargs ./report-mixed-content.js

## Requirements

* PhantomJS 2.0

## Usage

```
./report-mixed-content.js https://www.example.org/page1 https://www.example.org/page2 …
```
