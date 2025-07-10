import { Page } from "~/domain/Page/index.js";

export interface IUnpublishPageRepository {
    execute: (page: Page) => Promise<void>;
}
