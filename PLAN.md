# Plan: Yorke E. Rhodes III | Work since January 2026

**Status:** Draft for human review · **Spec:** [v0.2.0, approved with changes](./SPECIFICATION.md) · **Date:** 2026-11-26  
**Owner and reviewer:** Yorke E. Rhodes III · **Drafting assistance:** GitHub Copilot · **Task list:** [BACKLOG.md](./BACKLOG.md)

## 1. Approach

Treat every project as an **existing product** and this portfolio as a reader of that work, not a rebuild. The only new software lives in this repository: a static site, a refresh script and the PDF export. In each source repository the change is limited to three templated additions, in **one pull request per repository** that Yorke merges as admin: `portfolio.json`, a favicon if missing, and a share image with its meta tags if missing. The CV and bios form a small parallel track.

**Audit, 2026-11-26.** 69 public candidates (54 Ethical-Tech-CoLab, 15 yorkerhodes3), including 5 forks, 2 names present in both accounts, this repository and one unlisted repository. Yorke has **admin rights on all 69**. Sites without a favicon: **23**. Sites without a share-image tag: **66**. Repositories with a custom GitHub social preview: **0**; GitHub has no API to upload one, so that is a manual Settings step. **24** repositories already hold three or more images; the rest need screenshots of their live demos, captured in GitHub Actions because this workspace cannot reach `*.github.io`. Counts come from scanning each site's entry page and may be off by a few. A push is a discovery signal only (FR-01).

## 2. Technical decisions

| # | Decision | Choice and reason | Rejected |
| --- | --- | --- | --- |
| D-01 | Hosting | **GitHub Pages via Actions**, already configured for this repository at `https://yorkerhodes3.github.io/portfolio/`. Free, static and no account for visitors. | Vercel/Netlify (another account); the CoLab website (not a personal record). |
| D-02 | Site stack | **Static HTML and CSS with small vanilla ES modules**, pre-rendered by a Node 20 build from the approved snapshot. Cards and project text exist in the HTML; JavaScript adds filtering, grouping and the gallery. Matches Wayfinder's codebase and keeps upkeep low. | Next.js (used by the CoLab site; heavy for one catalog); Astro (sound, but an extra framework for templates we can write directly). |
| D-03 | Design tokens and fonts | **Port Wayfinder's default CoLab theme** (plum `#120c1a`, lime `#c8f04b`, violet glow) as CSS variables. **Self-host** Bebas Neue, Space Mono and Inter (SIL OFL) so pages make no third-party font request and PDFs embed the same type. | Google Fonts CDN (privacy, offline PDFs); re-deriving a palette by eye. |
| D-04 | Project records | One **`portfolio.json`** per project, validated against `catalog/schema/portfolio.schema.json` (JSON Schema 2020-12, Ajv) and the controlled vocabulary in `catalog/tags.json`. Records are drafted in `catalog/projects/<id>/` so Yorke can review them in one table, then added to the source repository's root in that repository's PR. Until the PR is merged, the refresh reads the draft and reports it as `pending upstream`. Image paths resolve relative to the record. | Central spreadsheet (no maintainer ownership); GitHub topics as tags (no facets, credits or images). |
| D-05 | Approval | **The refresh opens a pull request; merging it is approval.** The PR carries the regenerated snapshot, mirrored media and a human-readable refresh report. Pages deploys only from `main`. Follows CoLab practice: focused PRs and an auditable record of what was approved and when. | Admin web page (needs authentication and a backend); auto-publish (violates FR-10 and FR-11). |
| D-06 | Refresh function | `npm run refresh` locally (uses `gh auth token`) or the **Refresh catalog** Actions workflow (`workflow_dispatch`, which requires write access, so it is owner-run). It lists both owners, resolves records, validates, checks demo links, mirrors and resizes media pinned to the source commit, then writes the report. Check dates go in `catalog/checks.json`, apart from content, so an unchanged rerun produces no content diff. | Live GitHub API calls from visitors' browsers (rate limits, unreviewed content). |
| D-07 | Private exclusions | Repositories that must not be named publicly are excluded by **SHA-256 hash of `owner/repo`** in `catalog/exclusions.json`. A test fails the build if an excluded name appears in `dist/` or `catalog/`. | Plain-text denylist (exposes what it hides); GitHub topic (topic pages list the repository). |
| D-08 | PDFs | **Playwright/Chromium prints dedicated print pages** during the Pages build: `print/portfolio.html`, `print/cv.html`, `print/full-bio.html`, `print/speaker-bio.html`. Fonts and images are local, so both are embedded and the files work offline. A short check fails the build if a published project title is missing or repeated, or the portfolio exceeds 20 MB. | Client-side html2pdf/jsPDF (rasterized, unselectable text); relying on the visitor's Print dialog (output varies); Typst/LaTeX for the CV (a second styling system). |
| D-09 | CV and bio styling | **Traditional single-column layout on a white page in the portfolio's colors.** Plum carries text and rules (`#3b1878` on white is 13.2:1). Lime appears only on plum surfaces (10.1:1), such as the name band, or as non-text marks: lime on white is 1.31:1 and cannot carry text. Bebas Neue for name and section headings, Inter for body text, Space Mono for dates. | Dark-ground CV (heavy to print, unconventional for recruiters); the fellowship documents' styling, as directed. |
| D-10 | Career content | Originals live in a private repository, cloned into **`private/cv-reference/`**, which Git ignores; this repository is public. Source conflicts and clearance items are tracked in the ignored `private/career-review.md`. Approved facts go into `career/career.json`, and the two bios into `career/bios.md`, through a PR in which Yorke approves each entry. Use of the seven files is limited by source (below). Contact details appear only if Yorke approves them. | Committing the originals; re-styling the fellowship PDFs. |
| D-11 | Pictures, favicons and share images | Three pictures per project, chosen in this order: existing share image, Playwright captures of distinct demo views, README figures or diagrams, document excerpts for papers. Stored as WebP no wider than 1,600 px and normally under 250 KB. Missing favicons and 1200 × 630 share images are rendered from one template using the project's own colors where its record supplies them, otherwise Wayfinder's. They go into the same per-repository PR as `portfolio.json`. GitHub's repository social preview has no upload API, so the same image is set by hand in each repository's Settings. Captions carry third-party attribution such as basemap tiles. | Invented product screens; one image repeated three times; pushing to repositories without a PR. |
| D-12 | Testing | `node:test` for the refresh rules: distinct counts, determinism, failure preservation and exclusions. One Playwright smoke test covers filters, gallery and downloads. At release: an axe accessibility scan, a 320 px phone pass, offline PDF inspection and the trial readers. | Snapshot tests of whole pages (brittle, little signal); a full end-to-end suite for a two-template site. |

**Career source files (D-10).** The CV Reference folder holds seven PDFs prepared for the Belfer Center Nova Fellowship application. **All seven are read as context**, shaping which work and themes the CV and bios emphasize. The public text states only facts that appear in Yorke's own documents, written neutrally for a general reader. Where sources disagree on a fact, Yorke decides; never merge conflicting dates silently.

| File | Role in the CV and bios |
| --- | --- |
| `Belfer Center Fellow - CV - Yorke Rhodes.pdf` | **Primary** for roles, scope, shipped systems, teaching, talks, publications, advisory roles, affiliations and education. Drop fellowship-directed wording. |
| `Yorke Rhodes III LinkedIn PDF.pdf` | **Primary** cross-check for titles, organizations and dates. |
| `Belfer Center Fellow Statement of Interest Yorke Rhodes III.pdf` | Context for the bios' themes and motivations; restate facts in the third person without the application argument. |
| `Belfer Center Fellowship - Project Proposal - Yorke Rhodes.pdf` | Context for current research direction. A proposed project is described as work only if it appears in the portfolio. |
| `Belfer Center Nova Fellow Application - Yorke Rhodes - email.pdf` | Context only. Yorke's contact details appear only with his approval (Q-01). It also lists the references' names and contact details: third-party personal data, never published. |
| `Belfer Center recommendation for Yorke Rhodes - multilateral.pdf`, `… - industry - Microsoft.pdf` | Context for which contributions others found significant. **Not quoted, paraphrased or attributed** without the recommender's written consent, recorded in the career PR (Q-05). |

## 3. Architecture

```text
 yorkerhodes3/*     Ethical-Tech-CoLab/*            CV Reference folder (local only)
   portfolio.json  or  catalog/projects/<id>/            │ extraction PR, Yorke approves
            │                                            ▼
            ▼                                   career/career.json · career/bios.md
  Refresh (npm run refresh │ Actions dispatch)                         │
   list → resolve → validate → check links → mirror media → report     │
            │                                                          │
            ▼                                                          │
  Pull request: catalog/snapshot.json + media/ + refresh-report.md     │
            │  merge = approval                                        │
            ▼                                                          ▼
  Build on main: render pages ─► print pages ─► Playwright PDFs ─► verify
            │
            ▼
  GitHub Pages: /  ·  /p/<id>/  ·  /downloads/*.pdf (four files, dated)
```

## 4. Repository layout

```text
portfolio/
├─ CONCEPT-IDEA.md · SPECIFICATION.md · PLAN.md · BACKLOG.md · README.md
├─ catalog/
│  ├─ schema/portfolio.schema.json   record contract, v1
│  ├─ tags.json                      facets and tags with labels
│  ├─ inventory.json                 every candidate and its disposition (public; keep reasons neutral)
│  ├─ exclusions.json                hashed private exclusions (D-07)
│  ├─ projects/<id>/                 drafted records awaiting their repository PR
│  ├─ snapshot.json                  approved catalog, written by refresh
│  ├─ checks.json                    link and demo check dates
│  └─ refresh-report.md              the reviewer's view of the last refresh
├─ career/                           approved extracts only (D-10)
├─ private/                          ignored by Git: CV Reference originals
├─ media/projects/<id>/              mirrored gallery, favicon and share image
├─ src/  refresh/ · build/ · site/ (templates, css, js) · assets/fonts/
├─ test/ unit/ · e2e/ · fixtures/
└─ .github/workflows/  deploy.yml · refresh.yml
```

## 5. Milestones

| # | Demonstrable outcome | Covers | Target |
| --- | --- | --- | --- |
| M0 | A Wayfinder-styled page with the bio line loads at the public URL; merging to `main` redeploys it. | Setup | Day 1 |
| M1 | Every candidate has a disposition. Yorke has reviewed the drafted records in one table. **Refresh catalog** produces the snapshot and its report; a malformed record is reported without loss. Per-repository PRs are merged. | US-05; FR-01, FR-04, FR-07, FR-10, FR-11 | Week 1 |
| M2 | The dashboard shows the four lenses; filters, sorting and grouping work; each project page has three pictures and a correct link preview. The **portfolio PDF** opens offline with every project and its default picture. | US-01, US-02, US-03, US-04; FR-02, FR-03, FR-05, FR-06, FR-08 | Week 2 |
| M3 | The **CV, Full Bio and Speaker Bio** match the approved career record. Four of five trial readers succeed. Yorke updates LinkedIn, GitHub and his CV with the bio line and URL. | US-04; FR-09, FR-12; definition of done | Week 2–3, once the CV files are readable |

## 6. Sequence and dependencies

```text
M0 ─► M1 ─► M2 ─► M3
          career extraction (parallel, once the CV files are readable) ─┘
```

- M1 precedes the site: pages and PDFs render only approved records.
- Roles: Yorke-owned repositories are his work; solely student projects use **Advisor/Prof**; for shared work Yorke states the role in the review table and asks a collaborator only when unsure.
- Picture capture runs in GitHub Actions, which can reach the demo sites.
- **The career track can start:** all seven PDFs were retrieved intact on 2026-11-26. Source conflicts (Q-08) must be resolved before the CV is drafted.

## 7. Environments and deployment

| Environment | URL | Deployed from | Who |
| --- | --- | --- | --- |
| Local | `http://localhost:4173` via `npm run preview` | working copy | Yorke or an agent |
| Pull request | Build, tests and PDF verification only; no deploy | PR branch | CI |
| Production | `https://yorkerhodes3.github.io/portfolio/` | `main` | GitHub Actions |

A change reaches the public URL only by merging a reviewed PR to `main`.

## 8. Quality bar

- **Ready:** a backlog item cites an FR or US and has an acceptance check.
- **Done:** tests pass, a person reviewed the PR line by line, merged, and visible in production. Record and career PRs need Yorke's explicit approval of each new claim.
- **Every release:** schema validation, exclusion leak test, axe scan, PDF verifier, link report reviewed.

## 9. Risks

| # | Risk | L / I | Mitigation | Trigger |
| --- | --- | --- | --- | --- |
| R-01 | A role is wrong or overstated | L / H | Yorke reviews every row; Advisor/Prof rule for student work; ask a collaborator when unsure. | A collaborator or reader disputes a credit |
| R-02 | Fellowship framing, private details or recommendation-letter content leak into public documents | M / H | Per-file rules (D-10); originals ignored by Git; career PR checklist covers application phrasing, contact details and recommender content. | Any such item appears in a career PR |
| R-03 | An unlisted repository is exposed | M / H | D-07 hashed exclusions and leak test. | A new unlisted or private-intent repository |
| R-04 | Portfolio PDF too large or clipped | M / M | Default picture only, 250 KB images, 20 MB ceiling, print-specific layout. | Verifier failure |
| R-05 | External demos disappear | H / M | Link check each refresh; label unavailable with a dated still. | Two consecutive failed checks |
| R-06 | Student maintainers are surprised by metadata PRs | L / L | Each PR describes its three files and changes no behavior; Yorke merges as admin. | A maintainer objects |
| R-07 | API failure gives a partial inventory | L / M | Authenticated, paginated requests; mark the run incomplete (FR-11). | Listing error or short page |
| R-08 | Scope creep | H / H | New ideas go to *Later* in the backlog. | Mid-milestone request |
| R-09 | CV files damaged in transfer | Resolved | Retrieved intact from a private repository; Git verified the hashes. | — |
| R-10 | Employer-confidential Microsoft program details reach public documents | M / H | The public LinkedIn profile is the default boundary; Yorke clears anything beyond it item by item (Q-07). | A career PR contains a figure or internal name absent from LinkedIn |

## 10. Effort and schedule (revised 2026-11-26)

| Work | Build (AI-assisted) | Yorke | Basis |
| --- | --- | --- | --- |
| Site: tokens, dashboard, project page, gallery, deploy | 6 h | 0.5 h | Two page templates; Wayfinder tokens and fonts copied from its repository. |
| Refresh script and workflow | 4 h | 0.5 h | One script; FR-10 and FR-11. |
| Draft about 60 records | 3 h | 2 h | Batch extraction from each README, description and site; Yorke reviews one table at about 2 min a row. |
| Pictures, three per project | 4 h | 1 h | 24 repositories already have three or more images; others captured in Actions; Yorke spot-checks the defaults. |
| Favicons (23), share images (66) and per-repository PRs | 4 h | 1.5 h | One template; a script opens the PRs; Yorke merges. |
| GitHub social previews (69) | — | 1 h | Manual upload, about a minute each; optional. |
| Portfolio PDF | 3 h | 0.5 h | Print stylesheet, Playwright export and short check. |
| CV, Full Bio and Speaker Bio | 3 h | 1.5 h | Short sources; Yorke approves each fact and both texts. |
| Release checks and trial readers | 2 h | 2 h | Accessibility, phone and offline checks; five 20-minute sessions. |
| **Total** | **≈29 h** | **≈10.5 h** | About two weeks; Yorke's review sessions set the pace. |

**Why this replaces the first estimate (≈118 h build, ≈33 h review, ten weeks).** That draft priced each project as hand-written content (≈70 minutes each, ≈65 h for 60 projects). It also assumed other maintainers would gate roles and merges, staged the work through a pilot and batches, and specified more tooling than the spec requires; then it added a 50% buffer. Every repository is an existing product to draw from, and the audit shows admin rights everywhere, so per-project work is batch drafting plus a short review. No blanket buffer is applied; the risks in §9 name the real unknowns.

## 11. If we run out of time

1. GitHub repository social previews; the project sites' share images already cover shared demo links.
2. Alphabetical tag grouping (FR-03; spec amendment).
3. Screenshot capture: publish projects that already have three pictures and add the rest as captured (FR-06 coverage; spec amendment).
4. PDF automation: produce the four PDFs by a documented local command instead of in CI.

## Reviewer sign-off

- [ ] Every milestone ends in something demonstrable, and every `Must` story appears in one.
- [ ] Decisions give reasons and rejected options, especially D-04, D-09, D-10 and D-11.
- [ ] Dependencies, owners and risk triggers are actionable.
- [ ] The schedule fits the hours Yorke can give, and the cut list is acceptable.

**Verdict: pending human review.** Approval of this plan and [BACKLOG.md](./BACKLOG.md) is the gate before implementation beyond M0 setup. Revised the same day after review of the effort estimate.
