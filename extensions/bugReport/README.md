# Bug reporter

Report a bug by talking to the app. Hit `cmd+shift+b`, say what went wrong, and a GitHub
issue appears with a screenshot, the environment, and a timeline of what you did in the
minutes before you reported it.

This is internal. It is registered in this repo's `webiny.config.tsx`, which projects created
from Webiny never get.

## Setup

Run **Bug reporter settings** from the command palette (`cmd+k`) and paste:

- **GitHub token** — a fine-grained PAT with read and write access to **Issues** and
  **Contents** on the target repository. Contents is needed because screenshots are committed
  to a `bug-report-assets` branch; GitHub's issue API has no attachment endpoint.
- **Repository** — `owner/name`, defaults to `webiny/webiny-js`.
- **Labels** — comma separated, applied to every issue filed from here.
- **Anthropic API key** — optional. With it, what you said is turned into a titled issue with
  steps to reproduce. Without it, your words are filed verbatim and the timeline still goes in.

Everything is stored in this browser's `localStorage` under `bugReport.settings`, so issues
are filed as **you**, not as a shared bot. That does mean a token sitting in localStorage:
scope it to one repository and revoke it when you are done.

## What gets captured

Recording starts when the admin app loads and keeps the last 150 events in memory. Nothing
leaves the browser until you file a report.

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
  → the dialog opens; type or dictate
  → Claude drafts title / summary / steps from your words + the timeline
  → the screenshot is committed to the bug-report-assets branch
  → the issue is created, and the body is assembled here, not by the model
```

The prose comes from the model. The screenshot, environment table and timeline are assembled
by `issue/composeIssueBody.ts` from the captured data, so the factual half of the issue is
exactly what was recorded rather than a paraphrase of it.

Dictation uses the browser's own speech recognition. No key, no cost, but it is a Chrome and
Safari feature — elsewhere the mic button just doesn't appear.

## Known rough edges

- The share prompt appears on every report. That is the price of a real screenshot; a DOM
  rasteriser skips the prompt but gets canvases, iframes and cross-origin images wrong.
- The screenshot branch grows forever. Delete it when it gets large; nothing links to old ones
  except closed issues.
- No PR is opened. A well-formed issue is the deliverable; wiring an agent to pick it up is a
  separate job.
