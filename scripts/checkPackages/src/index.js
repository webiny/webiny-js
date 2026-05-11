import { checkPackages } from "./checkPackages";

(async () => {
    await checkPackages();
    process.exit();
})();
