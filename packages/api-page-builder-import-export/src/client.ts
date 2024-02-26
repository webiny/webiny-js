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
    const { request } = context;
    const tenantId = context.tenancy.getCurrentTenant().id;

    // Invoke handler
    await context.handlerClient.invoke<TParams & any>({
        name: name,
        payload: {
            ...payload,
            httpMethod: request.method,
            headers: {
                ["x-i18n-locale"]: request.headers["x-i18n-locale"],
                ["x-tenant"]: request.headers["x-tenant"] || tenantId
            }
        },
        await: false,
        description
    });
}
