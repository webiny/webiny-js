import { ImportExportTask, PbImportExportContext } from "~/types";
import { SecurityIdentity } from "@webiny/api-security/types";
import { createRawEventHandler } from "@webiny/handler-aws";
import { blocksHandler } from "~/import/create/blocksHandler";
import { pagesHandler } from "~/import/create/pagesHandler";

export interface Configuration {
    handlers: {
        process: string;
    };
}

export interface Payload {
    category: string;
    zipFileUrl: string;
    task: ImportExportTask;
    type: string;
    identity: SecurityIdentity;
    folderId?: string;
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
            if (payload.type === "block") {
                return await blocksHandler(configuration, payload, context);
            } else {
                return await pagesHandler(configuration, payload, context);
            }
        }
    );
};
