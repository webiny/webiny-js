import { IMetaRepository, ITrashBinListGateway } from "@webiny/app-trash-bin-common";
import { TrashBinListQueryVariables } from "@webiny/app-trash-bin-common/types";
import { Meta } from "@webiny/app-trash-bin-common/domain/Meta";

export class ListEntriesWithMeta implements ITrashBinListGateway<any> {
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
