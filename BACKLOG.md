# Backlog: Yorke E. Rhodes III | Work since January 2026

**Last groomed:** 2026-11-26 · **Current milestone:** M0 (awaiting plan approval; replanned 2026-11-26) · **Inputs:** [SPECIFICATION.md](./SPECIFICATION.md) v0.2.0, [PLAN.md](./PLAN.md)

IDs are never reused. **Ref** cites a spec requirement, story or plan decision. **Size:** S < 1 h, M = a few hours; anything larger is split.

## Now: M0 walking skeleton

| ID | Task | Ref | Size | Status | Acceptance |
| --- | --- | --- | --- | --- | --- |
| T-002 | Scaffold Node 20 project: `package.json` scripts `build`, `preview`, `test`, `refresh`; `.nvmrc`. | D-02 | S | todo | `npm ci && npm test` succeeds from a fresh clone. |
| T-003 | Port Wayfinder CoLab tokens to `tokens.css`; self-host Bebas Neue, Space Mono and Inter (OFL), keeping license files. | D-03, NFR design | M | todo | Wayfinder's contrast checks pass on the ported tokens; the browser makes no third-party font request. |
| T-004 | Placeholder home: name, bio line exactly as in the spec, "inventory in progress" note, skip link, favicon and share image for the portfolio itself. | US-01, FR-07 | S | todo | Keyboard reaches all content; link preview shows the portfolio's title and image. |
| T-005 | `deploy.yml`: build on every PR, deploy to Pages only from `main`. | D-01, §7 | S | todo | A PR shows a passing build and no deployment; merging publishes `https://yorkerhodes3.github.io/portfolio/`. |
| T-006 | README: purpose, the four documents, local run, review rule, and that `private/` never leaves the machine. | §8 quality bar | S | todo | A new contributor can run the site locally from the README alone. |

## Next: M1 catalog complete

| ID | Task | Ref | Size | Notes |
| --- | --- | --- | --- | --- |
| T-010 | JSON Schema v1 for `portfolio.json` and the `tags.json` vocabulary (method and domain facets). | §7, FR-03 | M | Include the three-image and `defaultImageId` rules. |
| T-011 | `npm run validate` with human-readable errors per field. | FR-11 | S | |
| T-012 | Hashed exclusions and a leak test over `catalog/` and `dist/`. | D-07 | S | Add the unlisted repository's hash without naming it. |
| T-013 | Discover candidates in both accounts: authenticated, paginated; mark incomplete runs. | FR-01, R-07 | M | |
| T-014 | Resolve records: source repository first, else the draft; report which. | D-04 | S | |
| T-015 | Derive the snapshot: approved records, distinct counts, deterministic order; check dates in `checks.json`. | FR-02, FR-10 | M | An unchanged rerun yields no content diff. |
| T-016 | Keep the last approved record on failure; apply explicit withdrawals. | FR-11 | S | |
| T-017 | Write `refresh-report.md`: new, changed, unchanged and blocked, with reasons. | FR-10 | S | |
| T-018 | `refresh.yml` (`workflow_dispatch`) commits to a branch and opens the review PR. | D-05, D-06 | S | |
| T-021 | Draft records for every included candidate from its README, description and site; one review table with role, tags, decision and limitation. | FR-04, FR-05 | M | Yorke: about 2 h. Replaces T-019, T-020 and T-031. |
| T-022 | Favicon and 1200 × 630 share-image template; generate for the 23 and 66 sites missing them. | FR-07, D-11 | M | Project colors where known, else Wayfinder. |
| T-023 | Script one PR per repository: `portfolio.json`, plus any missing favicon, share image and meta tags. | FR-07, D-04 | M | Yorke merges as admin. |
| T-024 | Picture capture in Actions; choose three pictures and a default per project. | FR-06, D-11 | M | 24 repositories already have enough images. |

## Later: M2 and M3

| ID | Task | Ref | Milestone |
| --- | --- | --- | --- |
| T-040 | Dashboard lenses, facet filters, newest-first sort, tag grouping, empty and error states. | FR-02, FR-03 | M2 |
| T-041 | Project pages with the three-picture gallery, credits, caveats and share metadata. | FR-04, FR-05, FR-06 | M2 |
| T-043 | Portfolio print layout, Playwright export and short check in CI. | FR-08, D-08 | M2 |
| T-044 | Extract the career record from the CV Reference files under the per-file rules. | FR-09, FR-12, D-10 | M3 |
| T-045 | CV, Full Bio and Speaker Bio print layouts and PDFs in the D-09 palette. | FR-09, FR-12, D-09 | M3 |
| T-047 | Upload GitHub social previews by hand (optional; first to cut). | FR-07 | M3 |
| T-048 | Accessibility, 320 px and offline checks; five trial readers; release. | Definition of done | M3 |
| T-049 | Yorke updates LinkedIn, GitHub and his CV with the bio line and URL. | Concept §4 | M3 |

T-019, T-020, T-031, T-042 and T-046 were superseded in the 2026-11-26 replan.

## Blocked

| ID | Task | Blocked by | Since | Who can unblock |
| --- | --- | --- | --- | --- |
| — | Nothing blocked. | | | |

## Done

| ID | Task | Ref | Completed | PR |
| --- | --- | --- | --- | --- |
| T-000 | Concept approved with changes. | Concept | 2026-11-26 | Local review; not yet committed |
| T-001 | Specification approved with changes; bio downloads integrated (v0.2.0). `.gitignore` keeps `private/` local. | Spec, D-10 | 2026-11-26 | Local review; not yet committed |
| T-030 | All seven CV Reference PDFs retrieved intact from a private repository and read; conflicts and clearance items recorded in `private/career-review.md`. | D-10 | 2026-11-26 | — |

## Questions for the reviewer

| ID | Question | Asked |
| --- | --- | --- |
| Q-01 | Which contact details may appear on the public CV and bios: LinkedIn, GitHub, email, location? | 2026-11-26 |
| Q-02 | Should the Speaker Bio include a headshot? If so, which approved photograph? | 2026-11-26 |
| Q-03 | Confirm target lengths: Full Bio ≤ 350 words, Speaker Bio ≤ 120 words. | 2026-11-26 |
| Q-04 | Accept D-09's white-page CV in portfolio colors, or prefer the dark Wayfinder ground? | 2026-11-26 |
| Q-05 | Do you plan to seek consent from either recommender to quote their letter? | 2026-11-26 |
| Q-06 | Can you give the ≈10.5 review hours in PLAN §10 over the next two weeks? | 2026-11-26 |
| Q-07 | Which Microsoft program details beyond your public LinkedIn profile are cleared for a public CV? | 2026-11-26 |
| Q-08 | Resolve the eight source conflicts in `private/career-review.md` (dates, titles, award names, acronyms). | 2026-11-26 |
| Q-09 | Every source stresses translating production systems for policymakers. Should the bio line say so? | 2026-11-26 |
