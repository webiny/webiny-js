import type { Page } from "~/features/pages/Page.js";

export interface IDeletePageRepository {
    execute: (folder: Page) => Promise<void>;
}
