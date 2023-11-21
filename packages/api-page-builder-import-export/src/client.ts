import { PbImportExportContext } from "~/graphql/types";

export interface InvokeHandlerClientParams<TParams> {
    context: PbImportExportContext;
    name: string;
    payload: TParams;
    description: string;
}

export async function invokeHandlerClient<TParams>({
    context,
    name,
    payload,
    description
}: InvokeHandlerClientParams<TParams>) {
    /*
     * Prepare "invocationArgs", we're hacking our wat here.
     * They are necessary to setup the "context.pageBuilder" object among other things in IMPORT_PAGE_FUNCTION
     */
    const { request } = context;

    const tenantId = context.tenancy.getCurrentTenant().id;

    const headers = {
        ...request.headers,
        ["x-tenant"]: request.headers["x-tenant"] || tenantId
    };
    delete headers["content-length"];
    const invocationArgs = {
        httpMethod: request.method,
        body: request.body,
        headers,
        /**
         * Required until type augmentation works correctly.
         */
        cookies: (request as any).cookies
    };
    // Invoke handler
    await context.handlerClient.invoke<TParams & any>({
        name: name,
        payload: {
            ...payload,
            ...invocationArgs
        },
        await: false,
        description
    });
}
