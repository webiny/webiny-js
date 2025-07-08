import { Page } from "~/domains/Page/index.js";

export interface IUpdatePageRepository {
    execute: (page: Page) => Promise<void>;
}
