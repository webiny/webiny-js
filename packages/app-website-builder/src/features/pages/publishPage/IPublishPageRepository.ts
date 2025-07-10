import { Page } from "~/domain/Page/index.js";

export interface IPublishPageRepository {
    execute: (page: Page) => Promise<void>;
}
