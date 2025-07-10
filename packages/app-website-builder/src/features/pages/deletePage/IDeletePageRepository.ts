import { Page } from "~/domain/Page/index.js";

export interface IDeletePageRepository {
    execute: (page: Page) => Promise<void>;
}
