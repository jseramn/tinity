# Capability: tinity-domain-redirect

## Purpose

Any request to `jseramn.tech/tinity/*` returns HTTP 301 with `Location` header pointing at the equivalent path on `tinity.jseramn.tech`.

## Requirements

### Requirement: Bare path redirect

The system MUST respond to `GET /tinity` (no trailing slash, no extra path) with status 301 and `Location: https://tinity.jseramn.tech`.

#### Scenario: bare path

- G- portfolio's vercel.json has the redirect rule
- W- a client sends `GET https://www.jseramn.tech/tinity`
- T- the response is 301 with `Location: https://tinity.jseramn.tech`

### Requirement: Splat path redirect

The system MUST respond to `GET /tinity/<anything>` with status 301 and `Location: https://tinity.jseramn.tech/<anything>` preserving the path.

#### Scenario: asset path

- G- portfolio's vercel.json has the splat redirect rule
- W- a client sends `GET https://www.jseramn.tech/tinity/assets/index.js`
- T- the response is 301 with `Location: https://tinity.jseramn.tech/assets/index.js`

#### Scenario: deep path

- G- portfolio's vercel.json has the splat redirect rule
- W- a client sends `GET https://www.jseramn.tech/tiny/llms.txt`
- T- the response is 301 with `Location: https://tinity.jseramn.tech/llms.txt`

### Requirement: Query string preservation

The system MUST preserve query strings in the redirect target.

#### Scenario: query string

- G- portfolio's vercel.json has the splat redirect rule
- W- a client sends `GET https://www.jseramn.tech/tinity/page?ref=foo`
- T- the response is 301 with `Location: https://tinity.jseramn.tech/page?ref=foo`

### Requirement: HTTP to HTTPS upgrade

The system MUST redirect HTTP requests to HTTPS automatically (Vercel's built-in behavior).

#### Scenario: HTTP upgrade

- G- Vercel's automatic HTTP→HTTPS redirect
- W- a client sends `GET http://jseramn.tech/tinity/`
- T- the response is 301 to `https://www.jseramn.tech/tinity/`, then 301 to `https://tinity.jseramn.tech/`
