import { resolve } from "path";
import { setupDynalite } from "@webiny/db-dynamodb/testing/setupDynalite.js";

(async () => {
    const setupPath = resolve(import.meta.dirname, "../../");
    await setupDynalite(setupPath);
})();
