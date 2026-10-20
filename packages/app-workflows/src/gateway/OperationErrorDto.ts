/*
 * The `error` part of a GraphQL `{ data, error }` envelope, as every area gateway receives it.
 */
export interface OperationErrorDto {
    code: string | null;
    message: string | null;
    data: unknown;
}
