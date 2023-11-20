import { Context as BaseContext } from "@webiny/handler/types";

export interface Book {
    name: string;
}
export interface Context extends BaseContext {
    getBooks: () => Promise<Book[]>;
}
