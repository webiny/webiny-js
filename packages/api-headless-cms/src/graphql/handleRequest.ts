import { ApiEndpoint, CmsContext } from "~/types";
import { checkEndpointAccess } from "./checkEndpointAccess";
import { createRequestBody } from "./createRequestBody";
import { formatErrorPayload } from "./formatErrorPayload";
import { getSchema } from "./getSchema";
import { Reply, Request } from "@webiny/handler/types";
import { processRequestBody } from "@webiny/handler-graphql";
import { ExecutionResult } from "graphql";

export interface HandleRequestParams {
    context: CmsContext;
    request: Request;
    reply: Reply;
}

export interface HandleRequest {
    (params: HandleRequestParams): Promise<Reply>;
}

export const handleRequest: HandleRequest = async params => {
    const { context, request, reply } = params;
    try {
        await checkEndpointAccess(context);
    } catch (ex) {
        return reply.code(401).send({
            data: null,
            error: {
                message: ex.message || "Not authorized!",
                code: ex.code || "SECURITY_NOT_AUTHORIZED",
                data: ex.data || null,
                stack: null
            }
        });
    }

    const getTenant = () => {
        return context.tenancy.getCurrentTenant();
    };

    const getLocale = () => {
        return context.cms.getLocale();
    };

    const schema = await context.benchmark.measure("headlessCms.graphql.getSchema", async () => {
        try {
            return await getSchema({
                context,
                getTenant,
                getLocale,
                type: context.cms.type as ApiEndpoint
            });
        } catch (ex) {
            console.error(`Error while generating the schema.`);
            console.error(formatErrorPayload(ex));
            throw ex;
        }
    });

    const body = await context.benchmark.measure(
        "headlessCms.graphql.createRequestBody",
        async () => {
            try {
                return createRequestBody(request.body);
            } catch (ex) {
                console.error(`Error while creating the body request.`);
                console.error(formatErrorPayload(ex));
                throw ex;
            }
        }
    );

    /**
     * We need to store the processRequestBody result in a variable and output it after the measurement.
     * Otherwise, the measurement will not be shown in the output.
     */
    let result: ExecutionResult[] | ExecutionResult | null = null;

    await context.benchmark.measure("headlessCms.graphql.processRequestBody", async () => {
        try {
            result = await processRequestBody(body, schema, context);
        } catch (ex) {
            console.error(`Error while processing the body request.`);
            console.error(formatErrorPayload(ex));
            throw ex;
        }
    });

    return reply.code(200).send(result);
};
