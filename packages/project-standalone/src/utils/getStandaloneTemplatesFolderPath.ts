import { dirname, join } from "path";
import { fileURLToPath } from "url";

export const getStandaloneTemplatesFolderPath = () => {
    const templatePackage = import.meta.resolve("@webiny/project-standalone-template/package.json");

    if (!templatePackage) {
        throw new Error(
            "Could not find the `@webiny/project-standalone-template` package. Something went terribly wrong."
        );
    }

    return join(dirname(fileURLToPath(templatePackage)), "template");
};
