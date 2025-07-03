import type { Page } from "~/features/pages/Page.js";

export interface IDuplicatePageRepository {
    execute: (page: Page) => Promise<void>;
}
