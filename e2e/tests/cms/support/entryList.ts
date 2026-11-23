import type { App, Locator, Screen } from "e2e";
import type { TestModel } from "../../../support/contentModel.ts";

/**
 * Opens the model's entry list, in the folder it showed last (Home at first), and waits for its
 * footer, which shows once the entries are loaded. A row menu opened before that can be closed
 * under the pointer by the list rendering again.
 */
export const openEntryList = async (app: App, screen: Screen, model: TestModel) => {
    await app.open(`/cms/content-entries/${model.modelId}`);
    // "Showing 2 out of 2 entries." or, for one, "... 1 entry.".
    await screen.getByText(/^Showing \d+ out of \d+ entr(y|ies)\.$/).waitFor();
};

/** The list row of the entry or folder titled `title`. Titles carry the run id, so one matches. */
export const entryRow = (screen: Screen, title: string): Locator => {
    return screen.getByRole("row", title, { exact: false });
};

/** How many times a row menu is opened before giving up. */
const MENU_OPEN_ATTEMPTS = 3;

/**
 * Opens the options menu of the entry's row. Under load the list can render again just after it
 * loaded, and a menu opened in that moment closes at once, so the open is tried again, up to
 * `MENU_OPEN_ATTEMPTS` times.
 */
export const openEntryRowMenu = async (screen: Screen, title: string) => {
    const button = entryRow(screen, title).getByTestId("table.row.pb.entry.menu-action");
    for (let attempt = 1; ; attempt++) {
        await button.tap();
        try {
            await screen.getByRole("menu").waitFor({ timeout: 3_000 });
            return;
        } catch (error) {
            if (attempt === MENU_OPEN_ATTEMPTS) {
                throw error;
            }
        }
    }
};

/**
 * Picks an item of the open options menu. Each item is named twice, by its icon and its text
 * ("Move Move"), so the name is matched from its start.
 */
export const pickMenuItem = async (screen: Screen, label: string) => {
    await screen.getByRole("menuitem", new RegExp(`^${label}\\b`)).tap();
};
