import { Page } from "~/domains/Page/index.js";

export interface IUnpublishPageRepository {
    execute: (page: Page) => Promise<void>;
}
