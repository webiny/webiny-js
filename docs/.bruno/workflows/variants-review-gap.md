# Page experiments and variants vs. the review workflow

Status: open, owner of the experiments/variants feature to decide. Found in the phase 2.4 final review (2026-10-12).

## Summary

With a workflow bound to Website Builder pages, a page revision can only be published after its review is approved. Publishing the page also publishes the page's running experiment and all of its `ready` variants. The review covers the page revision only. The variant and experiment content that goes live with it is never part of the review, and it can still be edited after the page is approved.

## How it works today

- Variants and experiments are separate private CMS models (`wbyWbVariant`, `wbyWbExperiment`). They have their own revisions, separate from the page.
- Experiments and variants serve only when published (`GetActiveExperimentForPathRepository` reads `published: true`, `status: "running"`).
- They are published in only one place: `EndExperimentOnPublishHandler` (api-website-builder, `features/experiments/EndExperimentOnPublish`). On `PageAfterPublish` it finds the page's running experiment and publishes it. It then publishes every variant of that experiment with status `ready`. It calls the CMS `PublishEntryUseCase` directly, as a system cascade.
- The page publish is gated by `RequireApprovedReviewOnPagePublish` (api-website-builder-workflows). It needs an approved review for that page revision.
- Variant and experiment edits (`UpdateVariantUseCase`, `UpdateExperimentUseCase`) check only the `page` edit permission. Nothing checks whether the page is under review or already approved.
- The handler's comment says the cascade is "authorised by the (already approved) page publish". That is true for the page revision, but not for the variant content.

## The gap

1. An editor requests a review of page revision R. Variant V is in `ready` status.
2. A reviewer approves R, looking at R's content only.
3. Before or after approval, the editor changes V's content. Nothing refuses the change.
4. R is published, and the cascade publishes V's latest content.

Unreviewed content now serves to the share of visitors the experiment routes to V. Variant content is never shown to the reviewer at any point, so this holds even without step 3.

Not affected:

- **Graduating a variant** (`GraduateVariant`) creates a new page revision. A new revision starts with no review state, so on a bound model it needs its own approved review before it can be published.
- **Edits after the page is published** do not go live until the next page publish. That publish needs a new approved review of a new page revision.

## Options

**A. Accept and document.** Variant and experiment content is outside the review in v1. Reviewers approve the page only, and the docs and admin say so. Cost: none now. The approval does not guarantee everything that goes live was reviewed.

**B. Lock variants and experiments while the page is under review.** Add a Website Builder workflows hook on the variant and experiment before-update (and before-delete) events. It refuses the change while any revision of the page (`pageEntryId`) has a review in progress, the same pattern as `BlockPageMoveWhileInReview`. Cost: small, about one hook plus tests. It closes the "edit during review" window but not "edit after approval, before publish", and the reviewer still never sees variant content.

**C. B plus locking after approval.** Also refuse variant and experiment edits while the page's latest review is `approved` and not yet published. Any change then needs a new review. Cost: small to medium. Closes both windows. The reviewer still never sees variant content.

**D. Make variants part of what is reviewed.** Show the running experiment and its ready variants in the review (the admin review view and the review snapshot). Then apply C. Cost: medium to large, touching UI and the review target shape. This is the only option where approval means "everything that goes live was reviewed".

**E. Stop the cascade for bound pages.** On a bound pages model, do not auto-publish variants and experiments on page publish. Publish them only through their own action, possibly with their own review. Cost: changes experiment behaviour for workflow users and needs a design.

## Questions for the owner

1. Is variant content expected to be covered by page approval in v1?
2. If yes: is a lock enough (B or C), or must the reviewer see the variants (D)?
3. Should an `approved` page lock its variants until it is published (C)?
4. Is the auto-publish cascade on page publish the intended long-term behaviour for pages under a workflow?
