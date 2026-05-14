import { WebinySdk } from "@webiny/app-admin/features/webinySdk/abstractions.js";
import {
    DeleteFileGateway as GatewayAbstraction,
    type DeleteFileGatewayParams
} from "./abstractions.js";

class DeleteFileGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private sdk: WebinySdk.Interface) {}

    async execute(params: DeleteFileGatewayParams): Promise<boolean> {
        const result = await this.sdk.fileManager.deleteFile({
            id: params.id
        });

        if (result.isFail()) {
            throw new Error(result.error.message);
        }

        return result.value;
    }
}

export const DeleteFileGateway = GatewayAbstraction.createImplementation({
    implementation: DeleteFileGatewayImpl,
    dependencies: [WebinySdk]
});
