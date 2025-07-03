import type { Page } from "~/features/pages/Page.js";

export interface IUnpublishPageRepository {
    execute: (page: Page) => Promise<void>;
}
