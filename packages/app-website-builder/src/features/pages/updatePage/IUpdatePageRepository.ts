import type { Page } from "~/features/pages/Page.js";

export interface IUpdatePageRepository {
    execute: (page: Page) => Promise<void>;
}
