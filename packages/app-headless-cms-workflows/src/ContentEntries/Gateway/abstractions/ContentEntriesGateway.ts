import type { ICmsEntryRevisionSimple, IGenericError } from "../../types.js";

export interface IContentEntriesGatewayResponse {
    data: ICmsEntryRevisionSimple[];
    error: IGenericError | null;
}

export interface IContentEntriesGateway {
    list(revisions: string[]): Promise<IContentEntriesGatewayResponse>;
}
