import { PbImportExportContext } from "~/types";
import { SecurityIdentity } from "@webiny/api-security/types";
import { createRawEventHandler } from "@webiny/handler-aws";
import { blocksHandler } from "~/export/process/blocksHandler";
import { pagesHandler } from "~/export/process/pagesHandler";
import { templatesHandler } from "~/export/process/templatesHandler";

export interface Configuration {
    handlers: {
        process: string;
        combine: string;
    };
}

export interface Payload {
    taskId: string;
    subTaskIndex: number;
    type: string;
    identity?: SecurityIdentity;
}

export interface Response {
    data: string | null;
    error: Partial<Error> | null;
}

export default (configuration: Configuration) => {
    return createRawEventHandler<Payload, PbImportExportContext, Response>(
        async ({ payload, context }) => {
            switch (payload.type) {
                case "block": {
                    return await blocksHandler(configuration, payload, context);
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
