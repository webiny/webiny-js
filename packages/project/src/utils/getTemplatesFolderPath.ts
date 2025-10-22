import findUp from "find-up";
import path from "path";

const TEMPLATES_FOLDER_NAME = "_templates";

export const getTemplatesFolderPath = () => {
    const templatesFolderPath = findUp.sync(TEMPLATES_FOLDER_NAME, {
        type: "directory",
        cwd: path.join(import.meta.dirname)
    });

    if (!templatesFolderPath) {
        // This should never happen because we're controlling the templates.
        throw new Error("Could not find the `appTemplates` folder. Something went terribly wrong.");
    }

    return templatesFolderPath;
};
