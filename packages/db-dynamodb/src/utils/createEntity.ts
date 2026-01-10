import type { AttributeDefinitions, Table } from "~/toolbox.js";
import { Entity } from "~/toolbox.js";

export interface ICreateStandardEntityParams {
    table: Table<string, string, string>;
    name: string;
    attributes?: AttributeDefinitions;
}

export type IStandardEntityAttributes<T = undefined> = {
    PK: string;
    SK: string;
    GSI_TENANT: string;
    GSI1_PK?: string;
    GSI1_SK?: string;
    GSI2_PK?: string;
    GSI2_SK?: string;
    expiresAt?: string | null;
} & (T extends undefined ? { data?: undefined } : { data: T });

export const standardEntityAttributes: AttributeDefinitions = {
    PK: {
        partitionKey: true
    },
    SK: {
        sortKey: true
    },
    GSI_TENANT: {
        type: "string",
        required: true
    },
    GSI1_PK: {
        type: "string"
    },
    GSI1_SK: {
        type: "string"
    },
    GSI2_PK: {
        type: "string"
    },
    GSI2_SK: {
        type: "string"
    },
    TYPE: {
        type: "string"
    },
    data: {
        type: "map"
        // TODO make required after all storage ops are updated to store in data
        //required: true
    }
};

export const createStandardEntity = (params: ICreateStandardEntityParams): Entity<any> => {
    const { name, table, attributes = {} } = params;
    return new Entity({
        name,
        table,
        attributes: {
            ...standardEntityAttributes,
            ...attributes
        }
    });
};

interface CreateLegacyEntityParams {
    table: Table<string, string, string>;
    name: string;
    attributes?: AttributeDefinitions;
}

export const createLegacyEntity = (params: CreateLegacyEntityParams) => {
    return new Entity({
        table: params.table,
        name: params.name,
        attributes: {
            PK: {
                partitionKey: true
            },
            SK: {
                sortKey: true
            },
            GSI_TENANT: {
                type: "string"
            },
            GSI1_PK: {
                type: "string"
            },
            GSI1_SK: {
                type: "string"
            },
            GSI2_PK: {
                type: "string"
            },
            GSI2_SK: {
                type: "string"
            },
            TYPE: {
                type: "string"
            },
            ...(params.attributes || {})
        }
    });
};
