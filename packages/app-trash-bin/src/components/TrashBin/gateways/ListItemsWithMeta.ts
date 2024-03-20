import { ITrashBinListGateway } from "@webiny/app-trash-bin-common";
import { IMetaRepository, Meta } from "@webiny/app-utilities";
import { TrashBinListQueryVariables } from "@webiny/app-trash-bin-common/types";

export class ListItemsWithMeta implements ITrashBinListGateway<any> {
    private metaRepository: IMetaRepository;
    private listGateway: ITrashBinListGateway<any>;

    constructor(metaRepository: IMetaRepository, listGateway: ITrashBinListGateway<any>) {
        this.metaRepository = metaRepository;
        this.listGateway = listGateway;
    }

    async execute(params: TrashBinListQueryVariables) {
        const response = await this.listGateway.execute(params);
        const [, meta] = response;
        await this.metaRepository.set(Meta.create(meta));
        return response;
    }
}
