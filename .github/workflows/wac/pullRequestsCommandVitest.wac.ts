import { NormalJob } from "github-actions-wac";
import {
    createCheckoutPrSteps,
    createGlobalBuildCacheSteps,
    createInstallBuildSteps,
    createRunBuildArtifactDownloadSteps,
    createRunBuildArtifactUploadSteps,
    createYarnCacheSteps,
    withCommonParams
} from "./steps/index.js";
import {
    AWS_REGION,
    BUILD_PACKAGES_RUNNER,
    NODE_OPTIONS,
    NODE_VERSION,
    runNodeScript
} from "./utils/index.js";
import { createJob, createSlashCommandWorkflow } from "./jobs/index.js";
import {
    DdbStorageOps,
    DdbOsStorageOps,
    SqlStorageOps,
    PgliteStorageOps,
    type AbstractStorageOps
} from "./storageOps/index.js";

const ddbStorageOps = new DdbStorageOps();
const ddbOsStorageOps = new DdbOsStorageOps();
const sqlStorageOps = new SqlStorageOps();
const pgliteStorageOps = new PgliteStorageOps();

// Will print "next" or "dev". Important for caching (via actions/cache).
const DIR_WEBINY_JS = "${{ needs.baseBranch.outputs.base-branch }}";

const installBuildSteps = createInstallBuildSteps({ workingDirectory: DIR_WEBINY_JS });
const yarnCacheSteps = createYarnCacheSteps({ workingDirectory: DIR_WEBINY_JS });
const globalBuildCacheSteps = createGlobalBuildCacheSteps({ workingDirectory: DIR_WEBINY_JS });
const runBuildCacheUploadSteps = createRunBuildArtifactUploadSteps({
    workingDirectory: DIR_WEBINY_JS
});
const runBuildCacheDownloadSteps = createRunBuildArtifactDownloadSteps({
    workingDirectory: DIR_WEBINY_JS
});

// Live status table shown in the PR comment. Rows are updated in place as each
// group progresses (Queued -> Running -> Passed/Failed) by the per-group jobs,
// and the final `vitestStatusSummary` job mirrors the result into the PR body.
const STATUS_GROUPS = ["No storage", "DDB", "DDB+OS", "SQL", "PGlite"];

const COMMENT_INTRO =
    "Vitest tests have been initiated (for more information, click " +
    "[here](https://github.com/webiny/webiny-js/actions/runs/${{ github.run_id }})). :sparkles:";

const INITIAL_COMMENT_BODY = [
    COMMENT_INTRO,
    "",
    "| Group | Status |",
    "| --- | --- |",
    ...STATUS_GROUPS.map(group => `| ${group} | ⏳ Queued |`)
].join("\n");

// Env needed by any step that patches the status comment.
const COMMENT_ENV = {
    GH_TOKEN: "${{ secrets.GH_TOKEN }}",
    COMMENT_ID: "${{ needs.checkComment.outputs.comment-id }}"
};

// Read the comment, overwrite a single group's row (matched by label, so the
// update is independent of the row's current status), and write it back.
const updateCommentRowRun = (group: string) =>
    [
        `gh api repos/\${{ github.repository }}/issues/comments/$COMMENT_ID --jq '.body' > /tmp/vitest-comment.txt`,
        `sed -i "s@^| ${group} |.*@| ${group} | $STATUS |@" /tmp/vitest-comment.txt`,
        `gh api repos/\${{ github.repository }}/issues/comments/$COMMENT_ID -X PATCH --field body=@/tmp/vitest-comment.txt`
    ].join("\n");

const createMarkRunningStep = (group: string) => ({
    name: `Mark "${group}" as running`,
    "continue-on-error": true,
    env: COMMENT_ENV,
    run: [`STATUS="🔄 Running"`, updateCommentRowRun(group)].join("\n")
});

const createReportResultStep = (group: string, runJobKey: string) => ({
    name: `Report "${group}" result`,
    "continue-on-error": true,
    env: { ...COMMENT_ENV, RESULT: `\${{ needs.${runJobKey}.result }}` },
    run: [
        // Count this group's matrix legs (success vs total) from the jobs API.
        `mapfile -t CONCS < <(gh api --paginate "repos/\${{ github.repository }}/actions/runs/\${{ github.run_id }}/jobs" --jq '.jobs[] | select(.name | startswith("${group} / ")) | .conclusion')`,
        `TOTAL=\${#CONCS[@]}`,
        `PASSED=0`,
        `for c in "\${CONCS[@]}"; do if [ "$c" = "success" ]; then PASSED=$((PASSED + 1)); fi; done`,
        `if [ "$TOTAL" -eq 0 ]; then`,
        `  case "$RESULT" in`,
        `    cancelled) STATUS="⚪ Cancelled" ;;`,
        `    skipped) STATUS="⏭️ Skipped" ;;`,
        `    *) STATUS="❌ Failed" ;;`,
        `  esac`,
        `elif [ "$PASSED" -eq "$TOTAL" ]; then`,
        `  STATUS="✅ $PASSED/$TOTAL passed"`,
        `else`,
        `  STATUS="❌ $PASSED/$TOTAL passed"`,
        `fi`,
        updateCommentRowRun(group)
    ].join("\n")
});

const createVitestTestsJobs = (storageOps?: AbstractStorageOps) => {
    const jobNames = {
        constants: ["vitest", storageOps?.shortId, "constants"].filter(Boolean).join("-"),
        tests: ["vitest", storageOps?.shortId, "run"].filter(Boolean).join("-"),
        result: ["vitest", storageOps?.shortId, "result"].filter(Boolean).join("-")
    };

    const rowLabel = storageOps ? storageOps.displayName : "No storage";

    const env: Record<string, string> = { AWS_REGION };

    if (storageOps) {
        env["WEBINY_STORAGE"] = storageOps.id;

        if (storageOps.id === "ddb-os,ddb") {
            env["AWS_OPENSEARCH_DOMAIN_NAME"] = "${{ secrets.OPENSEARCH_DOMAIN_NAME }}";
            env["OPENSEARCH_ENDPOINT"] = "${{ secrets.OPENSEARCH_ENDPOINT }}";
            env["OPENSEARCH_USERNAME"] = "${{ secrets.OPENSEARCH_USERNAME }}";
            env["OPENSEARCH_PASSWORD"] = "${{ secrets.OPENSEARCH_PASSWORD }}";
            env["OPENSEARCH_INDEX_PREFIX"] = "${{ matrix.testCommand.id }}";
        }

        if (storageOps instanceof PgliteStorageOps) {
            env["WEBINY_SQL_CLIENT"] = "pglite";
        }
    }

    const testCommands = [] as any[];

    return {
        [jobNames.constants]: createJob({
            needs: ["baseBranch", "build", "checkComment"],
            name: `Vitest (${rowLabel}) - Constants`,
            checkout: { path: DIR_WEBINY_JS },
            outputs: {
                "vitest-test-commands":
                    "${{ steps.list-vitest-test-commands.outputs.vitest-test-commands }}"
            },
            steps: [
                createMarkRunningStep(rowLabel),
                // Test discovery reads `packages/` off disk, so it has to run against the PR's
                // code. Without this the job kept the default `issue_comment` checkout (the
                // default branch), and a PR that added a package, added the first tests to an
                // existing one, or changed a package's testing/sharding config would have those
                // changes silently ignored - while a PR that deleted a package would still get a
                // test job for it.
                ...createCheckoutPrSteps({ workingDirectory: DIR_WEBINY_JS }),
                {
                    id: "list-vitest-test-commands",
                    name: "List Vitest Test Commands",
                    "working-directory": DIR_WEBINY_JS,
                    run: runNodeScript("listVitestTestCommands", `["${storageOps?.id || ""}"]`, {
                        outputAs: "vitest-test-commands"
                    })
                }
            ]
        }),
        [jobNames.result]: createJob({
            needs: [jobNames.tests, "checkComment"],
            name: `Vitest (${rowLabel}) - Report status`,
            if: "always() && needs.checkComment.result == 'success'",
            checkout: false,
            steps: [createReportResultStep(rowLabel, jobNames.tests)]
        }),
        [jobNames.tests]: createJob({
            needs: ["baseBranch", "constants", jobNames.constants],
            // The group prefix lets `vitest-*-result` / `vitestStatusSummary`
            // filter this group's matrix legs out of the run's jobs API.
            name: `${rowLabel} / \${{ matrix.testCommand.title }}`,
            strategy: {
                "fail-fast": false,
                matrix: {
                    os: ["ubuntu-latest"],
                    node: [NODE_VERSION],
                    testCommand: `$\{{ fromJSON(needs.${jobNames.constants}.outputs.vitest-test-commands) }}`
                }
            },
            "runs-on": "${{ matrix.os }}",
            env,
            awsAuth: storageOps && storageOps.id === "ddb-os,ddb",
            checkout: { path: DIR_WEBINY_JS },
            steps: [
                ...createCheckoutPrSteps({ workingDirectory: DIR_WEBINY_JS }),
                ...yarnCacheSteps,
                ...runBuildCacheDownloadSteps,
                ...installBuildSteps,
                ...withCommonParams([{ name: "Run tests", run: "${{ matrix.testCommand.cmd }}" }], {
                    "working-directory": DIR_WEBINY_JS
                })
            ]
        })
    };
};

export const pullRequestsCommandVitest = createSlashCommandWorkflow({
    command: "vitest",
    name: "Pull Requests Command - Vitest",
    comment: INITIAL_COMMENT_BODY,
    captureCommentId: true,
    workflow: {
        env: {
            NODE_OPTIONS,
            AWS_REGION
        }
    },
    jobs: {
        baseBranch: createJob({
            needs: "checkComment",
            name: "Get base branch",
            outputs: {
                "base-branch": "${{ steps.base-branch.outputs.base-branch }}",
                "pr-sha": "${{ steps.pr-sha.outputs.pr-sha }}"
            },
            steps: [
                {
                    name: "Get base branch",
                    id: "base-branch",
                    env: { GITHUB_TOKEN: "${{ secrets.GH_TOKEN }}" },
                    run: 'echo "base-branch=$(gh pr view ${{ github.event.issue.number }} --json baseRefName -q .baseRefName)" >> $GITHUB_OUTPUT'
                },
                {
                    // Resolve the PR head ONCE, here, and have every job check out exactly this
                    // commit. Jobs in a single run can start tens of minutes apart, and each
                    // `gh pr checkout` would otherwise resolve the PR head at its own start time -
                    // so a push mid-run makes the build job produce output from one commit while
                    // the test jobs run against another.
                    name: "Get PR head SHA",
                    id: "pr-sha",
                    env: { GITHUB_TOKEN: "${{ secrets.GH_TOKEN }}" },
                    run: 'echo "pr-sha=$(gh pr view ${{ github.event.issue.number }} --json headRefOid -q .headRefOid)" >> $GITHUB_OUTPUT'
                }
            ]
        }),
        constants: createJob({
            needs: "baseBranch",
            name: "Create constants",
            outputs: {
                "global-cache-key": "${{ steps.global-cache-key.outputs.global-cache-key }}"
            },
            checkout: false,
            steps: [
                {
                    name: "Create global cache key",
                    id: "global-cache-key",
                    run: `echo "global-cache-key=\${{ needs.baseBranch.outputs.base-branch }}-\${{ runner.os }}-$(/bin/date -u "+%m%d")-\${{ vars.RANDOM_CACHE_KEY_SUFFIX }}" >> $GITHUB_OUTPUT`
                }
            ]
        }),
        build: createJob({
            name: "Build",
            needs: ["baseBranch", "constants"],
            checkout: { path: DIR_WEBINY_JS },
            "runs-on": BUILD_PACKAGES_RUNNER,
            steps: [
                ...createCheckoutPrSteps({ workingDirectory: DIR_WEBINY_JS }),
                ...yarnCacheSteps,
                ...globalBuildCacheSteps,
                ...installBuildSteps,
                ...runBuildCacheUploadSteps
            ]
        }),
        ...createVitestTestsJobs(),
        ...createVitestTestsJobs(ddbStorageOps),
        ...createVitestTestsJobs(ddbOsStorageOps),
        ...createVitestTestsJobs(sqlStorageOps),
        ...createVitestTestsJobs(pgliteStorageOps),

        // Once all groups are done, write the authoritative final status: it
        // heals the PR comment (in case a concurrent row update was lost) and
        // mirrors the result into the PR description between markers.
        vitestStatusSummary: createJob({
            name: "Vitest status summary",
            needs: [
                "checkComment",
                "vitest-run",
                "vitest-ddb-run",
                "vitest-ddb-os-run",
                "vitest-sql-run",
                "vitest-pglite-run"
            ],
            if: "always() && needs.checkComment.result == 'success'",
            checkout: false,
            env: {
                GH_TOKEN: "${{ secrets.GH_TOKEN }}",
                COMMENT_ID: "${{ needs.checkComment.outputs.comment-id }}",
                COMMENT_INTRO,
                PR_NUMBER: "${{ github.event.issue.number }}",
                R_NONE: "${{ needs.vitest-run.result }}",
                R_DDB: "${{ needs.vitest-ddb-run.result }}",
                R_DDB_OS: "${{ needs.vitest-ddb-os-run.result }}",
                R_SQL: "${{ needs.vitest-sql-run.result }}",
                R_PGLITE: "${{ needs.vitest-pglite-run.result }}"
            },
            steps: [
                {
                    name: "Heal PR comment and update PR description",
                    "continue-on-error": true,
                    run: [
                        // Pull every leg of the run once: "<job name>\t<conclusion>".
                        `gh api --paginate "repos/\${{ github.repository }}/actions/runs/\${{ github.run_id }}/jobs" --jq '.jobs[] | [.name, .conclusion] | @tsv' > /tmp/jobs.tsv`,
                        ``,
                        // "✅ N/N passed" / "❌ P/T passed", falling back to the job
                        // result when a group produced no legs (skipped/cancelled).
                        `status_for() {`,
                        `  local prefix="$1" fallback="$2" total passed`,
                        `  total=$(awk -F'\\t' -v p="$prefix" 'index($1,p)==1{n++} END{print n+0}' /tmp/jobs.tsv)`,
                        `  if [ "$total" -eq 0 ]; then`,
                        `    case "$fallback" in`,
                        `      success) echo "✅ Passed" ;;`,
                        `      cancelled) echo "⚪ Cancelled" ;;`,
                        `      skipped) echo "⏭️ Skipped" ;;`,
                        `      *) echo "❌ Failed" ;;`,
                        `    esac`,
                        `    return`,
                        `  fi`,
                        `  passed=$(awk -F'\\t' -v p="$prefix" 'index($1,p)==1 && $2=="success"{n++} END{print n+0}' /tmp/jobs.tsv)`,
                        `  if [ "$passed" -eq "$total" ]; then echo "✅ $passed/$total passed"; else echo "❌ $passed/$total passed"; fi`,
                        `}`,
                        ``,
                        // Collect the failed packages per group into /tmp/failed.txt.
                        `: > /tmp/failed.txt`,
                        `add_failed() {`,
                        `  local list`,
                        `  list=$(awk -F'\\t' -v p="$1" 'index($1,p)==1 && $2=="failure"{ x=substr($1,length(p)+1); sub(/^\\[[^]]*\\] /,"",x); print "- " x }' /tmp/jobs.tsv)`,
                        `  if [ -n "$list" ]; then { echo "**$2**"; echo "$list"; echo ""; } >> /tmp/failed.txt; fi`,
                        `}`,
                        `add_failed "No storage / " "No storage"`,
                        `add_failed "DDB / " "DDB"`,
                        `add_failed "DDB+OS / " "DDB+OS"`,
                        `add_failed "SQL / " "SQL"`,
                        `add_failed "PGlite / " "PGlite"`,
                        ``,
                        `S_NONE=$(status_for "No storage / " "$R_NONE")`,
                        `S_DDB=$(status_for "DDB / " "$R_DDB")`,
                        `S_DDB_OS=$(status_for "DDB+OS / " "$R_DDB_OS")`,
                        `S_SQL=$(status_for "SQL / " "$R_SQL")`,
                        `S_PGLITE=$(status_for "PGlite / " "$R_PGLITE")`,
                        ``,
                        `render_table() {`,
                        `  echo "| Group | Status |"`,
                        `  echo "| --- | --- |"`,
                        `  echo "| No storage | $S_NONE |"`,
                        `  echo "| DDB | $S_DDB |"`,
                        `  echo "| DDB+OS | $S_DDB_OS |"`,
                        `  echo "| SQL | $S_SQL |"`,
                        `  echo "| PGlite | $S_PGLITE |"`,
                        `  if [ -s /tmp/failed.txt ]; then`,
                        `    echo ""`,
                        `    echo "<details><summary>❌ Failed packages</summary>"`,
                        `    echo ""`,
                        `    cat /tmp/failed.txt`,
                        `    echo "</details>"`,
                        `  fi`,
                        `}`,
                        ``,
                        `# Heal the PR comment with the authoritative final status.`,
                        `{ echo "$COMMENT_INTRO"; echo ""; render_table; } > /tmp/vitest-comment.txt`,
                        `gh api repos/\${{ github.repository }}/issues/comments/$COMMENT_ID -X PATCH --field body=@/tmp/vitest-comment.txt`,
                        ``,
                        `# Build the PR description status block (idempotent via markers).`,
                        `{ echo "<!-- vitest-status:start -->"; echo "### 🧪 Vitest results"; echo ""; render_table; echo "<!-- vitest-status:end -->"; } > /tmp/vitest-status.md`,
                        ``,
                        `gh pr view "$PR_NUMBER" -R \${{ github.repository }} --json body -q .body > /tmp/pr-body-raw.txt`,
                        `# Drop any existing status block, then trailing blank lines, so re-runs don't stack separators.`,
                        `sed '/<!-- vitest-status:start -->/,/<!-- vitest-status:end -->/d' /tmp/pr-body-raw.txt > /tmp/pr-body-noblock.txt`,
                        `awk 'NF{p=NR} {a[NR]=$0} END{for(i=1;i<=p;i++) print a[i]}' /tmp/pr-body-noblock.txt > /tmp/pr-body-trimmed.txt`,
                        `{ cat /tmp/pr-body-trimmed.txt; echo ""; cat /tmp/vitest-status.md; } > /tmp/pr-body.txt`,
                        `gh pr edit "$PR_NUMBER" -R \${{ github.repository }} --body-file /tmp/pr-body.txt`
                    ].join("\n")
                }
            ]
        })
    }
});
