import { WebinySdk } from "@webiny/app-admin/features/webinySdk/abstractions.js";
import type { FmTagsListWhereInput } from "@webiny/sdk";
import {
    ListTagsGateway as GatewayAbstraction,
    type ListTagsGatewayParams,
    type ListTagsGatewayResult
} from "./abstractions.js";

class ListTagsGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private sdk: WebinySdk.Interface) {}

    async execute(params: ListTagsGatewayParams): Promise<ListTagsGatewayResult> {
        const result = await this.sdk.fileManager.listTags({
            where: params.where as FmTagsListWhereInput | undefined
        });

        if (result.isFail()) {
            throw new Error(result.error.message);
        }

        return result.value;
    }
}

export const ListTagsGateway = GatewayAbstraction.createImplementation({
    implementation: ListTagsGatewayImpl,
    dependencies: [WebinySdk]
});
