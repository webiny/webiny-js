import type { ImportDeclaration } from "ts-morph";
import type { SourceFile } from "ts-morph";

/*
 * Makes sure `name` is bound in the file by a named import from `moduleSpecifier`.
 *
 * Every import from that module counts, not only the first, and what counts is the name the import
 * binds in the file: `import { Api as WebinyApi }` binds `WebinyApi`, so `Api` is still missing. A
 * type-only import of the name counts too, because adding a second one would declare it twice.
 *
 * When the name is missing, it is added to the first value import from the module, or as a new
 * import after the last one.
 */
export const ensureNamedImport = (
    sourceFile: SourceFile,
    name: string,
    moduleSpecifier: string
): void => {
    const imports = sourceFile.getImportDeclarations();
    const fromModule = imports.filter(declaration => {
        return declaration.getModuleSpecifierValue() === moduleSpecifier;
    });

    const isBound = fromModule.some(declaration => bindsName(declaration, name));
    if (isBound) {
        return;
    }

    const valueImport = fromModule.find(declaration => {
        return !declaration.isTypeOnly() && !declaration.getNamespaceImport();
    });
    if (valueImport) {
        valueImport.addNamedImport(name);
        return;
    }

    sourceFile.insertImportDeclaration(imports.length, {
        namedImports: [name],
        moduleSpecifier
    });
};

const bindsName = (declaration: ImportDeclaration, name: string): boolean => {
    return declaration.getNamedImports().some(namedImport => {
        const alias = namedImport.getAliasNode();
        const localName = alias ? alias.getText() : namedImport.getName();
        return localName === name;
    });
};
