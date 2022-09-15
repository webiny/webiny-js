import { until } from "@webiny/project-utils/testing/helpers/until";
import { pbListPages } from "./pbListPages";
import { pbDeletePage } from "./pbDeletePage";
import { login } from "../login";

/**
 * Deletes all pages (except for the default "Static" one).
 */
Cypress.Commands.add("pbDeleteAllPages", async () => {
    // Loads admin user with full access permissions.
    const user = await login();

    const pages = await pbListPages({ user, variables: { limit: 100 } });
    for (let i = 0; i < pages.length; i++) {
        if (pages[i].path === "/welcome-to-webiny") {
            continue;
        }

        if (pages[i].path === "/not-found") {
            continue;
        }
        await pbDeletePage({ user, variables: pages[i] });
    }

    return until(
        () => pbListPages({ user }),
        result => result.length <= 2,
        { wait: 3000 }
    );
});
