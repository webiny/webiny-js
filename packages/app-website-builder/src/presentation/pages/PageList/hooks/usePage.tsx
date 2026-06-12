import { createGenericContext } from "@webiny/app";
import type { PageDto } from "~/domain/Page/index.js";

export interface PageContext {
    page: PageDto;
}

const { Provider, useHook } = createGenericContext<PageContext>("PageContext");

export const usePage = useHook;
export const PageProvider = Provider;
