import { WebinySdk } from "@webiny/app-admin/features/webinySdk/abstractions.js";
import type { FmFile } from "../shared/types.js";
import {
    UpdateFileGateway as GatewayAbstraction,
    type UpdateFileGatewayParams
} from "./abstractions.js";

class UpdateFileGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private sdk: WebinySdk.Interface) {}

    async execute(params: UpdateFileGatewayParams): Promise<FmFile> {
        const result = await this.sdk.fileManager.updateFile({
            id: params.id,
            data: params.data,
            fields: params.fields
        });

        if (result.isFail()) {
            throw new Error(result.error.message);
        }

        return result.value;
    }
}

export const UpdateFileGateway = GatewayAbstraction.createImplementation({
    implementation: UpdateFileGatewayImpl,
    dependencies: [WebinySdk]
});
