import { Page } from "~/domains/Page/index.js";

export interface ICreatePageRepository {
    execute: (page: Page) => Promise<void>;
}
