import { dirname, join } from "path";
import { fileURLToPath } from "url";

export const getTemplatesFolderPath = () => {
    const templatePackage = import.meta.resolve("@webiny/project-aws-template/package.json");

    if (!templatePackage) {
        // This should never happen because we're controlling the templates.
        throw new Error("Could not find the `appTemplates` folder. Something went terribly wrong.");
    }

    const cleanPath = fileURLToPath(templatePackage);

    return join(dirname(cleanPath), "template");
};
