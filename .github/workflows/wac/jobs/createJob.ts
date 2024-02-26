import { NormalJob } from "github-actions-wac";
import { NODE_VERSION, AWS_REGION, NODE_OPTIONS } from "../utils";

interface CreateJobParams extends Partial<NormalJob> {
    awsAuth?: boolean;
    checkout?: boolean | Record<string, any>;
    setupNode?: boolean | Record<string, any>;
}

export const createJob = (params: CreateJobParams): NormalJob => {
    const { awsAuth, checkout, setupNode, ...jobParams } = params;

    let setupNodeStep: Record<string, any> = {
        uses: "actions/setup-node@v4",
        with: { "node-version": NODE_VERSION }
    };

    if (setupNode && typeof setupNode === "object") {
        Object.assign(setupNodeStep.with, setupNode);
    }

    const job: NormalJob = {
        ...jobParams,
        "runs-on": jobParams["runs-on"] || "ubuntu-latest",
        env: { NODE_OPTIONS, YARN_ENABLE_IMMUTABLE_INSTALLS: false },
        steps: [setupNodeStep]
    };

    if (awsAuth) {
        job.permissions = {
            // Required in order for the `aws-actions/configure-aws-credentials` to work.
            // https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services#adding-permissions-settings
            "id-token": "write"
        };

        job.steps!.push({
            name: "Configure AWS Credentials",
            uses: "aws-actions/configure-aws-credentials@v4",
            with: {
                "role-to-assume": "arn:aws:iam::726952677045:role/GitHubActionsWebinyJs",
                "aws-region": AWS_REGION
            }
        });
    }

    if (checkout !== false) {
        if (typeof checkout === "object") {
            job.steps!.push({ uses: "actions/checkout@v4", with: checkout });
        } else {
            job.steps!.push({ uses: "actions/checkout@v4" });
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
