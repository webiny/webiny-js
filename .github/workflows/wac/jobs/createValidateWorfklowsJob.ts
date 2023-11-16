import { NormalJob } from "github-actions-wac";
import { createJob } from "./createJob";

export const createValidateWorkflowsJob = (): NormalJob => {
    return createJob({
        name: "Validate workflows",
        steps: [
            {
                name: "Validate workflow",
                run: "npx github-actions-wac validate"
            }
        ]
    });
};
