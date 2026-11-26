# Backlog: Yorke E. Rhodes III | Work since January 2026

**Last groomed:** 2026-11-26 · **Current milestone:** M3 (release review) · built on branch `build/v1` · **Inputs:** [SPECIFICATION.md](./SPECIFICATION.md) v0.2.0, [PLAN.md](./PLAN.md)

IDs are never reused. **Ref** cites a spec requirement, story or plan decision. **Size:** S < 1 h, M = a few hours; anything larger is split.

## Now: release review (Yorke)

| ID | Task | Ref | Size | Status | Acceptance |
| --- | --- | --- | --- | --- | --- |
| T-060 | Review [catalog/REVIEW.md](catalog/REVIEW.md): role, credits, evidence and tags for all 61 projects; 19 rows carry a drafting note. | FR-04, FR-05 | M | review | Each row is correct or corrected in its `portfolio.json`. |
| T-061 | Review the four PDFs (CI artifact `downloads` on the build PR, or `npm run pdf` locally) and the facts in [career/career.json](career/career.json). | FR-08, FR-09, FR-12 | S | review | Names, titles and dates match your records. |
| T-062 | Approve the build PR's Actions run, then merge to `main` to publish. | D-01, D-05 | S | todo | `https://yorkerhodes3.github.io/portfolio/` serves the dashboard and four downloads. |
| T-063 | After publishing, run **Refresh catalog** once from Actions so demo links are checked and labeled live. | FR-05, FR-10 | S | todo | The refresh PR shows demo statuses; merge it. Enable *Allow GitHub Actions to create and approve pull requests* first. |
| T-064 | Review and merge the 12 metadata PRs in yorkerhodes3 repositories (listed under Done). | FR-07, D-04 | S | todo | Merged records show as adopted, not pending, on the next refresh. |
| T-065 | Open and merge metadata PRs for the 49 Ethical-Tech-CoLab repositories. | FR-07, D-04 | S | blocked | See Blocked. |
| T-066 | Five trial readers starting from the bio link (concept §5); then update LinkedIn, GitHub and your CV with the bio line and URL. | Definition of done | M | todo | 4 of 5 find a demo and name your role and one limitation within two minutes. |

## Later

| ID | Task | Ref | Why not now |
| --- | --- | --- | --- |
| T-047 | Upload each project's `og-image.png` as its GitHub social preview (Settings → General). No API exists. | FR-07 | First on the cut list (PLAN §11). |
| T-067 | Wire favicons and share tags into the 5 sites whose Pages builds need code changes (avatar-impact-stories, reverse-stress, pageturn-book, race-condition-mod, evac-sim-melanie). Their PRs include the images in `.portfolio/`. | FR-07 | Each needs a maintainer change to its build. |
| T-068 | Replace offline screenshots of map-based demos with live captures once demos are verified; basemap tiles were unavailable offline. | FR-06 | Pictures are accurate, but some maps lack tiles. |

## Blocked

| ID | Task | Blocked by | Since | Who can unblock |
| --- | --- | --- | --- | --- |
| T-065 | Metadata PRs in the 49 Ethical-Tech-CoLab repositories | This session's GitHub token is not authorized for the Ethical-Tech-CoLab organization (API and git push both return 403). The prepared changes are reproducible: `npm run upstream:open` with your own `gh` login. | 2026-11-26 | Yorke |

## Done

| ID | Task | Ref | Completed | PR |
| --- | --- | --- | --- | --- |
| T-000 | Concept approved with changes. | Concept | 2026-11-26 | Local review; not yet committed |
| T-001 | Specification approved with changes; bio downloads integrated (v0.2.0). `.gitignore` keeps `private/` local. | Spec, D-10 | 2026-11-26 | Local review; not yet committed |
| T-030 | All seven CV Reference PDFs retrieved intact from a private repository and read; conflicts and clearance items recorded in `private/career-review.md`. | D-10 | 2026-11-26 | — |
| T-002–T-006 | Node project, Wayfinder tokens and self-hosted fonts, deploy workflow, README. | M0 | 2026-11-26 | build PR |
| T-010–T-018 | Schema and vocabulary, validator, hashed exclusions, discovery, refresh with failure preservation and withdrawals, report, refresh workflow. | M1 | 2026-11-26 | build PR |
| T-021, T-024 | 61 project records drafted from each repository's README and history, each with three reviewed pictures (offline screenshots, repository figures or README excerpt cards). Roles computed from commits; cohort credits normalized. | FR-04–FR-06 | 2026-11-26 | build PR |
| T-022 | Favicons for the 13 sites lacking one; 1200 × 630 share images for the 58 projects lacking one. | FR-07 | 2026-11-26 | build PR |
| T-023 | Metadata PRs opened in all 12 yorkerhodes3 repositories: agentic-ontology#6, bare-metal-jacket#7, crowddeck#1, ethical-ai-field-guide#1, neocloud-supply-os#2, nyu-violet-lab-preview#1, pageturn-book#1, quest-payments#23, race-condition-mod#44, sovereign-agent-trust-mesh#2, teardown-3D#2, webpage-note#3. | FR-07 | 2026-11-26 | — |
| T-040–T-045 | Dashboard with four lenses, filters, sort and grouping; project pages with gallery; portfolio, CV, Full Bio and Speaker Bio PDFs with automated checks; accessibility scan. | M2, M3 | 2026-11-26 | build PR |

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
| Q-08 | Answered 2026-11-26: NYU Integrated Marketing 2012–2024 and Center for Global Affairs 2024–present; DTSF; restore pre-2014 history. Still to confirm in T-061: the current Microsoft title and the course title, both taken from LinkedIn. | 2026-11-26 |
| Q-09 | Answered 2026-11-26: keep the approved bio line. It lives in one place, `bioLine` in config/site.json, which feeds the site, share image, CV and bios. | 2026-11-26 |
