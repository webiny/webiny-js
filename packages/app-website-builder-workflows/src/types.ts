import type { SystemWorkflowValue } from "@webiny/app-workflows/review/domain/types.js";

export type WithWorkflows<T> = T & {
    workflow: SystemWorkflowValue | null;
};

declare module "@webiny/app-website-builder/types.js" {
    export interface WbPageSystem {
        workflow: SystemWorkflowValue | null;
    }
}
