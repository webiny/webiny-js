export { default as InvalidFieldsError } from "./InvalidFieldsError";

export {
    Response,
    ListResponse,
    ErrorResponse,
    NotFoundResponse,
    ListErrorResponse
} from "@webiny/handler-graphql/responses";

export const emptyResolver = () => ({});
