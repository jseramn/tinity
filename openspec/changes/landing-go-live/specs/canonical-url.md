# Capability: tinity-canonical-url

## Purpose

The landing declares `https://tinity.jseramn.tech/` as its canonical URL. Search engines consolidate ranking signals to the new domain.

## Requirements

### Requirement: Canonical link tag

The landing's `index.html` MUST include `<link rel="canonical" href="https://tinity.jseramn.tech/">`.

#### Scenario: landing served

- G- the landing is deployed at `tinity.jseramn.tech`
- W- a search engine crawls the page
- T- it sees the canonical tag and indexes `https://tinity.jseramn.tech/` as the authoritative URL

### Requirement: og:url matches canonical

The landing's `index.html` MUST have `<meta property="og:url" content="https://tinity.jseramn.tech/">`.

#### Scenario: social share

- G- someone shares the landing on X or LinkedIn
- W- the social platform fetches the page for preview
- T- the share URL is `https://tinity.jseramn.tech/`

### Requirement: og:image uses new domain

The landing's `index.html` MUST have `<meta property="og:image" content="https://tinity.jseramn.tech/tinity-og.png">` (or equivalent path on the new domain).

#### Scenario: social preview

- G- the og:image URL is on the new domain
- W- a social platform renders the share preview
- T- the image loads from `tinity.jseramn.tech` directly, no cross-origin issues
