import { createGenericContext } from "@webiny/app";

export interface PageEditorDrawerContext {
    isRevisionListOpen: boolean;
    openRevisionList: (open: boolean) => void;
}

const { Provider, useHook } =
    createGenericContext<PageEditorDrawerContext>("PageEditorDrawerContext");

export const usePageEditorDrawer = useHook;
export const PageEditorDrawerProvider = Provider;
