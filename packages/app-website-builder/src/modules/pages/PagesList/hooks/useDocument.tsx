import type { DocumentDto } from "~/modules/pages/PagesList/presenters/index.js";
import { createGenericContext } from "@webiny/app";

export interface DocumentContext {
    document: DocumentDto;
}

const { Provider, useHook } = createGenericContext<DocumentContext>("DocumentContext");

export const useDocument = useHook;
export const DocumentProvider = Provider;
