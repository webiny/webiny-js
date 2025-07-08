import { Page } from "~/domains/Page/index.js";

export interface IPublishPageRepository {
    execute: (page: Page) => Promise<void>;
}
