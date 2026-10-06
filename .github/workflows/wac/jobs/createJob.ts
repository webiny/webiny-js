import { NormalJob } from "github-actions-wac";
import { ACTION, AWS_REGION, NODE_OPTIONS, NODE_VERSION } from "../utils/index.js";

interface CreateJobParams extends Partial<NormalJob> {
    awsAuth?: boolean;
    checkout?: boolean | Record<string, any>;
    setupNode?: boolean | Record<string, any>;
}

export const createJob = (params: CreateJobParams): NormalJob => {
    const { awsAuth, checkout, setupNode, ...jobParams } = params;

    let setupNodeStep: Record<string, any> = {
        uses: ACTION.setupNode,
        with: { "node-version": NODE_VERSION }
    };

    if (setupNode && typeof setupNode === "object") {
        Object.assign(setupNodeStep.with, setupNode);
    }

    // Set token permissions EXPLICITLY so caching works regardless of the repo/org default
    // "Workflow permissions" setting (which can be flipped to read-only, e.g. during a
    // security lockdown). Declaring a permissions block resets every unlisted scope to
    // `none`, so we enumerate what jobs need:
    //   - `contents: read`  -> actions/checkout
    //   - `actions: write`  -> actions/cache SAVE (otherwise "cache write denied: token has
    //                          no writable scopes")
    // `awsAuth` adds `id-token: write` for AWS OIDC. A job can grant additional scopes via its
    // own `permissions` (e.g. the /command comment job needs pull-requests/issues write);
    // those are merged in last so callers can extend this baseline.
    //
    // Security: granting write here doesn't open anything to outsiders. The `checkCommandStep`
    // write/admin gate + the universal `needs: checkComment` dependency mean non-collaborators'
    // `/e2e` (etc.) skips all jobs - these scopes only apply when a real collaborator triggers a
    // command. The pre-existing pwn-request risk on fork PRs (a maintainer running `/e2e` runs
    // the PR's untrusted code with secrets) is unchanged by this; a same-repo/label safeguard
    // could be added separately.
    const permissions: Record<string, string> = {
        contents: "read",
        actions: "write"
    };

    if (awsAuth) {
        permissions["id-token"] = "write";
    }

    if (jobParams.permissions) {
        Object.assign(permissions, jobParams.permissions);
    }

    const job: NormalJob = {
        ...jobParams,
        "runs-on": jobParams["runs-on"] || "ubuntu-latest",
        env: { NODE_OPTIONS, YARN_ENABLE_IMMUTABLE_INSTALLS: false },
        steps: [setupNodeStep],
        permissions
    };

    if (awsAuth) {
        job.steps!.push({
            name: "Configure AWS Credentials",
            uses: ACTION.configureAwsCredentials,
            with: {
                "role-to-assume": "arn:aws:iam::726952677045:role/GitHubActionsWebinyJs",
                "aws-region": AWS_REGION
            }
        });
    }

    if (checkout !== false) {
        if (typeof checkout === "object") {
            job.steps!.push({ uses: ACTION.checkout, with: checkout });
        } else {
            job.steps!.push({ uses: ACTION.checkout });
        }
    }

    if (jobParams.steps) {
        job.steps!.push(...jobParams.steps);
    }

    if (jobParams.env) {
        Object.assign(job.env!, jobParams.env);
    }

    return job;
};
