import { Page } from "~/domain/Page/index.js";

export interface ICreatePageRevisionFromRepository {
    execute: (page: Page) => Promise<void>;
}
