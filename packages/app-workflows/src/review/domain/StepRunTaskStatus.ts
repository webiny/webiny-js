/*
 * The status of a step's background task as `getStepRun` reports it (R257). The API maps its task
 * statuses to these five (`success` becomes `done`); this is the client's mirror of that union.
 * The value object and the union share one name, as the contract names the union.
 */
export const StepRunTaskStatus = {
    Pending: "pending",
    Running: "running",
    Done: "done",
    Failed: "failed",
    Aborted: "aborted"
} as const;

export type StepRunTaskStatus = (typeof StepRunTaskStatus)[keyof typeof StepRunTaskStatus];
