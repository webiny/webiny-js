# Bug reporter

Report a bug by talking to the app. Hit `cmd+shift+b`, say what went wrong, and a GitHub
issue appears with a screenshot, the environment, and a timeline of what you did in the
minutes before you reported it.

Nobody using it configures anything. The keys live on the API.

This is internal. It is registered in this repo's `webiny.config.tsx`, which projects created
from Webiny never get.

## Setup

Set these in the environment that builds the API. `BugReporterExtension.tsx` reads them and
passes them through as build params, so CI can hold them as secrets:

| Variable                  |                                                                                                                                                                                                                 |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BUG_REPORT_GITHUB_TOKEN` | Fine-grained PAT with **Issues** and **Contents** write on the repository. Contents is needed because screenshots are committed to a `bug-report-assets` branch; GitHub's issue API has no attachment endpoint. |
| `BUG_REPORT_REPOSITORY`   | `owner/name`. Defaults to `webiny/webiny-js`.                                                                                                                                                                   |
| `BUG_REPORT_LABELS`       | Comma separated. Defaults to `bug`.                                                                                                                                                                             |

Drafting uses the **first provider configured in AI Power-Ups**, decrypted server-side, the
same way AI image enrichment resolves its provider. Nothing to set: if a provider is there it
gets used, and if it isn't, the report is filed word for word with the timeline attached.

With no token set, the mutation refuses with a message the dialog shows, rather than failing
quietly.

## What gets captured

Recording starts when the admin app loads and keeps the last 150 events in memory. Nothing
leaves the browser until you submit.

|               |                                                                          |
| ------------- | ------------------------------------------------------------------------ |
| Route changes | `pushState`, `replaceState`, `popstate`                                  |
| Clicks        | the element's accessible label and a short selector                      |
| Field edits   | the field's label only, **never the value**                              |
| Network       | every GraphQL operation, plus any request that returned 4xx/5xx or threw |
| Console       | `console.error` and `console.warn`                                       |
| Exceptions    | `window.onerror` and unhandled promise rejections                        |

Field values are deliberately excluded because reports get filed from tenants holding real
customer data. The screenshot is not filtered, though, so look at it before you send.

## How it fits together

```
cmd+shift+b
  → the palette closes, two frames repaint
  → getDisplayMedia screenshots the tab (one click on the share prompt)
  → the dialog opens; type or dictate, paste more images
  → reportBug mutation carries the text, events, environment and images to the API
  ↓ API
  → the first AI Power-Ups provider drafts title / summary / steps from the words + timeline
  → each image is committed to the bug-report-assets branch
  → the issue is created and its URL comes back to the dialog
```

The model writes five fields: `title`, `summary`, `stepsToReproduce`, `expected`, `actual`.
Everything else in the body is assembled by `api/composeIssueBody.ts` from what was recorded,
so the factual half of the issue can't be paraphrased or invented.

## Attachments

The auto-capture is the first attachment. Beyond it:

- **Paste an image** anywhere in the dialog and it is appended. Works for a raw screenshot on
  the clipboard and for an image file copied from Finder. Pasted _text_ is left alone, so it
  still lands in the textarea.
- **Capture the screen** takes another shot of the tab.
- Each thumbnail has a remove button, including the auto-capture.

So the usual flow for something you already caught: screenshot it yourself, open the report,
remove the auto-capture if it is not the interesting frame, and paste yours.

Dictation uses the browser's own speech recognition. No key, no cost, but it is a Chrome and
Safari feature — elsewhere the mic button just doesn't appear.

## Layout

```
shared/types.ts        the wire shape, types only, read by both bundles
recording/             the action recorder and its ring buffer   (admin)
capture/               screenshot and environment                (admin)
speech/                dictation                                 (admin)
presentation/report/   presenter and dialog                      (admin)
commands/              the command palette entry                 (admin)
gateway/               the reportBug mutation client             (admin)
api/                   use case, drafter, GitHub, formatting     (api)
```

## Known rough edges

- The share prompt appears on every report. That is the price of a real screenshot; a DOM
  rasteriser skips the prompt but gets canvases, iframes and cross-origin images wrong.
- The screenshot branch grows forever. Delete it when it gets large; nothing links to old ones
  except closed issues.
- Build params are baked at build time, so rotating the token means a redeploy of the API.
- `packages/webiny/src/api/ai-powerups.ts` now side-effect-imports the AI Power-Ups settings
  augmentations. The package emits unresolved `~/...` specifiers in its `.d.ts`, so without
  that, `settings.providers` is invisible to every consumer outside the package. Drop those
  imports once ai-powerups rewrites aliases on build.
- No PR is opened. A well-formed issue is the deliverable; wiring an agent to pick it up is a
  separate job.
