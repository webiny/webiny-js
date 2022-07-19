import { PluginCollection } from "@webiny/plugins/types";
import { createHandler as createDefaultHandler } from "@webiny/handler";
// import createHttpHandler from "@webiny/handler-http";
// import createArgsHandler from "@webiny/handler-args";
import { createFastifyHandler, CreateFastifyHandlerParams } from "./handler";

interface CreateAwsHandlerOptions extends CreateFastifyHandlerParams {
    plugins: PluginCollection;
}

interface FastifyHandlerFactory {
    (params: CreateAwsHandlerOptions): Function;
}

export const createHandler: FastifyHandlerFactory = params => {
    return createDefaultHandler([
        // createArgsHandler(),
        // createHttpHandler(),
        createFastifyHandler(params),
        ...params.plugins
    ]);
};

export * from "~/plugins/RoutePlugin";
