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
    await context.handlerClient.invoke<TParams & any>({
        name: name,
        payload,
        await: false,
        description
    });
}
