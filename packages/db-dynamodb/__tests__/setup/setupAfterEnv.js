import { resolve } from "path";
import { setupDynalite } from "../../dist/testing/setupDynalite.js";

(async () => {
    const setupPath = resolve(import.meta.dirname, "../../");
    await setupDynalite(setupPath);
})();
