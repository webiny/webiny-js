import { Node } from "ts-morph";
import { SyntaxKind } from "ts-morph";
import { type SourceFile } from "ts-morph";

/*
 * Tells whether a file has a default export by reading its syntax alone.
 *
 * ts-morph's `getDefaultExportSymbol()` gives the same answer, but it asks the type checker, and the
 * checker first loads the TypeScript lib files and every module the file imports. For an admin
 * extension that means React and the admin app's types, so each call took between 0.1s and 2.5s.
 * `webiny watch` makes one call per extension, one after another, which added up to 17s of the
 * startup on a project with 39 extensions.
 *
 * The checker isn't needed here. A default export is always written out in the file itself, as one
 * of the forms below, since `export * from` never re-exports `default`.
 */
export const hasDefaultExport = (source: SourceFile): boolean => {
    return source.getStatements().some(statement => {
        // export default something;
        if (Node.isExportAssignment(statement)) {
            return !statement.isExportEquals();
        }

        // export default function Extension() {} and export default class Extension {}
        if (Node.isModifierable(statement)) {
            return statement.hasModifier(SyntaxKind.DefaultKeyword);
        }

        // export { Extension as default } and export { default } from "./Extension.js"
        if (Node.isExportDeclaration(statement)) {
            return statement.getNamedExports().some(namedExport => {
                const exportedName = namedExport.getAliasNode()?.getText() ?? namedExport.getName();
                return exportedName === "default";
            });
        }

        return false;
    });
};
