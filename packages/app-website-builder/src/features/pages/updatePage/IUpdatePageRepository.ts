import { Page } from "~/domain/Page/index.js";

export interface IUpdatePageRepository {
    execute: (page: Page) => Promise<void>;
}
