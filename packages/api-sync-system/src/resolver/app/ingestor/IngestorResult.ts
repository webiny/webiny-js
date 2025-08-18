import type { IIngestorResult, IIngestorResultAddParams, IIngestorResultItem } from "./types.js";
import type { ITable } from "~/sync/types.js";

export class IngestorResult implements IIngestorResult {
    private readonly items: Map<string, IIngestorResultItem> = new Map();

    public add(params: IIngestorResultAddParams): void {
        const { item, source } = params;
        let table: ITable;
        try {
            table = source.getTable(item.tableType);
        } catch {
            console.error(
                `Could not find table for SQS Record source: ${item.tableName} / ${item.tableType}. More info in next log line.`
            );
            console.log(JSON.stringify(item));
            return;
        }

        const command = item.command === "delete" ? "delete" : "put";

        const key = `PK:${item.PK}#SK:${item.SK}#cmd:${command}#source:${source.name}`;

        if (this.items.has(key)) {
            return;
        }

        this.items.set(key, {
            PK: item.PK,
            SK: item.SK,
            source,
            command,
            table
        });
    }

    public getItems(): IIngestorResultItem[] {
        return Array.from(this.items.values());
    }
}

export const createIngestorResult = (): IIngestorResult => {
    return new IngestorResult();
};
