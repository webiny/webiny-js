import type { GenericRecord } from "@webiny/app/types.js";

export interface IGenericError {
    message: string;
    code: string;
    data?: GenericRecord
    stack?: string;
}

export interface ICmsEntryRevisionSimple {
    id: string;
    wbyAco_location: {
        folderId: string;
    }
}
