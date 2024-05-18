import { CmsContentEntry } from "@webiny/app-headless-cms-common/types";

import { ITrashBinRestoreItemGateway } from "@webiny/app-trash-bin";

export class TrashBinRestoreItemGraphQLGatewayWithCallback
    implements ITrashBinRestoreItemGateway<CmsContentEntry>
{
    private readonly cb: (id: string) => Promise<void>;
    private readonly gateway: ITrashBinRestoreItemGateway<CmsContentEntry>;

    constructor(
        cb: (id: string) => Promise<any>,
        gateway: ITrashBinRestoreItemGateway<CmsContentEntry>
    ) {
        this.cb = cb;
        this.gateway = gateway;
    }

    async execute(id: string) {
        try {
            const data = await this.gateway.execute(id);
            await this.cb(id);
            return data;
        } catch (ex) {
            throw new Error(
                ex?.message || "Error while executing the callback assigned to restore useCase"
            );
        }
    }
}
