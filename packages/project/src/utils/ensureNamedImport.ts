import type { SourceFile } from "ts-morph";

/**
 * Makes sure `name` is imported from `moduleSpecifier` in the given file, as a value under its own
 * name, so it can be used in JSX.
 *
 * Checks every import from the module, not only the first: a file can import from one module on
 * several lines, and adding the name to one line when another already has it declares it twice.
 * If the name is imported only as a type, that import becomes a value import, since a second,
 * value import of the same name is also a duplicate. Otherwise a missing name goes into the first
 * import from the module that takes named imports, or onto a new import line after the last one.
 */
export const ensureNamedImport = (
    sourceFile: SourceFile,
    name: string,
    moduleSpecifier: string
) => {
    const moduleDeclarations = sourceFile
        .getImportDeclarations()
        .filter(declaration => declaration.getModuleSpecifierValue() === moduleSpecifier);
    const declarations = moduleDeclarations.filter(declaration => !declaration.isTypeOnly());

    const isImported = declarations.some(declaration => {
        return declaration.getNamedImports().some(namedImport => {
            return (
                namedImport.getName() === name &&
                !namedImport.getAliasNode() &&
                !namedImport.isTypeOnly()
            );
        });
    });

    if (isImported) {
        return;
    }

    for (const declaration of moduleDeclarations) {
        const typeOnlyImport = declaration.getNamedImports().find(namedImport => {
            return namedImport.getName() === name && !namedImport.getAliasNode();
        });
        if (!typeOnlyImport) {
            continue;
        }

        // `import { Infra, type Api }`: drop the `type` on the name.
        if (typeOnlyImport.isTypeOnly()) {
            typeOnlyImport.setIsTypeOnly(false);
            return;
        }

        // `import type { Api }`: the name is all it imports, so drop the `type` on the line.
        const isOnlyName =
            declaration.getNamedImports().length === 1 && !declaration.getDefaultImport();
        if (isOnlyName) {
            declaration.setIsTypeOnly(false);
            return;
        }

        // `import type { Api, Admin }`: take the name out and add it as a value below.
        typeOnlyImport.remove();
        break;
    }

    const target = declarations.find(declaration => !declaration.getNamespaceImport());
    if (target) {
        target.addNamedImport(name);
        return;
    }

    const index = sourceFile.getImportDeclarations().length;
    sourceFile.insertImportDeclaration(index, {
        namedImports: [name],
        moduleSpecifier
    });
};
