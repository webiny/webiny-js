import { dirname, join } from "path";
import { fileURLToPath } from "url";

export const getPulumiBaseTemplatesFolderPath = () => {
    const templatePackage = import.meta.resolve("@webiny/project-aws-template/package.json");

    if (!templatePackage) {
        throw new Error(
            "Could not find the `@webiny/project-aws-template` package. Something went terribly wrong."
        );
    }

    return join(dirname(fileURLToPath(templatePackage)), "template");
};
