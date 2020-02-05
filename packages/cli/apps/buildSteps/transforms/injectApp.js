/**
 * This transform injects the import statement for the App with resolved path to the app's index.js.
 */
module.exports = function({ template }, { appIndex }) {
    const importPlugin = template(`import { App } from "APP_INDEX";`);

    return {
        visitor: {
            Program(path) {
                const newImport = importPlugin({
                    APP_INDEX: appIndex
                });

                const lastImport = path
                    .get("body")
                    .filter(p => p.isImportDeclaration())
                    .pop();

                if (lastImport) {
                    lastImport.insertAfter(newImport);
                }
            }
        }
    };
};
