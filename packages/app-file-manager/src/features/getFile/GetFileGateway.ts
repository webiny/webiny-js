import { WebinySdk } from "@webiny/app-admin/features/webinySdk/abstractions.js";
import type { FmFile } from "../shared/types.js";
import { FileFieldsProvider } from "../shared/abstractions.js";
import { GetFileGateway as GatewayAbstraction, type GetFileGatewayParams } from "./abstractions.js";

class GetFileGatewayImpl implements GatewayAbstraction.Interface {
    constructor(
        private sdk: WebinySdk.Interface,
        private fileFieldsProvider: FileFieldsProvider.Interface
    ) {}

    async execute(params: GetFileGatewayParams): Promise<FmFile> {
        const fields = await this.fileFieldsProvider.execute();
        const result = await this.sdk.fileManager.getFile({
            id: params.id,
            fields
        });

        if (result.isFail()) {
            throw new Error(result.error.message);
        }

        return result.value;
    }
}

export const GetFileGateway = GatewayAbstraction.createImplementation({
    implementation: GetFileGatewayImpl,
    dependencies: [WebinySdk, FileFieldsProvider]
});
