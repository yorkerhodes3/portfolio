# Drafting portfolio.json records

You are drafting records for Yorke E. Rhodes III's public portfolio. Each record describes an **existing** project; you are summarizing evidence, not marketing it. Write only `catalog/projects/<id>/portfolio.json` and `catalog/projects/<id>/.portfolio/*.webp` for **your assigned ids**. Do not edit anything else, do not commit, do not touch other projects.

## Inputs per project

- `.work/context/<Owner>__<repo>.json`: description, README (first 7,000 chars), contributors, `lastCommit`, `hasPages`, `homepage`, existing image paths, HTML pages.
  If the README is truncated and you need more, read it with `gh api repos/<owner>/<repo>/readme -H 'Accept: application/vnd.github.raw+json'`.
- `.work/roles.json` → `["<Owner>/<repo>"]`: computed `role` and `credits` from commit history (Yorke's accounts are `yorkerhodes3` and `yorhodes`; commits named "Yorke Rhodes III" are his).
- Picture pool `.work/pool/<id>/`:
  - `capture-N.png`: offline screenshots of the project site; `.work/captures.json` → `[id]` says which page (and section) each shows.
  - `repo-N.png`: images already in the repository; `.work/repo-images.json` → `[id]` gives each one's repository `path`.
- Schema: `catalog/schema/portfolio.schema.json`. Vocabulary: `catalog/tags.json` (only these tags, kinds, roles and evidence levels are valid).

## Fields

| Field | Rule |
| --- | --- |
| `schemaVersion` | `1` |
| `id` | The id you were given. |
| `title` | The product's name as the README presents it, not the repo slug. ≤ 80 chars. |
| `repo` | Canonical `Owner/repo` exactly as given. |
| `aliases` | Only where told (duplicates). |
| `summary` | One plain-language sentence, 20–220 chars: what it is and for whom. No hype words (revolutionary, cutting-edge, powerful, seamless). |
| `kind` | `research` (papers, reports, research knowledge bases), `decision-model` (simulations, risk/scoring models, decision support), `tool` (libraries, utilities, developer tools), `infrastructure` (platforms, self-hosting, proxies, hardware), `application` (end-user apps and interactive experiences). Pick the primary one. |
| `methodTags` | 1–4, each supported by the README: `applied-ai` (AI is used), `agentic-workloads` (agents plan/act/use tools/negotiate), `frontier-models` (explicitly uses or evaluates frontier LLMs such as Claude, GPT, Gemini), `blockchain`, `ethereum` (only if Ethereum, an EVM chain, an ERC or EIP is explicit), `decision-models` (simulation, Monte Carlo, scoring, decision support), `edge-hardware` (self-hosting, bare metal, local GPUs, devices), `open-source` (OSI license in context `license`, or the README states it is open source), `digital-twins` (3D twins or simulated environments), `provenance` (provenance, attestation, verifiable credentials, signatures), `data-visualization` (maps, dashboards or graphs are central). |
| `domainTags` | 1–3 from the domain facet, supported by the README. |
| `contribution.date` | `lastCommit.date` from context. |
| `contribution.role` | The computed role. Never upgrade it. If the README names other people as the project's creators (e.g. "Originally by @X", a student team) and Yorke has commits, use `co-built`; if Yorke has no commits it stays `advisor-prof`. |
| `contribution.roleNote` | Optional, ≤ 200 chars, factual: e.g. "Extends elvarofficial/teardown." or "Fall 2025 cohort project; Yorke advised." Only from evidence. |
| `contribution.credits` | People other than Yorke, from `roles.json` plus anyone the README credits. Clean up: drop non-people ("GitHub CLI", "pages-ai-proxy", "DropBoard", bots); merge a name-only entry with the matching login (e.g. `{ "name": "Melanie MacKew", "github": "mmelanie" }`). Use the person's real name when known, else the login. `role`: "Student researcher" for Ethical Tech CoLab cohort members when the README or context makes that clear, "Original author" for an upstream author, else "Contributor". Never list Yorke. An `advisor-prof` record must have at least one credit. |
| `narrative.problem` | The problem as it exists, from the README, 30–600 chars. |
| `narrative.decision` | One consequential design choice the README evidences (e.g. "runs entirely in the browser on synthetic data", "uses ERC-8004 registries for identity"). |
| `narrative.tradeoff` | What that choice costs or rules out. Reason from the evidence; don't invent. |
| `narrative.limitation` | An honest current limitation: stated status, prototype stage, synthetic or notional data, scope gaps, missing evaluation. |
| `narrative.caveat` | Only when a reader trying the demo must know something: synthetic data, notional/educational content, AI-generated negotiation, not legal advice, etc. ≤ 300 chars. |
| `evidence.level` | `design` (spec/plan/concept only), `working-demo` (runnable code or a working site), `evaluated-result` (the README reports tests, benchmarks, Monte Carlo results or another evaluation with outcomes), `field-use` (the README documents use with real people, e.g. in a course, summit or by an organization). Choose the highest level the evidence supports. |
| `evidence.links` | At least `{ "label": "Latest commit", "url": lastCommit.url, "date": lastCommit.date }` and `{ "label": "README", "url": "https://github.com/<repo>#readme", "date": lastCommit.date }`. Add reports, papers, results or test docs that exist in the repo as `https://github.com/<repo>/blob/<defaultBranch>/<path>` with the same date. |
| `links.source` | `https://github.com/<repo>` |
| `links.demo` | Only if the README gives a live URL that is not the GitHub Pages site (the refresh adds the Pages URL automatically when `hasPages` is true). Never invent one. |
| `images` | Exactly three distinct pictures; see below. |
| `defaultImageId` | The single most explanatory picture. It is the one printed in the portfolio PDF. |

Never invent users, metrics, deployments, partners, awards, dates or quotes. Prefer the README's own wording for facts. Write in neutral present tense about the project; don't describe Yorke.

## Pictures

1. **Look at every candidate with the `view` tool before choosing.** Skip blank, broken, error, loading or near-duplicate pictures. Captures were made offline: maps may lack basemap tiles and external data may be missing. Choose views that look intact and describe only what is visible.
2. Use pictures that explain different aspects (overview, a key interaction, a result).
3. A `repo-N.png` that is **not** an SVG: use its repository path as `src` (e.g. `"site/og-image.png"`).
   A `capture-N.png`, or a `repo-N.png` from an `.svg`: run
   `node src/build/draft-media.mjs adopt <id> .work/pool/<id>/<file> <imageId>` and use the printed `src` (`.portfolio/<imageId>.webp`).
4. If fewer than three good pictures exist, make document-excerpt cards that quote the README verbatim:
   `node src/build/draft-media.mjs excerpt <id> <imageId> "<Owner display> · <kind label>" "<short heading from README>" "<verbatim sentence(s) from README, ≤ 220 chars>"`
   then `view` the result. Use excerpt cards only to fill gaps, and quote different passages for each.
5. `id`: short, lowercase, descriptive (`graph`, `earth-view`, `report-cover`). `alt`: what is visible, 10–300 chars. `caption`: what it shows and why it matters, 5–300 chars. `credit`: e.g. "Screenshot of the Felementum site", "Image from the felementum repository", "Excerpt from the Felementum README". `source`: "screenshot of site/index.html", "repository file results/x.svg", "README excerpt".

## Finish

Validate every record: `node src/refresh/validate-cli.mjs catalog/projects/<id>/portfolio.json` must report it valid. Then reply with a table: id, title, role, evidence level, method tags, domain tags, default image, and any doubt a reviewer should check (credits, role, tags). Keep the reply under 400 words.
