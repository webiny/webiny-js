import { resolve } from "path";
import { setupDynalite } from "@webiny/project-utils/testing/dynalite/index.js";
import { setupTestIndexManager } from "@webiny/api-opensearch/testing";

setupTestIndexManager({ global });

(async () => {
    const setupPath = resolve(import.meta.dirname, "../../");
    await setupDynalite(setupPath);
})();
