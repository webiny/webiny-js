export {
    resolveGet,
    resolveList,
    resolveCreate,
    resolveUpdate,
    resolveDelete
} from "./crudResolvers";

export { resolveUpdateSettings, resolveGetSettings } from "./settingsResolvers";

export {
    Response,
    ListResponse,
    ErrorResponse,
    NotFoundResponse,
    ListErrorResponse
} from "@webiny/api/graphql/responses";

export const emptyResolver = () => ({});
