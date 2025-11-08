import { resolve } from "path";
import { setupDynalite } from "@webiny/project-utils/testing/dynalite/index.js";

(async () => {
    const setupPath = resolve(import.meta.dirname, "../../");
    await setupDynalite(setupPath);
})();
