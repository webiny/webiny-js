import { CommandBundle } from "~/resolver/app/bundler/CommandBundle";
import { createMockDeployment } from "~tests/mocks/deployments.js";
import { createRegularMockTable } from "~tests/mocks/table.js";
import type { IBaseBundleParams } from "~/resolver/app/bundler/BaseBundle.js";
import { IIngestorResultItem } from "~/resolver/app/ingestor/types.js";

export interface ICreateMockBundleParams
    extends Partial<Pick<IBaseBundleParams, "source" | "table">> {
    items: IIngestorResultItem[];
}

export const createMockCommandPutBundle = (params: ICreateMockBundleParams) => {
    return new CommandBundle({
        command: "put",
        source: params?.source || createMockDeployment(),
        table: params?.table || createRegularMockTable()
    });
};

export const createMockCommandDeleteBundle = (params: ICreateMockBundleParams) => {
    return new CommandBundle({
        command: "delete",
        source: params?.source || createMockDeployment(),
        table: params?.table || createRegularMockTable()
    });
};
