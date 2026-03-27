import type { Page } from "~/domain/Page/index.js";

export interface IDeletePageRepository {
    execute: (page: Page, permanently: boolean) => Promise<void>;
}
