import { createJob } from "./createJob";

export const createValidateWorkflowsJob = () => createJob({
    name: "Validate workflows",
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
});
