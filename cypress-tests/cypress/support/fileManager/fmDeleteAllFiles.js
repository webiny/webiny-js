import { until } from "@webiny/project-utils/testing/helpers/until";
import { fmListFiles } from "./fmListFiles";
import { fmDeleteFile } from "./fmDeleteFile";
import { login } from "../login";

/**
 * Deletes all files.
 */
Cypress.Commands.add("fmDeleteAllFiles", async () => {
    // Loads admin user with full access permissions.
    const user = await login();

    const files = await fmListFiles({ user });
    for (let i = 0; i < files.length; i++) {
        await fmDeleteFile({ user, variables: files[i] });
    }

    return until(
        () => fmListFiles({ user }),
        result => result.length === 0,
        { wait: 3000 }
    );
});
