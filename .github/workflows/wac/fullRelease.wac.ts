import { ACTION } from "./utils/index.js";
import { createWorkflow } from "github-actions-wac";
import { createJob } from "./jobs/index.js";

const VERSION = "${{ github.event.inputs.version }}";

// The ref the release branches off, worked out from the version alone (see the `resolveSource`
// job). Consumed by every job after it.
const SOURCE_REF = "${{ needs.resolveSource.outputs.source-ref }}";
const BASE_BRANCH = "${{ needs.resolveSource.outputs.base-branch }}";

export const fullRelease = createWorkflow({
    name: `🚀 Full Release`,
    on: {
        workflow_dispatch: {
            // Version only. What a release branches off is not a free choice - it follows from
            // the version - and asking for it separately only created ways to get the two out of
            // step. Most damaging was the old `sourceTag` default of "next": a patch entered
            // without changing it would branch off unreleased code.
            inputs: {
                version: {
                    description: "Release version (e.g. 6.3.0 for a minor, 6.3.1 for a patch)",
                    required: true,
                    type: "string"
                }
            }
        }
    },
    jobs: {
        // Validates the version and derives everything else from it. Runs before anything is
        // pushed, so a bad input costs nothing.
        resolveSource: createJob({
            name: "Resolve release source",
            // Needs the tags to check that a patch's predecessor actually exists.
            checkout: { "fetch-depth": 0 },
            outputs: {
                "source-ref": "${{ steps.resolve.outputs.source-ref }}",
                "base-branch": "${{ steps.resolve.outputs.base-branch }}"
            },
            env: { VERSION },
            steps: [
                {
                    name: "Resolve source ref and base branch",
                    id: "resolve",
                    run: [
                        "set -euo pipefail",
                        "",
                        'if ! printf "%s" "$VERSION" | grep -Eq "^6\\.[0-9]+\\.[0-9]+$"; then',
                        '  echo "::error::Invalid version [$VERSION]. Expected 6.x.y, e.g. 6.3.0 (three numbers, no alpha/beta)."',
                        "  exit 1",
                        "fi",
                        "",
                        'MINOR="${VERSION%.*}"',
                        'PATCH="${VERSION##*.}"',
                        "",
                        'if [ "$PATCH" = "0" ]; then',
                        "  # A minor release opens the next line, so it branches off next.",
                        '  SOURCE_REF="next"',
                        '  BASE_BRANCH="next"',
                        "else",
                        "  # A patch continues an existing line: it must build on the release before",
                        "  # it. That predecessor is not optional - `yarn release` generates the",
                        "  # changelog as `git log v<previous>..v<this>` using npm's latest dist-tag,",
                        "  # so releasing out of order produces a changelog spanning two releases and",
                        "  # publishes a version whose predecessor never existed.",
                        '  PREVIOUS="${MINOR}.$((PATCH - 1))"',
                        '  SOURCE_REF="v${PREVIOUS}"',
                        "",
                        '  if ! git rev-parse -q --verify "refs/tags/${SOURCE_REF}" > /dev/null; then',
                        '    echo "::error::Cannot release ${VERSION}: tag ${SOURCE_REF} does not exist, so ${PREVIOUS} has not been released yet. Release it first."',
                        "    exit 1",
                        "  fi",
                        "",
                        "  # Source is a tag, so the release gets a base branch cut from it - that way",
                        "  # the PR diff shows only release-specific work.",
                        '  BASE_BRANCH="release/${VERSION}-base"',
                        "fi",
                        "",
                        'echo "source-ref=$SOURCE_REF" >> "$GITHUB_OUTPUT"',
                        'echo "base-branch=$BASE_BRANCH" >> "$GITHUB_OUTPUT"',
                        "",
                        "# Echoed before anything is created, so a wrong derivation is visible up front",
                        "# rather than only in the resulting PR.",
                        "{",
                        '  echo "### 🚀 Release plan"',
                        '  echo ""',
                        '  echo "| | |"',
                        '  echo "| --- | --- |"',
                        '  echo "| Version | \\`$VERSION\\` |"',
                        '  echo "| Branches off | \\`$SOURCE_REF\\` |"',
                        '  echo "| Release branch | \\`release/$VERSION\\` |"',
                        '  echo "| PR base | \\`$BASE_BRANCH\\` |"',
                        '} >> "$GITHUB_STEP_SUMMARY"'
                    ].join("\n")
                }
            ]
        }),
        createWebinyJsBranch: createJob({
            name: "Create release branch (webiny-js)",
            needs: ["resolveSource"],
            checkout: false,
            env: {
                GH_TOKEN: "${{ secrets.GH_TOKEN }}",
                SLACK_RELEASE_CHANNEL_WEBHOOK: "${{ secrets.SLACK_RELEASE_CHANNEL_WEBHOOK }}"
            },
            steps: [
                {
                    name: "Set git email",
                    run: 'git config --global user.email "webiny-bot@webiny.com"'
                },
                {
                    name: "Set git username",
                    run: 'git config --global user.name "webiny-bot"'
                },
                {
                    name: "Checkout source tag",
                    uses: ACTION.checkout,
                    with: {
                        ref: SOURCE_REF,
                        "fetch-depth": 0,
                        token: "${{ secrets.GH_TOKEN }}"
                    }
                },
                {
                    name: `Create and push release branch`,
                    id: "branch",
                    env: {
                        VERSION,
                        SOURCE_REF,
                        BASE_BRANCH
                    },
                    run: [
                        "set -euo pipefail",
                        "# For a patch the base branch is cut from the source tag, so the PR diff",
                        "# shows only release-specific work. For a minor it is `next` itself, which",
                        "# already exists.",
                        'if [ "$BASE_BRANCH" != "$SOURCE_REF" ]; then',
                        '  git checkout -b "$BASE_BRANCH"',
                        '  git push origin "$BASE_BRANCH"',
                        "fi",
                        'git checkout -b "release/${VERSION}"',
                        'git commit --allow-empty -m "chore: start release ${VERSION} [skip ci]" -m "Empty commit to allow PR creation."',
                        'git push origin "release/${VERSION}"'
                    ].join("\n")
                },
                {
                    name: "Open pull request",
                    id: "pr",
                    env: {
                        GITHUB_TOKEN: "${{ secrets.GH_TOKEN }}",
                        BASE_BRANCH
                    },
                    run: `PR_URL=$(gh pr create --title "📦  Release ${VERSION}" --body "Release ${VERSION}\n\n**Docs PR:** https://github.com/webiny/docs.webiny.com/pulls?q=Release+${VERSION}" --base "$BASE_BRANCH" --head "release/${VERSION}") && echo "pr-url=$PR_URL" >> $GITHUB_OUTPUT`
                },
                {
                    name: "Notify Slack - Release PR Created",
                    env: { PR_URL: "${{ steps.pr.outputs.pr-url }}" },
                    run: [
                        `MSG="📦 Release PR for Webiny ${VERSION} has been created: $PR_URL"`,
                        "curl -s -o /dev/null -X POST \\",
                        '  -H "Content-type: application/json" \\',
                        '  --data "{\\"text\\":\\"${MSG}\\"}" \\',
                        '  "$SLACK_RELEASE_CHANNEL_WEBHOOK"'
                    ].join("\n")
                }
            ]
        }),
        createDocsBranch: createJob({
            name: "Trigger release notes generation (docs.webiny.com)",
            needs: ["createWebinyJsBranch"],
            checkout: false,
            env: {
                GH_TOKEN: "${{ secrets.GH_TOKEN }}"
            },
            steps: [
                {
                    name: "Trigger generate-release-notes workflow",
                    run: `gh workflow run create-release-branch.yml --repo webiny/docs.webiny.com -f version=${VERSION}`
                }
            ]
        })
    }
});
