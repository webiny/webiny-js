export interface ICodedError {
    message: string;
    code: string;
    data?: unknown;
}

/**
 * The body of an error response for an error that carries a code. The Admin reads `code` from it to
 * recognize, for example, an `Authentication/` error, so every transport builds the body here.
 */
export function codedErrorBody(error: ICodedError): Required<ICodedError> {
    return {
        message: error.message,
        code: error.code,
        data: error.data ?? null
    };
}
