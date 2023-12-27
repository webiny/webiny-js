import { CmsReferenceContentEntry } from "./entries.types";

export interface EntriesGatewayInterface {
    list: (modelIds: string[], query: string) => Promise<CmsReferenceContentEntry[]>;
    get: (modelId: string, id: string) => Promise<CmsReferenceContentEntry>;
}
