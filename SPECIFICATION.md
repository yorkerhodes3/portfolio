# Specification: Yorke E. Rhodes III | Work since January 2026

**Status:** Approved with changes · **Version:** 0.2.0 · **Date:** 2026-11-26  
**Input:** [Concept approved with changes](./CONCEPT-IDEA.md) · **Owner:** Yorke E. Rhodes III · **Drafting assistance:** GitHub Copilot

## 1. Summary

A reader arriving from LinkedIn or a CV can start with a question, find related projects across `yorkerhodes3` and `Ethical-Tech-CoLab`, and inspect the evidence behind Yorke's contribution. The dashboard, project pages and illustrated PDF describe the same dated collection. A traditional CV, a Full Bio and a Speaker Bio draw career facts from an owner-approved source.

Use the bio line as reviewed, without rewriting it for individual channels:

> I make complex decisions testable, from what an AI agent can share to where a model helps predict outcomes, to where a 3rd party risk can break a company.

## 2. Goals and non-goals

Show the volume, depth, types and focus of work **created or substantively advanced on or after 2026-01-01**. A visitor must be able to distinguish a proposal from a working demo and an advisor from an author. Yorke must be able to keep those distinctions accurate without editing each output by hand.

V1 does not publish private or intentionally unlisted work without explicit opt-in, rank expertise, recreate external demos, or edit anyone's repository or bio automatically. A model output or a synthetic scenario is not evidence of a real-world outcome.

## 3. Users and permissions

| Role | Can do | Boundary |
| --- | --- | --- |
| Public visitor | Browse, filter, sort, navigate pictures, follow evidence, download any of the four PDFs. | No sign-in; cannot change records or trigger refresh. |
| Project contributor / maintainer | Propose or review changes to the project's record, media, credit and links. | A change in a source repository does not automatically go public in the portfolio. |
| Yorke, portfolio owner | Run the repository refresh, review discrepancies, approve publication, handle corrections and withdrawals. | Does not override upstream maintainers; no implied approval from students or collaborators. |

## 4. User stories

| ID | As a reader or maintainer, I want to... | Priority |
| --- | --- | --- |
| US-01 | Find relevant work by topic or domain and understand how it fits the whole collection. | Must |
| US-02 | See who did the work, examine a significant decision, and try the demo or inspect its evidence. | Must |
| US-03 | Explore and share a project's visual explanation. | Must |
| US-04 | Take the whole illustrated collection, a conventional CV, or a full or speaker bio into an offline meeting or event. | Must |
| US-05 | Refresh from the two source accounts, correct errors and review exactly what will be published. | Must |

## 5. Functional requirements and acceptance criteria

| ID / story | Required behavior | Acceptance example |
| --- | --- | --- |
| FR-01 / US-01, US-05 | Reconcile candidates from both accounts using dated substantive evidence, not push timestamps or repository creation dates alone. | Include a 2025 project with a documented 2026 advance; a mirror and its original count once. A recent push without evidence goes to review, not the public total. |
| FR-02 / US-01 | Show distinct project and available-demo counts by period and canonical owner; project type; method and domain summaries; and the snapshot date. Show depth through decisions, evidence and limitations, not a numerical score. | Selecting a summary opens its matching projects. A project with two method tags appears in both summaries but only once in the distinct project total. |
| FR-03 / US-01 | Filter by tags (any within a facet, all across facets). Offer newest contribution first and alphabetical tag grouping. State the active filters and matching project count. | Selecting `decision-models` and `global-affairs` across facets returns only their intersection. A multi-tag project may appear in both tag groups, but the count stays distinct. Clear filters restores the catalog. |
| FR-04 / US-02 | Show the problem, Yorke's role, credited collaborators, consequential choice and trade-off, evidence level, source, dated evidence and known limitation. | For solely student work, show the students' approved credits and Yorke as **Advisor/Prof**, including in exports; never label him builder on that basis. Unconfirmed roles do not publish. |
| FR-05 / US-02 | Label a live demo only after checking the intended experience opens. Distinguish design, working demonstration, evaluated result and documented field use. | A ticketing design links to its design evidence, not “Try checkout.” An unavailable demo shows its status and source or dated still. A synthetic-data demo carries its caveat beside the launch link. |
| FR-06 / US-03 | Every project has **three distinct, relevant images**, one explicitly designated the default. The gallery opens on the default and lets visitors reach both alternatives by keyboard and touch. | Show image position, captions and credits. Switching to image 3 changes the on-screen picture, not the stored default or the picture chosen for print. |
| FR-07 / US-03 | Audit each project's own favicon and social preview. Preserve working assets. Where missing, prepare a project-specific favicon and a 1200 × 630 preview with Open Graph and social-card metadata for maintainer review. | Opening the published project URL identifies the project in a tab and link preview. For projects without a site, its portfolio detail page is the share target. Record outstanding upstream fixes as pending, not complete. |
| FR-08 / US-04 | Offer a downloadable, paginated **full portfolio PDF** with the overview, focus summaries, all published narratives, roles, credits, evidence/demo links, and the embedded **default image only** for each project. | From an empty filter result, download and disconnect: every published project appears exactly once; pictures, captions, Wayfinder type and color remain visible. No clipped text, gallery controls or blank remote-image boxes. |
| FR-09 / US-04 | Offer a distinct, text-selectable, single-column **CV PDF** with approved profile, reverse-chronological experience, education and selected work. | Copy the text in reading order and compare names, roles and dates against the approved CV. No gallery or invented career entries. Do not offer a substitute file if the CV source has not been approved. |
| FR-10 / US-05 | Provide one documented, owner-run **repository refresh function**. It rereads project metadata, checks links and media, and reports new, changed, unchanged and blocked records for review. Visitors read the approved snapshot, not GitHub. | Change a project's tag and default image; after refresh and approval, its filters, gallery and portfolio PDF agree. Rerun without input changes: project content and counts do not change. |
| FR-11 / US-05 | Preserve last approved content on transient fetch or validation failure, recording the failing source, reason and last successful check. Apply explicit withdrawals even if the source is unreachable. | A malformed record does not erase a previously approved project or publish a new one. Withdrawing an approved project removes it from pages, counts and newly served downloads in the next publication. |
| FR-12 / US-04 | Offer two further text-selectable, third-person PDFs from the approved career record: a **Full Bio** (narrative, at most one page) and a **Speaker Bio** short enough to be read aloud as an introduction. | Copy each in reading order and compare every name, role and date against the approved record. Neither repeats fellowship-application framing. The Speaker Bio is a different, shorter text, not the Full Bio truncated. |

## 6. Screens and states

| View | Main actions | Empty, loading and failure states |
| --- | --- | --- |
| Dashboard | Read the bio line and inventory date; inspect totals, change filters or grouping, open a project, download either document. | While loading, do not show invented zero totals. Distinguish an empty collection from no matches; offer **Clear filters** for the latter. A missing snapshot is an availability error, not an empty catalog. |
| Project detail (shareable URL) | Navigate three pictures, read credit and caveats, follow demo/source, return to results with filters intact. | With no demo, offer evidence instead. For an image load failure, retain caption, alt text and navigation. Unknown or withdrawn IDs return a not-found view without exposing withdrawn details. |
| Downloads | Choose **Full portfolio**, **CV**, **Full Bio** or **Speaker Bio** (all PDF), each labeled with its edition date. | If an artifact is missing, say which download is unavailable; never return one file under two labels. |
| Repository review (not a public admin page) | Inspect the refresh report, resolve a candidate, approve or withhold changes. | An unreachable owner or incomplete repository listing is marked incomplete. Do not claim complete coverage after a partial read. |

## 7. Data model

Each included project supplies a root **`portfolio.json`**. The following is its data contract; publishing decisions belong to the portfolio, not to the input file.

| Fields | Shape and meaning |
| --- | --- |
| Identity | Stable `id`, `title`, canonical `owner/repo`, optional repository aliases and a short summary. A rename does not change the ID or project page. |
| Classification | Primary `kind`; controlled lists of `methodTags` and `domainTags`. Method vocabulary includes applied AI, agentic workloads, frontier models, blockchain, Ethereum, decision models, edge hardware and open source. Domains include commerce, global affairs and supply chain resilience. |
| Contribution | Latest qualifying contribution date (ISO calendar date), problem, Yorke's role, approved contributor credits, decision, trade-off, limitation, evidence level and at least one dated evidence link. |
| Destinations | Source URL, optional demo URL, and canonical share URL. The catalog records demo availability and when it was checked separately from the author's URL. |
| Media | Three image records, each with ID, asset, alt text, caption, source and credit; one `defaultImageId` referring to one of the three. Favicon and social-preview references are separate from the gallery. |

The **inventory** records candidate repositories, canonical ID, disposition (`included`, `duplicate`, `excluded`, `awaiting confirmation`), reason, review status and provenance. The **published snapshot** contains only approved records and derived counts, with a release date and source revisions. Keep review-only reasons out of public exports. The **career edition** records the approved source and revision date, profile, roles, education, talks, publications, affiliations, the Full Bio and Speaker Bio texts, and selected project IDs. It feeds the CV and both bios; never infer employment from repository membership.

## 8. Business rules and edge cases

- Use the latest qualifying contribution date for newest-first sorting and period totals; break ties by title, then stable ID. Use the canonical owner for owner totals even when aliases span both accounts.
- Yorke cleared project imagery for use in project descriptions. Choose three pictures that explain different aspects; diagrams or document excerpts can serve a research project better than screenshots. Record provenance and credits. If fewer than three are available, flag the gap rather than repeating one or inventing a screen.
- Missing required fields, an unknown tag, conflicting IDs or a default image outside the gallery block that revision. An upstream asset change is not accepted until reviewed. Missing/renamed files are not withdrawal instructions.
- The career source is Yorke's **CV Reference** folder, prepared for a Harvard Belfer Center Nova Fellowship application. Reuse its facts, not its layout or its application-specific material: statement of interest, project proposal and program-directed language. Recommendation letters remain confidential to their authors. The CV and bios use this portfolio's color scheme in a traditional print layout. Publish only extracted content Yorke has approved; never commit the original files.
- Publish pages and current downloads from the same reviewed release. A withdrawn image or credit must not survive in a publicly served older export under the site's control. Previously downloaded copies cannot be recalled.

## 9. Non-functional requirements

| Area | Release check |
| --- | --- |
| Design and accessibility | Compare to [Wayfinder](https://yorkerhodes3.github.io/agentic-ontology/style-guide.html): plum ground, lime actions, condensed headings and monospaced labels. Check WCAG AA contrast, visible focus, text alternatives and a complete keyboard-only browse, gallery and download path. |
| Devices and load | At 320 CSS pixels and desktop width, filters, image controls and downloads remain usable without horizontal page scrolling. Initial dashboard load does not fetch every gallery image or PDF. |
| Privacy and cost | Browsing needs no account, tracking, GitHub credential or paid inference. Source records are data, not executable markup. No secrets or unpublished contributor details in the static files or PDFs. |
| Resilience | With source APIs unavailable, the last approved site and its four downloads remain usable. Report stale checks to the owner; do not describe the last check as a new verification. |

## 10. Dependencies

| Input | Owner / fallback |
| --- | --- |
| Public repository metadata, evidence and maintained demos | Source maintainers. Record failures; retain approved evidence where still authorized. |
| Project pictures, identity assets and Wayfinder fonts | Use distributable assets with recorded sources; confirm embedding works without a network. Hold an incomplete release rather than silently stripping styling or pictures. |
| Career history | Yorke supplies the CV Reference folder. Until it is available to the build, the CV and both bios are unavailable; the rest of the site can still ship. |

## 11. Definition of done

- [ ] Both accounts have been reconciled as of the stated inventory date. Every included project passes the metadata, attribution, media and sharing checks.
- [ ] Four of five first-time trial readers find a relevant demo and correctly identify Yorke's role and one limitation within two minutes of opening the bio link.
- [ ] Yorke can follow the repository instructions to refresh, review a tag and image change, identify a malformed record, and honor a withdrawal.
- [ ] On the public site, complete the keyboard and mobile paths; download all four PDFs and inspect them offline against FR-08, FR-09 and FR-12.

## 12. Open questions carried forward

| Decision still needed | Owner | Needed by |
| --- | --- | --- |
| Which CV Reference entries and contact details are approved for the public CV and bios? Should the Speaker Bio include a headshot? | Yorke | Before generating the CV and bios |
| Which candidate repositories represent a single project, and who confirms roles where work was shared? | Yorke with the relevant maintainer | Before approving those records |
| How often should Yorke run the refresh and revisit stale demo checks? What time and hosting budget is available? | Yorke | Planning; v1 requires on-demand refresh regardless |

## Reviewer sign-off

- [x] The stories, requirements and acceptance examples describe the intended v1.
- [x] Credits, image navigation, printed default and refresh ownership reflect the concept review.
- [x] Failure cases, data fields, privacy and publication rules are sufficient.
- [x] Scope and release checks fit the available time and budget.

**Verdict: approved with changes.** Yorke completed review on 2026-11-26 and added Full Bio and Speaker Bio downloads. Approval does not authorize publication of any project or career claim; that happens record by record.

**Changes after review (v0.2.0):** carried the bio addition through the summary, permissions, US-04, FR-12, data model, dependencies and definition of done. Recorded the CV Reference folder as the career source and its reuse rules (§8), and replaced the resolved open question. Review these edits with [PLAN.md](./PLAN.md).
