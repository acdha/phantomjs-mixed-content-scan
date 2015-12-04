#!/usr/bin/env python -u
# encoding: utf-8
"""
Filter URLs for those which return HTTP 200

Provide URLs as arguments or lines on standard input.

All URLs which returned an HTTP 200 will be written to standard output.
Any errors or non-200 HTTP status will be logged to standard error.
"""

from __future__ import (absolute_import, division, print_function,
                        unicode_literals)

import argparse
import sys
from itertools import chain

import requests

parser = argparse.ArgumentParser(description=__doc__.strip())
parser.add_argument('--follow-redirects', action='store_true', default=False,
                    help='Attempt to follow redirect chains, confirming that the final page returns HTTP 200')
parser.add_argument('--rewrite-insecure-redirects', action='store_true', default=False,
                    help='Instead of failing when a secure URL redirects to an insecure target, '
                         'see whether it will work using HTTPS')
args, unknown = parser.parse_known_args()

all_urls = [i.strip() for i in unknown]
if not sys.stdin.isatty():
    all_urls = chain(all_urls, sys.stdin.readlines())

with requests.session() as s:
    for original_url in all_urls:
        url = original_url = original_url.strip()

        while url:
            try:
                resp = s.get(url, allow_redirects=False)
            except IOError as exc:
                print('Error checking {original_url}: {url} raised {exc}'.format(original_url=original_url,
                                                                                 url=url,
                                                                                 exc=exc),
                      file=sys.stderr)
                continue

            if resp.status_code == 200:
                print(original_url)
            elif resp.is_redirect and args.follow_redirects:
                url = resp.headers['Location']

                if original_url.startswith('https') and url.startswith('http:'):
                    if args.rewrite_insecure_redirects:
                        print('{0} redirects to insecure {1}: rewriting'.format(original_url, url),
                              file=sys.stderr)
                        url = url.replace('http:', 'https:')
                        continue
                    else:
                        print('{0} redirects to insecure {1}: aborting'.format(original_url, url),
                              file=sys.stderr)
                        break
            else:
                print(resp.status_code, url, file=sys.stderr)

            break
