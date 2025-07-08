import { Page } from "~/domains/Page/index.js";

export interface IDeletePageRepository {
    execute: (page: Page) => Promise<void>;
}
