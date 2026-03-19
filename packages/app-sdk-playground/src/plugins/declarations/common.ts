// Common types shared across all SDK modules.
export const COMMON_DECLARATIONS = `
interface SdkIdentity {
    id: string;
    displayName: string;
    type: string;
}

interface SdkResult<TValue, TError = unknown> {
    isOk(): boolean;
    isFail(): boolean;
    readonly value: TValue;
    readonly error: TError;
}

declare class SdkBaseError extends Error {
    readonly code: string;
    readonly message: string;
}

declare class SdkHttpError extends SdkBaseError {
    readonly code: "HTTP_ERROR";
    readonly data: { status: number };
}

declare class SdkGraphQLError extends SdkBaseError {
    readonly code: "GRAPHQL_ERROR";
    readonly data: { code?: string };
}

declare class SdkNetworkError extends SdkBaseError {
    readonly code: "NETWORK_ERROR";
}

type SdkError = SdkHttpError | SdkGraphQLError | SdkNetworkError;
`;
