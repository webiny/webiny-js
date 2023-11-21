import { NormalJob } from "github-actions-wac";

export const createValidateWorkflowsJob = (): NormalJob => {
    return {
        name: "Validate workflows",
        "runs-on": "ubuntu-latest",
        steps: [
            {
                name: "Install dependencies",
                run: "yarn --immutable"
            },
            {
                name: "Validate",
                run: "npx github-actions-wac validate"
            }
        ]
    };
};
