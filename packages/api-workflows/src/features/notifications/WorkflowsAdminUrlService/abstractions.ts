import { createAbstraction } from "@webiny/feature/api";

export interface IWorkflowsAdminUrlService {
    /**
     * The admin app's URL without a trailing slash, e.g. `https://d1234.cloudfront.net`, or `null`
     * when service discovery has no manifest or no admin entry, or fails. Never rejects, never
     * logs.
     */
    get(): Promise<string | null>;
}

/**
 * Where the admin app lives (R195, user answer Q3): the admin CloudFront domain from service
 * discovery. E-mail links are built on it. A deployment without it sends e-mail without a link.
 */
export const WorkflowsAdminUrlService = createAbstraction<IWorkflowsAdminUrlService>(
    "WorkflowsAdminUrlService"
);

export namespace WorkflowsAdminUrlService {
    export type Interface = IWorkflowsAdminUrlService;
}
