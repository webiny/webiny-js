import type { IStoreItem, IStorer } from "../storer/types";
import type { ITable } from "~/sync/types";
import type { IDeployment } from "~/resolver/deployment/types.js";
import type { IBundle } from "~/resolver/app/bundler/types.js";

export interface IPutCommandHandlerHandleParams {
    items: IStoreItem[];
    bundle: IBundle;
    targetDeployment: IDeployment;
    targetTable: ITable;
}

export interface IPutCommandHandlerParams {
    storer: IStorer;
}

export class PutCommandHandler {
    private readonly storer: IStorer;

    public constructor(params: IPutCommandHandlerParams) {
        this.storer = params.storer;
    }

    public async handle(params: IPutCommandHandlerHandleParams): Promise<void> {
        const { items, targetDeployment, targetTable, bundle } = params;

        const result = items.filter(item => {
            return !!item.PK && !!item.SK;
        });

        await this.storer.store({
            command: "put",
            deployment: targetDeployment,
            table: targetTable,
            items: result,
            bundle
        });
    }
}
