import type { IIngestor, IIngestorIngestParams, IIngestorResult } from "./types.js";
import type { IDeployment } from "~/resolver/deployment/types.js";

export interface IIngestorParams {
    createIngestorResult: () => IIngestorResult;
    getSource: (name: string) => IDeployment | null;
}

export class Ingestor implements IIngestor {
    private readonly createIngestorResult: () => IIngestorResult;
    private readonly getSource: (name: string) => IDeployment | null;

    public constructor(params: IIngestorParams) {
        this.createIngestorResult = params.createIngestorResult;
        this.getSource = params.getSource;
    }

    public async ingest(params: IIngestorIngestParams): Promise<IIngestorResult> {
        const { records } = params;

        const result = this.createIngestorResult();

        for (const record of records) {
            const detail = record.body.detail;
            const source = this.getSource(detail.source.name);
            if (!source) {
                console.error(
                    `Could not find deployment for SQS Record source: ${detail.source.name}. More info in next log line.`
                );
                console.log(
                    JSON.stringify({
                        source: detail.source,
                        items: detail.items
                    })
                );
                continue;
            }

            for (const item of detail.items) {
                result.add({
                    item,
                    source
                });
            }
        }

        return result;
    }
}

export const createIngestor = (params: IIngestorParams): IIngestor => {
    return new Ingestor(params);
};
