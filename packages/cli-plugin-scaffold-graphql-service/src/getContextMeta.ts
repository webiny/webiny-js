/**
 * TODO @ts-refactor
 * Added a lot of casts so clean those and write proper checks.
 */
import {
    Project,
    InterfaceDeclaration,
    ImportDeclaration,
    Node,
    ImportClause,
    ImportSpecifier,
    Identifier
} from "ts-morph";

interface ContextMeta {
    i18n: boolean;
    security: boolean;
}

// TODO: If needed, this could be improved by having this function simply return a list of everything
// TODO: that's included. At the moment, it only tells us if Security and I18N contexts have been used.
export default function (typesTsPath: string): ContextMeta {
    const meta = {
        i18n: false,
        security: false
    };
    if (!typesTsPath) {
        return meta;
    }

    const project = new Project();
    project.addSourceFileAtPath(typesTsPath);
    const source = project.getSourceFileOrThrow(typesTsPath);

    // 1. Get Context interface.
    const contextInterface = source.getFirstDescendant(
        node => Node.isInterfaceDeclaration(node) && node.getName() === "Context"
    ) as InterfaceDeclaration;

    if (contextInterface) {
        // 1. Check for I18NContext usage.
        const i18NContextImportDeclaration = source.getFirstDescendant(node => {
            return (
                Node.isImportDeclaration(node) &&
                node.getModuleSpecifier().getText().includes("@webiny/api-i18n/types") &&
                Boolean(
                    (node.getImportClause() as ImportClause)
                        .getNamedImports()
                        .find(item => item.getName() === "I18NContext")
                )
            );
        }) as ImportDeclaration;

        if (i18NContextImportDeclaration) {
            const importClause = i18NContextImportDeclaration.getImportClause() as ImportClause;
            const i18nContextImportSpecifier = importClause
                .getNamedImports()
                .find(item => item.getName() === "I18NContext") as ImportSpecifier;

            let i18nContextIdentifier = i18nContextImportSpecifier.getName();
            if (i18nContextImportSpecifier.getAliasNode()) {
                i18nContextIdentifier = (
                    i18nContextImportSpecifier.getAliasNode() as Identifier
                ).getText();
            }

            meta.i18n = Boolean(
                contextInterface.getExtends().find(item => item.getText() === i18nContextIdentifier)
            );
        }

        // 2. Check for SecurityContext usage.
        const securityContextImportDeclaration = source.getFirstDescendant(node => {
            return (
                Node.isImportDeclaration(node) &&
                node.getModuleSpecifier().getText().includes("@webiny/api-security/types") &&
                Boolean(
                    (node.getImportClause() as ImportClause)
                        .getNamedImports()
                        .find(item => item.getName() === "SecurityContext")
                )
            );
        }) as ImportDeclaration;

        if (securityContextImportDeclaration) {
            const securityContextImportSpecifier = (
                securityContextImportDeclaration.getImportClause() as ImportClause
            )
                .getNamedImports()
                .find(item => item.getName() === "SecurityContext") as ImportSpecifier;

            let securityContextIdentifier = securityContextImportSpecifier.getName();
            if (securityContextImportSpecifier.getAliasNode()) {
                securityContextIdentifier = (
                    securityContextImportSpecifier.getAliasNode() as Identifier
                ).getText();
            }

            meta.security = Boolean(
                contextInterface
                    .getExtends()
                    .find(item => item.getText() === securityContextIdentifier)
            );
        }
    }

    return meta;
}
