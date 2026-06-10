import { WebinySdk } from "@webiny/app-admin/features/webinySdk/abstractions.js";
import type { FmFileListWhereInput } from "@webiny/sdk";
import { FmFileListSorter } from "@webiny/sdk";
import { FileFieldsProvider } from "../shared/abstractions.js";
import {
    ListFilesGateway as GatewayAbstraction,
    type ListFilesGatewayParams,
    type ListFilesGatewayResult
} from "./abstractions.js";

class ListFilesGatewayImpl implements GatewayAbstraction.Interface {
    constructor(
        private sdk: WebinySdk.Interface,
        private fileFieldsProvider: FileFieldsProvider.Interface
    ) {}

    async execute(params: ListFilesGatewayParams): Promise<ListFilesGatewayResult> {
        const fields = await this.fileFieldsProvider.execute();
        const result = await this.sdk.fileManager.listFiles({
            search: params.search,
            where: params.where as FmFileListWhereInput | undefined,
            sort: params.sort as FmFileListSorter[] | undefined,
            limit: params.limit,
            after: params.after,
            fields
        });

        if (result.isFail()) {
            throw new Error(result.error.message);
        }

        return {
            data: result.value.data,
            meta: result.value.meta
        };
    }
}

export const ListFilesGateway = GatewayAbstraction.createImplementation({
    implementation: ListFilesGatewayImpl,
    dependencies: [WebinySdk, FileFieldsProvider]
});
