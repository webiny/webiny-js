import type { Page } from "~/features/pages/Page.js";

export interface ICreatePageRevisionFromRepository {
    execute: (page: Page) => Promise<void>;
}
