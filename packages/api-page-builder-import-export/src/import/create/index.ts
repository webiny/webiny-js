import { ImportExportTask, PbImportExportContext } from "~/types";
import { SecurityIdentity } from "@webiny/api-security/types";
import { createRawEventHandler } from "@webiny/handler-aws";
import { blocksHandler } from "~/import/create/blocksHandler";
import { formsHandler } from "~/import/create/formsHandler";
import { pagesHandler } from "~/import/create/pagesHandler";
import { templatesHandler } from "~/import/create/templatesHandler";

export interface Configuration {
    handlers: {
        process: string;
    };
}

export interface Payload {
    category?: string;
    zipFileUrl: string;
    task: ImportExportTask;
    type: string;
    identity: SecurityIdentity;
    meta?: Record<string, any>;
}
export interface Response {
    data: string | null;
    error: Partial<Error> | null;
}

/**
 * Handles the import page workflow.
 */
export default (configuration: Configuration) => {
    return createRawEventHandler<Payload, PbImportExportContext, Response>(
        async ({ payload, context }) => {
            switch (payload.type) {
                case "block": {
                    return await blocksHandler(configuration, payload, context);
                }
                case "form": {
                    return await formsHandler(configuration, payload, context);
                }
                case "template": {
                    return await templatesHandler(configuration, payload, context);
                }
                default: {
                    return await pagesHandler(configuration, payload, context);
                }
            }
        }
    );
};
