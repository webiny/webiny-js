import { PbImportExportContext } from "~/types";
import { SecurityIdentity } from "@webiny/api-security/types";
import { createRawEventHandler } from "@webiny/handler-aws";
import { blocksHandler } from "~/export/combine/blocksHandler";
import { formsHandler } from "~/export/combine/formsHandler";
import { pagesHandler } from "~/export/combine/pagesHandler";
import { templatesHandler } from "~/export/combine/templatesHandler";

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
            switch (payload.type) {
                case "block": {
                    return await blocksHandler(payload, context);
                }
                case "form": {
                    return await formsHandler(payload, context);
                }
                case "template": {
                    return await templatesHandler(payload, context);
                }
                default: {
                    return await pagesHandler(payload, context);
                }
            }
        }
    );
};
