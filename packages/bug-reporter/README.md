# Bug reporter

Report a bug by talking to the app. Hit `cmd+shift+b`, say what went wrong, paste your
screenshot, and a GitHub issue appears with it attached alongside the environment and a
timeline of what you did in the minutes before you reported it.

On in every Webiny project. Nobody configures anything: with no GitHub token the API writes the
report up and hands back a prefilled `issues/new` URL to submit, which needs no credentials.

## Two modes

The API picks based on whether it has a GitHub token. Both draft the issue the same way; only
the ending differs.

|                              | **filed** (token set)         | **compose** (no token)           |
| ---------------------------- | ----------------------------- | -------------------------------- |
| Who creates the issue        | the API, as the token's owner | the reporter, in their browser   |
| Screenshots                  | uploaded and embedded         | must be pasted into the composer |
| Reporter sees the body first | no                            | yes, in GitHub's editor          |
| Needs a GitHub account       | no                            | yes                              |
| Timeline                     | all 150 events                | last 60, to fit in a URL         |

`compose` returns a prefilled `github.com/.../issues/new?...` URL that the dialog opens on a
click. Nothing is created until the reporter presses Submit. This is the zero-credential path:
it works with no setup at all.

## Setup

Everything is optional — with none of it set you get compose mode, which works. `BugReporter.tsx`
reads these from the environment that builds the API and passes them through as build params, so
CI can hold them as secrets:

| Variable                  |                                                           |
| ------------------------- | --------------------------------------------------------- |
| `BUG_REPORT_GITHUB_TOKEN` | A PAT, either kind. See below. Absent means compose mode. |
| `BUG_REPORT_REPOSITORY`   | `owner/name`. Defaults to `webiny/webiny-js`.             |
| `BUG_REPORT_LABELS`       | Comma separated. Defaults to `bug`.                       |

Every issue also gets a `reported-in-app` label, on top of whatever `BUG_REPORT_LABELS` says.
That one isn't configurable — it's only useful if it's the same everywhere, so you can filter
the whole set:

```
label:reported-in-app
```

In filed mode the gateway creates it on first use with its own colour and description, rather
than letting GitHub auto-create a grey one. In compose mode it's best effort: GitHub drops
labels for anyone without push access, and an unknown label can't be created without a token.

### The token

Only needed for filed mode. Two write permissions: **issues** to file the issue, and
**contents** to commit the screenshots. Contents is not optional if anyone pastes an image,
because GitHub's issue API has no attachment endpoint, so images go to a `bug-report-assets`
branch instead.

- **Classic** — one `repo` scope covers both:
  [create one](https://github.com/settings/tokens/new?scopes=repo&description=Webiny%20bug%20reporter).
  Use `public_repo` instead if the target repo is public. Classic tokens can't be limited to a
  single repository: `repo` reaches every repo the account can write to.
- **Fine-grained** — pick the one repository, then set Issues and Contents to read and write:
  [create one](https://github.com/settings/personal-access-tokens/new).

Both go in the same `Authorization: Bearer` header, so the code doesn't care which you use.

## AI drafting is not in this package

The base files the reporter's own words. It has no `ai`, `zod` or ai-powerups dependency and no
opinion about models.

Drafting lives in `extensions/bugReportAi/`, internal to this repo, and decorates `IssueDrafter`.
It registers a `bugReporter.draftIssue` capability with `defaultRole: "standard"`, so the model
and any extra instructions are configurable per project in AI settings like any built-in AI
feature. A decorator rather than a replacement because the base is the fallback: no model role
configured, or the call failing, both return the verbatim draft.

So a project without that extension gets a working bug reporter that files verbatim. Nothing
degrades, and nothing has to be configured to turn it off.

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
customer data. Screenshots are not filtered, but you took them, so you know what is in them.

## How it fits together

```
cmd+shift+b
  → the dialog opens; type or dictate, paste screenshots
  → POST /stream/bug-report carries the text, events, environment and images
  ↓ API, streaming back as it goes
  → "drafting"    the AI extension writes title / summary / steps, if installed
  ├─ token set
  │    → "uploading 1 of 2"   each image to the bug-report-assets branch
  │    → "creating"           the issue itself
  │    → "filed"              with the issue URL
  └─ no token
       → "compose"            with a prefilled issues/new URL to open
```

The response is server-sent events, not a GraphQL mutation. Drafting calls a model and filing
makes several GitHub round trips, so a report takes long enough that the dialog has to say what
it is doing rather than sit on a spinner. Closing the dialog aborts the request.

A background task would be wrong twice over: there is somebody watching, and the payload carries
base64 screenshots, routinely megabytes, which cannot fit in a task's persisted `input` under
DynamoDB's 400 kB item cap.

With the AI extension installed the model writes five fields: `title`, `summary`,
`stepsToReproduce`, `expected`, `actual`. Without it, `title` is the reporter's first line and
`summary` is their text, and the empty sections are omitted.
Everything else in the body is assembled by `api/composeIssueBody.ts` from what was recorded,
so the factual half of the issue can't be paraphrased or invented.

## Attachments

`cmd+v` anywhere in the dialog attaches an image, as many as you like, each with a remove
button. Works for a raw screenshot on the clipboard and for an image file copied from Finder.
Pasted _text_ is left alone, so it still lands in the textarea.

**A screenshot on its own is a whole report.** Paste and submit without typing anything: the
first three images go to the model as file parts, so it reads the error text off the image and
writes the title and summary from that. Handy when the screenshot already says it better than
you would. This works in both modes, because drafting happens on the API either way — even in
compose mode, where the image can't ride along into the issue, the model has still read it.

Nothing is captured for you. Taking the screenshot yourself means you frame the thing that is
actually wrong, and there is no browser share prompt in the way. Use whatever you already use:
`cmd+ctrl+shift+4` on macOS puts a region straight on the clipboard.

Dictation uses the browser's own speech recognition. No key, no cost, but it is a Chrome and
Safari feature — elsewhere the mic button just doesn't appear.

## Layout

```
shared/types.ts        the wire shape, types only, read by both bundles
recording/             the action recorder and its ring buffer   (admin)
capture/               pasted images and environment             (admin)
speech/                dictation                                 (admin)
presentation/report/   presenter and dialogs                     (admin)
commands/              the command palette entry                 (admin)
gateway/               the SSE client for /stream/bug-report     (admin)
api/config/            build params, and which mode they imply   (api)
api/drafter/           the verbatim base drafter                 (api)
api/github/            filed mode: uploads and issue creation    (api)
api/buildComposeUrl.ts compose mode: the prefilled URL           (api)
api/SubmitBugReportRoute.ts  the SSE route that orchestrates it   (api)
```

## Known rough edges

- The screenshot branch grows forever, in filed mode. Delete it when it gets large; nothing
  links to old ones except closed issues.
- Compose mode caps the timeline at 60 events to stay under the ~8 kB a GET URL can be relied
  on to carry. I have not measured where GitHub itself starts returning 414, so that number is
  the general-purpose safe limit rather than a tested one.
- Build params are baked at build time, so rotating the token means a redeploy of the API.
- No PR is opened. A well-formed issue is the deliverable; wiring an agent to pick it up is a
  separate job.
