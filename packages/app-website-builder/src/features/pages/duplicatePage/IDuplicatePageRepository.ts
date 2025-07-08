import { Page } from "~/domains/Page/index.js";

export interface IDuplicatePageRepository {
    execute: (page: Page) => Promise<void>;
}
