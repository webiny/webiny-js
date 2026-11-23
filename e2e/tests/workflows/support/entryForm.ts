import type { Browser } from "@e2e-dev/web";
import type { App, Locator } from "e2e";
import type { TestModel } from "../../../support/contentModel.ts";
import type { TestEntry } from "../../../support/entry.ts";

/** Opens the entry revision in the Headless CMS entry form. */
export const openEntryForm = async (app: App, model: TestModel, entry: TestEntry) => {
    await app.open(`/cms/content-entries/${model.modelId}?id=${encodeURIComponent(entry.id)}`);
};

/** The review bar of the open entry form: state, message, actions and progress. */
export const reviewBar = (browser: Browser): Locator => {
    return browser.locator('[data-role="review-bar"]');
};
