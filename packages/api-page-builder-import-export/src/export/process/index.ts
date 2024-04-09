import { PbImportExportContext } from "~/types";
import { SecurityIdentity } from "@webiny/api-security/types";
import { createRawEventHandler } from "@webiny/handler-aws";
import { blocksHandler } from "~/export/process/blocksHandler";
import { formsHandler } from "~/export/process/formsHandler";
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
            return context.security.withoutAuthorization(() => {
                switch (payload.type) {
                    case "block": {
                        return blocksHandler(configuration, payload, context);
                    }
                    case "form": {
                        return formsHandler(configuration, payload, context);
                    }
                    case "template": {
                        return templatesHandler(configuration, payload, context);
                    }
                    default: {
                        console.log("Export PB process", JSON.stringify(payload));
                        throw new Error("Invalid type provided: pb process.");
                    }
                }
            });
        }
    );
};
