import type { AttributeDefinitions } from "~/toolbox.js";
import { createEntity, type EntityConstructor } from "~/utils/entity/index.js";
import type { GenericRecord } from "@webiny/api/types.js";

export type IGlobalEntityAttributes<T = undefined> = {
    PK: string;
    SK: string;
    TYPE: string;
    GSI1_PK?: string;
    GSI1_SK?: string;
    GSI2_PK?: string;
    GSI2_SK?: string;
    expiresAt?: string | null;
} & (T extends undefined ? { data?: undefined } : { data: T });

export const globalEntityAttributes: AttributeDefinitions = {
    PK: {
        partitionKey: true
    },
    SK: {
        sortKey: true
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
        type: "string",
        required: true
    },
    data: {
        type: "map"
    },
    expiresAt: {
        type: "number"
    }
};

export const createGlobalEntity = <T extends GenericRecord = GenericRecord>(
    params: Omit<EntityConstructor, "attributes"> & Partial<Pick<EntityConstructor, "attributes">>
) => {
    return createEntity<IGlobalEntityAttributes<T>>({
        ...params,
        attributes: {
            ...globalEntityAttributes,
            ...params.attributes
        }
    });
};

export type IStandardEntityAttributes<T = undefined> = {
    PK: string;
    SK: string;
    GSI_TENANT: string;
    TYPE: string;
    GSI1_PK?: string;
    GSI1_SK?: string;
    GSI2_PK?: string;
    GSI2_SK?: string;
    expiresAt?: number | null;
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
        type: "string",
        required: true
    },
    data: {
        type: "map"
    },
    expiresAt: {
        type: "number"
    }
};

export const createStandardEntity = <T extends GenericRecord = GenericRecord>(
    params: Omit<EntityConstructor, "attributes"> & Partial<Pick<EntityConstructor, "attributes">>
) => {
    return createEntity<IStandardEntityAttributes<T>>({
        ...params,
        attributes: {
            ...standardEntityAttributes,
            ...params.attributes
        }
    });
};
