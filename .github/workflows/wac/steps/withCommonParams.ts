import { NormalJob } from "github-actions-wac";

export const withCommonParams = (
    steps: NonNullable<NormalJob["steps"]>,
    commonParams: Record<string, any>
) => steps.map(step => ({ ...step, ...commonParams }));
