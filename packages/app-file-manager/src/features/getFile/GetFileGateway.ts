import { WebinySdk } from "@webiny/app-admin/features/webinySdk/abstractions.js";
import type { FmFile } from "../shared/types.js";
import { GetFileGateway as GatewayAbstraction, type GetFileGatewayParams } from "./abstractions.js";
import { FILE_FIELDS } from "~/features/shared/FILE_FIELDS.js";

class GetFileGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private sdk: WebinySdk.Interface) {}

    async execute(params: GetFileGatewayParams): Promise<FmFile> {
        const result = await this.sdk.fileManager.getFile({
            id: params.id,
            fields: FILE_FIELDS
        });

        if (result.isFail()) {
            throw new Error(result.error.message);
        }

        return result.value;
    }
}

export const GetFileGateway = GatewayAbstraction.createImplementation({
    implementation: GetFileGatewayImpl,
    dependencies: [WebinySdk]
});
