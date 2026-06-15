import { dirname, join } from "path";
import { fileURLToPath } from "url";

export const getServerTemplatesFolderPath = () => {
    const templatePackage = import.meta.resolve("@webiny/project-server/package.json");

    if (!templatePackage) {
        throw new Error(
            "Could not find the `@webiny/project-server` package. Something went terribly wrong."
        );
    }

    return join(dirname(fileURLToPath(templatePackage)), "_templates");
};
