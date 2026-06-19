import { createAbstraction } from "@webiny/feature/exports/api.js";
import type { OpenSearchField } from "./OpenSearchField.js";

export interface IOpenSearchFieldFactory {
    create(params: OpenSearchField.Params): OpenSearchField.Interface;
}

export const OpenSearchFieldFactory =
    createAbstraction<IOpenSearchFieldFactory>("OpenSearch/FieldFactory");

export namespace OpenSearchFieldFactory {
    export type Interface = IOpenSearchFieldFactory;
}
