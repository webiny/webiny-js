import { Page } from "../Page";

export interface ICreatePageRepository {
    execute: (page: Page) => Promise<void>;
}
