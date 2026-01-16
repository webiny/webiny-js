import type { GenericRecord } from "@webiny/api/types.js";

export interface IGraphQLErrorResponse {
    error: {
        message: string;
        code: string;
        data?: GenericRecord;
        stack?: string;
    };
}

export const ERROR_FIELDS = /* GraphQL */ `
    {
        message
        code
        data
        stack
    }
`;
