import type { SourceFile } from "ts-morph";

/**
 * Makes sure `name` is imported from `moduleSpecifier` in the given file, as a value under its own
 * name, so it can be used in JSX.
 *
 * Checks every import from the module, not only the first: a file can import from one module on
 * several lines, and adding the name to one line when another already has it declares it twice.
 * If the name is missing, it goes into the first import from the module that takes named imports,
 * or onto a new import line after the last one.
 */
export const ensureNamedImport = (
    sourceFile: SourceFile,
    name: string,
    moduleSpecifier: string
) => {
    const declarations = sourceFile
        .getImportDeclarations()
        .filter(
            declaration =>
                declaration.getModuleSpecifierValue() === moduleSpecifier &&
                !declaration.isTypeOnly()
        );

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
