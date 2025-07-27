import type { IStoreItem, IStorer } from "../storer/types";
import type { IDeployment } from "~/resolver/deployment/types.js";
import type { ITable } from "~/sync/types.js";
import type { IBundle } from "~/resolver/app/bundler/types.js";

export interface IDeleteCommandHandlerHandleParams {
    targetDeployment: IDeployment;
    targetTable: ITable;
    items: IStoreItem[];
    bundle: IBundle;
}

export interface IDeleteCommandHandlerParams {
    storer: IStorer;
}

export class DeleteCommandHandler {
    private readonly storer: IStorer;

    public constructor(params: IDeleteCommandHandlerParams) {
        this.storer = params.storer;
    }
    public async handle(params: IDeleteCommandHandlerHandleParams): Promise<void> {
        const { targetDeployment, targetTable, bundle } = params;
        const result = bundle.items
            .map(item => {
                if (!item.PK || !item.SK) {
                    return null;
                }
                return {
                    PK: item.PK,
                    SK: item.SK
                };
            })
            .filter((item): item is IStoreItem => {
                return !!item;
            });

        await this.storer.store({
            command: "delete",
            deployment: targetDeployment,
            table: targetTable,
            items: result,
            bundle
        });
    }
}
