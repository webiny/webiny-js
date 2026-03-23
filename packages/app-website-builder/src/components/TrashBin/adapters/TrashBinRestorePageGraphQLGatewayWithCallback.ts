import type { ITrashBinRestoreItemGateway } from "@webiny/app-trash-bin";
import type { PageGatewayDto } from "~/features/pages/getPage/PageGatewayDto.js";

export class TrashBinRestorePageGraphQLGatewayWithCallback
    implements ITrashBinRestoreItemGateway<PageGatewayDto>
{
    private readonly cb: (id: string) => Promise<void>;
    private readonly gateway: ITrashBinRestoreItemGateway<PageGatewayDto>;

    constructor(
        cb: (id: string) => Promise<any>,
        gateway: ITrashBinRestoreItemGateway<PageGatewayDto>
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
