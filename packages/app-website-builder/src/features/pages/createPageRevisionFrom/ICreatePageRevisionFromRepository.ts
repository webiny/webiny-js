import { Page } from "~/domains/Page/index.js";

export interface ICreatePageRevisionFromRepository {
    execute: (page: Page) => Promise<void>;
}
