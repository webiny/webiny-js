import { SourceFile } from "ts-morph";
import { createNamedImports } from "./createNamedImports";

interface Params {
    source: SourceFile;
    /**
     * It is possible to send:
     * - string - will produce default import
     * - string[] - will produce named imports
     * - Record<string, string> - will produce named imports with aliases
     */
    name: string | string[] | Record<string, string>;
    moduleSpecifier: string;
    after?: string | null;
}
export const insertImportToSourceFile = (params: Params): void => {
    const { source, name, moduleSpecifier, after = null } = params;
    const namedImports = createNamedImports(name);
    const defaultImport = namedImports === undefined ? (name as string) : undefined;

    const declaration = source.getImportDeclaration(moduleSpecifier);

    if (declaration) {
        if (defaultImport) {
            declaration.setDefaultImport(defaultImport);
            return;
        }

        /**
         * We check the existing imports, so we don't add the same one.
         */
        const existingNamedImports = declaration.getNamedImports().map(ni => {
            return ni.getText();
        });

        // Create [name, alias] tuples
        const existingImports = existingNamedImports.map(imp => imp.split(" as "));

        const newImports = namedImports.filter(ni => {
            // Make sure not a single existing import matches the new named import.
            return existingImports.every(([name, alias]) => {
                if (ni.alias) {
                    return ni.name !== name && ni.alias !== alias;
                }

                return ni.name !== name;
            });
        });

        declaration.addNamedImports(newImports);
        return;
    }
    /**
     * If we want to add this import after some other import...
     */
    if (after) {
        const afterDeclaration = source.getImportDeclaration(after);
        /**
         * If there is no target import, we will just add it at the end.
         */
        if (afterDeclaration) {
            source.insertImportDeclaration(afterDeclaration.getChildIndex() + 1, {
                defaultImport,
                namedImports,
                moduleSpecifier
            });
            return;
        }
    }

    source.addImportDeclaration({
        defaultImport,
        namedImports,
        moduleSpecifier
    });
};
