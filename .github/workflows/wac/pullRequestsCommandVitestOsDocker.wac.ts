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
import { DdbOsStorageOps } from "./storageOps/index.js";

// `/vitest-os-docker` runs the DDB+OS test group against an OpenSearch container started on the
// runner, instead of the shared OpenSearch domain in the CI AWS account.
//
// The point is the AWS bill. That domain is the expensive part of the CI account and it has to
// stay up for every `/vitest` run, which is why it is now torn down over weekends. Vitest tests
// only ever talk to OpenSearch over HTTP, so a container per matrix leg should do the same job for
// nothing. E2E still needs the real domain.
//
// This is a separate command rather than a flag on `/vitest`, so the two can be run back to back
// on the same PR and compared. Only the DDB+OS group is here: the other four groups in `/vitest`
// (No storage, DDB, SQL, PGlite) never touch OpenSearch, so running them again would just burn
// runner minutes.
//
// How the tests find the container: `createTestOpenSearchClient` already defaults to
// `http://localhost:9200` with no auth, which is what `yarn test:os` uses locally. So the trick is
// not to set `OPENSEARCH_ENDPOINT` / `OPENSEARCH_USERNAME` / `OPENSEARCH_PASSWORD` at all, and the
// client points at the container by itself.
const ddbOsStorageOps = new DdbOsStorageOps();

// Matches `OS_ENGINE_VERSION` in `packages/project-aws/src/pulumi/apps/core/CoreOpenSearch.ts`
// (OpenSearch_3.3), so a passing run here means something about the version users deploy.
const OPENSEARCH_IMAGE = "opensearchproject/opensearch:3.3.2";

// Will print "next" or "dev". Important for caching (via actions/cache).
const DIR_WEBINY_JS = "${{ needs.baseBranch.outputs.base-branch }}";

const ROW_LABEL = "DDB+OS (Docker)";

const installBuildSteps = createInstallBuildSteps({ workingDirectory: DIR_WEBINY_JS });
const yarnCacheSteps = createYarnCacheSteps({
    workingDirectory: DIR_WEBINY_JS,
    restoreOnly: true
});
const globalBuildCacheSteps = createGlobalBuildCacheSteps({
    workingDirectory: DIR_WEBINY_JS,
    restoreOnly: true
});
const runBuildCacheUploadSteps = createRunBuildArtifactUploadSteps({
    workingDirectory: DIR_WEBINY_JS
});
const runBuildCacheDownloadSteps = createRunBuildArtifactDownloadSteps({
    workingDirectory: DIR_WEBINY_JS
});

const COMMENT_INTRO =
    "Vitest tests (DDB+OS, OpenSearch in Docker) have been initiated (for more information, " +
    "click [here](https://github.com/webiny/webiny-js/actions/runs/${{ github.run_id }})). :whale:";

const INITIAL_COMMENT_BODY = [
    COMMENT_INTRO,
    "",
    "| Group | Status |",
    "| --- | --- |",
    `| ${ROW_LABEL} | ⏳ Queued |`
].join("\n");

export const pullRequestsCommandVitestOsDocker = createSlashCommandWorkflow({
    command: "vitest-os-docker",
    name: "💬 PR Command - Vitest (OpenSearch in Docker)",
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
        "vitest-os-docker-constants": createJob({
            needs: ["baseBranch", "build", "checkComment"],
            name: `Vitest (${ROW_LABEL}) - Constants`,
            checkout: { path: DIR_WEBINY_JS },
            outputs: {
                "vitest-test-commands":
                    "${{ steps.list-vitest-test-commands.outputs.vitest-test-commands }}"
            },
            steps: [
                {
                    name: `Mark "${ROW_LABEL}" as running`,
                    "continue-on-error": true,
                    env: {
                        GH_TOKEN: "${{ secrets.GH_TOKEN }}",
                        COMMENT_ID: "${{ needs.checkComment.outputs.comment-id }}"
                    },
                    run: [
                        `STATUS="🔄 Running"`,
                        `gh api repos/\${{ github.repository }}/issues/comments/$COMMENT_ID --jq '.body' > /tmp/vitest-comment.txt`,
                        `sed -i "s@^| ${ROW_LABEL} |.*@| ${ROW_LABEL} | $STATUS |@" /tmp/vitest-comment.txt`,
                        `gh api repos/\${{ github.repository }}/issues/comments/$COMMENT_ID -X PATCH --field body=@/tmp/vitest-comment.txt`
                    ].join("\n")
                },
                // Test discovery reads `packages/` off disk, so it has to run against the PR's
                // code (see the same note in `pullRequestsCommandVitest`).
                ...createCheckoutPrSteps({ workingDirectory: DIR_WEBINY_JS }),
                {
                    id: "list-vitest-test-commands",
                    name: "List Vitest Test Commands",
                    "working-directory": DIR_WEBINY_JS,
                    run: runNodeScript("listVitestTestCommands", `["${ddbOsStorageOps.id}"]`, {
                        outputAs: "vitest-test-commands"
                    })
                }
            ]
        }),
        "vitest-os-docker-run": createJob({
            needs: ["baseBranch", "constants", "vitest-os-docker-constants"],
            // The group prefix lets the summary job filter this group's matrix legs out of the
            // run's jobs API.
            name: `${ROW_LABEL} / \${{ matrix.testCommand.title }}`,
            strategy: {
                "fail-fast": false,
                matrix: {
                    os: ["ubuntu-latest"],
                    node: [NODE_VERSION],
                    testCommand:
                        "${{ fromJSON(needs.vitest-os-docker-constants.outputs.vitest-test-commands) }}"
                }
            },
            "runs-on": "${{ matrix.os }}",
            // One container per matrix leg, torn down with the runner. Note what is NOT here:
            // no `OPENSEARCH_ENDPOINT`, `OPENSEARCH_USERNAME` or `OPENSEARCH_PASSWORD`, which is
            // what makes the test client fall back to `http://localhost:9200`. `AWS_REGION` stays
            // because unrelated test code reads it; DynamoDB is dynalite, so nothing in this job
            // needs AWS credentials, and unlike `/vitest` there is no OIDC role assumed.
            env: {
                AWS_REGION,
                WEBINY_STORAGE: ddbOsStorageOps.id,
                OPENSEARCH_INDEX_PREFIX: "${{ matrix.testCommand.id }}"
            },
            services: {
                opensearch: {
                    image: OPENSEARCH_IMAGE,
                    env: {
                        "discovery.type": "single-node",
                        DISABLE_SECURITY_PLUGIN: "true",
                        // The runner has plenty of RAM, but a single-node OpenSearch does not need
                        // it and a smaller heap starts faster.
                        OPENSEARCH_JAVA_OPTS: "-Xms512m -Xmx512m"
                    },
                    ports: ["9200:9200"]
                }
            },
            checkout: { path: DIR_WEBINY_JS },
            steps: [
                ...createCheckoutPrSteps({ workingDirectory: DIR_WEBINY_JS }),
                ...yarnCacheSteps,
                ...runBuildCacheDownloadSteps,
                ...installBuildSteps,
                {
                    // Deliberately last before the tests: the container boots while yarn installs,
                    // so by the time we get here it is usually already up. No container health
                    // check, because polling from the runner gives a readable failure and a log
                    // line saying which build answered.
                    name: "Wait for OpenSearch",
                    run: [
                        "set -euo pipefail",
                        "",
                        "for i in $(seq 1 60); do",
                        '  if curl -sf "http://localhost:9200/_cluster/health?wait_for_status=yellow&timeout=5s" > /dev/null; then',
                        '    echo "OpenSearch is up:"',
                        "    curl -s http://localhost:9200",
                        "    exit 0",
                        "  fi",
                        "  sleep 5",
                        "done",
                        "",
                        'echo "::error::OpenSearch did not answer on localhost:9200 within 5 minutes."',
                        "exit 1"
                    ].join("\n")
                },
                ...withCommonParams([{ name: "Run tests", run: "${{ matrix.testCommand.cmd }}" }], {
                    "working-directory": DIR_WEBINY_JS
                })
            ]
        }),
        // Writes the final status into the comment this command posted. It does NOT touch the PR
        // description: `/vitest` owns the `vitest-status` block there, and two workflows editing
        // the same markers would overwrite each other.
        "vitest-os-docker-summary": createJob({
            name: "Vitest (OpenSearch in Docker) status summary",
            needs: ["checkComment", "vitest-os-docker-run"],
            if: "always() && needs.checkComment.result == 'success'",
            checkout: false,
            env: {
                GH_TOKEN: "${{ secrets.GH_TOKEN }}",
                COMMENT_ID: "${{ needs.checkComment.outputs.comment-id }}",
                COMMENT_INTRO,
                RESULT: "${{ needs['vitest-os-docker-run'].result }}"
            },
            steps: [
                {
                    name: "Report result",
                    "continue-on-error": true,
                    run: [
                        `gh api --paginate "repos/\${{ github.repository }}/actions/runs/\${{ github.run_id }}/jobs" --jq '.jobs[] | [.name, .conclusion] | @tsv' > /tmp/jobs.tsv`,
                        ``,
                        `PREFIX="${ROW_LABEL} / "`,
                        `TOTAL=$(awk -F'\\t' -v p="$PREFIX" 'index($1,p)==1{n++} END{print n+0}' /tmp/jobs.tsv)`,
                        `PASSED=$(awk -F'\\t' -v p="$PREFIX" 'index($1,p)==1 && $2=="success"{n++} END{print n+0}' /tmp/jobs.tsv)`,
                        ``,
                        // No legs at all means the group never ran, so fall back to the job result.
                        `if [ "$TOTAL" -eq 0 ]; then`,
                        `  case "$RESULT" in`,
                        `    success) STATUS="✅ Passed" ;;`,
                        `    cancelled) STATUS="⚪ Cancelled" ;;`,
                        `    skipped) STATUS="⏭️ Skipped" ;;`,
                        `    *) STATUS="❌ Failed" ;;`,
                        `  esac`,
                        `elif [ "$PASSED" -eq "$TOTAL" ]; then`,
                        `  STATUS="✅ $PASSED/$TOTAL passed"`,
                        `else`,
                        `  STATUS="❌ $PASSED/$TOTAL passed"`,
                        `fi`,
                        ``,
                        `awk -F'\\t' -v p="$PREFIX" 'index($1,p)==1 && $2=="failure"{ x=substr($1,length(p)+1); sub(/^\\[[^]]*\\] /,"",x); print "- " x }' /tmp/jobs.tsv > /tmp/failed.txt`,
                        ``,
                        `{`,
                        `  echo "$COMMENT_INTRO"`,
                        `  echo ""`,
                        `  echo "| Group | Status |"`,
                        `  echo "| --- | --- |"`,
                        `  echo "| ${ROW_LABEL} | $STATUS |"`,
                        `  if [ -s /tmp/failed.txt ]; then`,
                        `    echo ""`,
                        `    echo "<details><summary>❌ Failed packages</summary>"`,
                        `    echo ""`,
                        `    cat /tmp/failed.txt`,
                        `    echo "</details>"`,
                        `  fi`,
                        `} > /tmp/vitest-comment.txt`,
                        ``,
                        `gh api repos/\${{ github.repository }}/issues/comments/$COMMENT_ID -X PATCH --field body=@/tmp/vitest-comment.txt`
                    ].join("\n")
                }
            ]
        })
    }
});
