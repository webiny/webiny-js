import { Page } from "~/domain/Page/index.js";

export interface IDuplicatePageRepository {
    execute: (page: Page) => Promise<void>;
}
