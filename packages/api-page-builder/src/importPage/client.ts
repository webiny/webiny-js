import { PbContext } from "~/graphql/types";

export interface InvokeHandlerClientParams {
    context: PbContext;
    name: string;
    payload: Record<string, any>;
}

export async function invokeHandlerClient({ context, name, payload }: InvokeHandlerClientParams) {
    /*
     * Prepare "invocationArgs", we're hacking our wat here.
     * They are necessary to setup the "context.pageBuilder" object among other things in IMPORT_PAGE_FUNCTION
     */
    const { request } = context.http;
    const invocationArgs = {
        httpMethod: request.method,
        body: request.body,
        headers: request.headers,
        cookies: request.cookies
    };
    // TODO: Maybe use a dedicated object? Something similar that we have for "prerenderingServiceClient".
    // Invoke handler
    await context.handlerClient.invoke({
        name: name,
        payload: {
            ...payload,
            ...invocationArgs
        },
        await: false
    });
}
