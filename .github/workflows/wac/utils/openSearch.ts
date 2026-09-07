// OpenSearch for Vitest runs, as a service container on the runner instead of the shared domain in
// the CI AWS account.
//
// That domain is the expensive part of the CI account, expensive enough that it now gets torn down
// over weekends. Vitest only ever talks to OpenSearch over HTTP, so a container per matrix leg does
// the same job for nothing, and gives every leg its own cluster instead of sharing one.
//
// E2E is a different story and still needs the real domain: it deploys a Webiny project, and the
// deployed Lambdas cannot reach a container on the runner.
//
// Nothing points the tests at the container. `createTestOpenSearchClient` already defaults to
// `http://localhost:9200` with no auth, which is what `yarn test:os` uses locally, and only
// switches to a remote cluster when `OPENSEARCH_ENDPOINT` is set. So a job that wants the container
// simply leaves `OPENSEARCH_ENDPOINT`, `OPENSEARCH_USERNAME` and `OPENSEARCH_PASSWORD` unset.
//
// `OPENSEARCH_INDEX_PREFIX` is gone for the same reason. It existed to keep matrix legs from
// colliding in the one shared cluster; a cluster per leg makes that impossible by construction.
// `getOpenSearchIndexPrefix()` falls back to `""`, and the packages that want a namespace of their
// own still set one (`api-sync-ddb-to-opensearch-`, `api-headless-cms-env-`), which is exactly how
// `yarn test:os` has always run locally.

// Matches `OS_ENGINE_VERSION` in `packages/project-aws/src/pulumi/apps/core/CoreOpenSearch.ts`
// (OpenSearch_3.3), so CI runs against the version users deploy.
export const OPENSEARCH_IMAGE = "opensearchproject/opensearch:3.3.2";

export const OPENSEARCH_SERVICE = {
    opensearch: {
        image: OPENSEARCH_IMAGE,
        env: {
            "discovery.type": "single-node",
            DISABLE_SECURITY_PLUGIN: "true",
            // A single-node cluster holding a few test indexes does not need more, and a smaller
            // heap starts faster.
            OPENSEARCH_JAVA_OPTS: "-Xms512m -Xmx512m"
        },
        ports: ["9200:9200"]
    }
};

/**
 * Blocks until the service container answers. Put it immediately before the test step: the
 * container boots while yarn installs, so by then it is usually already up.
 *
 * This is a step rather than a container health check because the failure is far easier to read -
 * a named step with an error message, plus a log line naming the build that answered.
 */
export const createWaitForOpenSearchStep = () => ({
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
});
