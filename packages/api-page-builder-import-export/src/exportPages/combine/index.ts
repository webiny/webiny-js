import { PbImportExportContext } from "~/types";
import { SecurityIdentity } from "@webiny/api-security/types";
import { createRawEventHandler } from "@webiny/handler-aws";
import { blocksHandler } from "~/exportPages/combine/blocksHandler";
import { pagesHandler } from "~/exportPages/combine/pagesHandler";

export interface Payload {
    taskId: string;
    type: string;
    identity: SecurityIdentity;
}

export interface Response {
    data: string | null;
    error: Partial<Error> | null;
}

/**
 * Handles the export pages combine workflow.
 */
export default () => {
    return createRawEventHandler<Payload, PbImportExportContext, Response>(
        async ({ payload, context }) => {
            if (payload.type === "block") {
                return await blocksHandler(payload, context);
            } else {
                return await pagesHandler(payload, context);
            }
        }
    );
};
