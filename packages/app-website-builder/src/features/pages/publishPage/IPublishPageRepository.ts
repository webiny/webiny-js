import type { Page } from "~/features/pages/Page.js";

export interface IPublishPageRepository {
    execute: (page: Page) => Promise<void>;
}
