import { PbImportExportContext } from "~/types";
import { SecurityIdentity } from "@webiny/api-security/types";
import { createRawEventHandler } from "@webiny/handler-aws";
import { blocksHandler } from "~/export/combine/blocksHandler";
import { formsHandler } from "~/export/combine/formsHandler";
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
            return context.security.withoutAuthorization(() => {
                switch (payload.type) {
                    case "block": {
                        return blocksHandler(payload, context);
                    }
                    case "form": {
                        return formsHandler(payload, context);
                    }
                    case "template": {
                        return templatesHandler(payload, context);
                    }
                    default: {
                        console.log("Export PB combine", JSON.stringify(payload));
                        throw new Error("Invalid type provided: pb combine.");
                    }
                }
            });
        }
    );
};
