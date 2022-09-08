import { until } from "@webiny/project-utils/testing/helpers/until";
import { pbListCategories } from "./pbListCategories";
import { pbDeleteCategory } from "./pbDeleteCategory";
import { login } from "../login";

/**
 * Deletes all categories (except for the default "Static" one).
 */
Cypress.Commands.add("pbDeleteAllCategories", async () => {
    // Loads admin user with full access permissions.
    const user = await login();

    const categories = await pbListCategories({ user });
    for (let i = 0; i < categories.length; i++) {
        if (categories[i].slug === "static") {
            continue;
        }
        await pbDeleteCategory({ user, variables: categories[i] });
    }

    return until(
        () => pbListCategories({ user }),
        result => result.length === 1,
        { wait: 3000 }
    );
});
