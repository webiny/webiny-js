import type {
    IResolverApplication,
    IResolverApplicationResolveParams
} from "./abstractions/ResolverApplication.js";
import { createRecordsValidation } from "./RecordsValidation.js";
import { convertException } from "@webiny/utils";
import type { IRecordHandler } from "./abstractions/RecordHandler.js";
import type { IDeployments } from "~/resolver/deployment/types.js";
import { createIngestor } from "./ingestor/Ingestor.js";
import { createIngestorResult } from "~/resolver/app/ingestor/IngestorResult.js";

export interface IResolverApplicationParams {
    recordHandler: IRecordHandler;
    deployments: IDeployments;
}

export class ResolverApplication implements IResolverApplication {
    private readonly recordHandler: IRecordHandler;
    private readonly deployments: IDeployments;

    public constructor(params: IResolverApplicationParams) {
        this.recordHandler = params.recordHandler;
        this.deployments = params.deployments;
    }

    public async resolve(params: IResolverApplicationResolveParams): Promise<void> {
        const validation = createRecordsValidation();

        const result = await validation.validate(params.records);
        if (result.error) {
            throw result.error;
        }

        const ingestor = createIngestor({
            createIngestorResult: () => {
                return createIngestorResult();
            },
            getSource: name => {
                return this.deployments.get(name);
            }
        });

        const data = await ingestor.ingest({
            records: result.records
        });

        try {
            await this.recordHandler.handle({
                data
            });
        } catch (ex) {
            console.error(convertException(ex));
        }
    }
}

export const createResolverApp = (params: IResolverApplicationParams): IResolverApplication => {
    return new ResolverApplication(params);
};
