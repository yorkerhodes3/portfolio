# Yorke E. Rhodes III · Portfolio

> I make complex decisions testable, from what an AI agent can share to where a model helps predict outcomes, to where a 3rd party risk can break a company.

**Live site:** <https://yorkerhodes3.github.io/portfolio/> · Work since January 2026 across [yorkerhodes3](https://github.com/yorkerhodes3) and [Ethical-Tech-CoLab](https://github.com/Ethical-Tech-CoLab), filterable by method, domain and type, with four PDF downloads: the full illustrated portfolio, a traditional CV, a Full Bio and a Speaker Bio.

The project follows the Ethical Tech CoLab [project-startup-guide](https://github.com/Ethical-Tech-CoLab/project-startup-guide): [CONCEPT-IDEA](CONCEPT-IDEA.md) → [SPECIFICATION](SPECIFICATION.md) → [PLAN](PLAN.md) → [BACKLOG](BACKLOG.md), each reviewed before building. The visual style is [Wayfinder](https://yorkerhodes3.github.io/agentic-ontology/style-guide.html)'s default CoLab theme.

## How it works

```text
each project repo: portfolio.json ──┐
(or a draft in catalog/projects/)   ├─► npm run refresh ─► review PR ─► merge ─► build + PDFs ─► GitHub Pages
career/career.json, config/site.json ┘     (validate, mirror pictures, check links, report)
```

- **Each project describes itself** in a `portfolio.json` at its repository root: summary, type, method and domain tags, Yorke's role and the credits, a decision and its trade-off, a known limitation, dated evidence, and three pictures with a default. The contract is [catalog/schema/portfolio.schema.json](catalog/schema/portfolio.schema.json); valid tags are in [catalog/tags.json](catalog/tags.json).
- Until a repository adopts its record, the refresh reads the draft in `catalog/projects/<id>/` and reports it as *pending upstream*.
- **Nothing publishes without review.** The refresh writes `catalog/snapshot.json` and [catalog/refresh-report.md](catalog/refresh-report.md); merging the PR is approval. Invalid records never replace an approved one, and withdrawals apply even if a repository is unreachable.
- Visitors read the approved snapshot; the site makes no GitHub calls, uses no tracking and needs no account.

## Common tasks

| Task | How |
| --- | --- |
| **Refresh the catalog** | GitHub → Actions → **Refresh catalog** → Run workflow. It opens a PR with the report; review and merge. Locally: `npm run refresh` (add `--no-links` where `*.github.io` is unreachable). |
| Change the bio line | Edit `bioLine` in [config/site.json](config/site.json). It feeds the dashboard, share images, CV and bios. Rerun `node src/build/brand-assets.mjs` to update the site's share image. |
| Change a project's tags or text | Edit its `portfolio.json` (in the project repo once adopted, otherwise `catalog/projects/<id>/`), then refresh. `npm run validate` checks drafts. |
| Correct a role or credit | Same as above; [catalog/REVIEW.md](catalog/REVIEW.md) lists every claim in one table. |
| Exclude or withdraw a project | Add it to `excluded` or `withdrawn` in [catalog/dispositions.json](catalog/dispositions.json) with a neutral reason, then refresh. A repository that must not be named goes in [catalog/exclusions.json](catalog/exclusions.json) as the SHA-256 of `owner/repo` in lowercase. |
| Update the CV or bios | Edit [career/career.json](career/career.json). The originals behind it stay in the Git-ignored `private/` folder and are never committed. |
| Propose records, favicons and share images upstream | `npm run upstream:open` from a machine signed in with `gh auth login`. It opens (or updates) one PR per repository on branch `portfolio/metadata`. `npm run upstream` is a dry run that writes each plan to `.work/upstream/<id>/plan.json`. Sites whose Pages build can't be safely patched get the images in `.portfolio/` and a note in the PR. |
| Review every claim at once | `npm run review` regenerates [catalog/REVIEW.md](catalog/REVIEW.md) from the snapshot and [catalog/review-notes.json](catalog/review-notes.json). |
| Add pictures for a new project | `node src/refresh/gather-context.mjs owner/repo`, `npm run capture -- <id>` and `node src/build/draft-media.mjs adopt …` following [docs/DRAFTING.md](docs/DRAFTING.md). |

## Local development

```bash
nvm use                 # Node 20+
npm ci
npm run build           # dist/ from the approved snapshot
npm run pdf             # the four PDFs (uses Chrome; set CHROME_PATH if needed)
npm run check:pdf
npm test
npm run preview         # http://127.0.0.1:4173/
```

## Notes for the owner

- **Actions approval.** Runs triggered by agent pushes show *Action required* until approved in the Actions tab. Runs from your own merges start normally.
- **Refresh PRs** need *Settings → Actions → General → Allow GitHub Actions to create and approve pull requests*. Add a `PORTFOLIO_READ_TOKEN` secret only if the default token's rate limit is reached.
- **GitHub social previews** have no API; upload a project's `og-image.png` under its *Settings → General → Social preview*.

## Credits and licenses

Code: Apache-2.0. Fonts: Bebas Neue, Space Mono and Inter under the SIL Open Font License (license files ship in `dist/assets/fonts/`). Project pictures belong to their projects and are credited on each page; student work is credited to the students.
