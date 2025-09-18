import { getUserInput, presets, updatePackages } from "./updatePackagesLib/index.ts";

(async () => {
    try {
        const input = await getUserInput({
            presets
        });
        if (!input) {
            return;
        }

        return await updatePackages({
            input
        });
    } catch (ex) {
        if (ex.name === "ExitPromptError") {
            process.exit();
        }
        throw ex;
    }
})();
