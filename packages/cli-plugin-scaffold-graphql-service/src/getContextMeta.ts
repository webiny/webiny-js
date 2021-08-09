import { Project, InterfaceDeclaration, ImportDeclaration, Node } from "ts-morph";

interface ContextMeta {
    i18n: boolean;
    security: boolean;
}

// TODO: If needed, this could be improved by having this function simply return a list of everything
// TODO: that's included. At the moment, it only tells us if Security and I18N contexts have been used.
export default function (typesTsPath): ContextMeta {
    const meta = {
        i18n: false,
        security: false
    };

    if (typesTsPath) {
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
                    node.getModuleSpecifier().getText() === `"@webiny/api-i18n/types"` &&
                    Boolean(
                        node
                            .getImportClause()
                            .getNamedImports()
                            .find(item => item.getName() === "I18NContext")
                    )
                );
            }) as ImportDeclaration;

            if (i18NContextImportDeclaration) {
                const i18nContextImportSpecifier = i18NContextImportDeclaration
                    .getImportClause()
                    .getNamedImports()
                    .find(item => item.getName() === "I18NContext");

                let i18nContextIdentifier = i18nContextImportSpecifier.getName();
                if (i18nContextImportSpecifier.getAliasNode()) {
                    i18nContextIdentifier = i18nContextImportSpecifier.getAliasNode().getText();
                }

                meta.i18n = Boolean(
                    contextInterface
                        .getExtends()
                        .find(item => item.getText() === i18nContextIdentifier)
                );
            }

            // 2. Check for SecurityContext usage.
            const securityContextImportDeclaration = source.getFirstDescendant(node => {
                return (
                    Node.isImportDeclaration(node) &&
                    node.getModuleSpecifier().getText() === `"@webiny/api-security/types"` &&
                    Boolean(
                        node
                            .getImportClause()
                            .getNamedImports()
                            .find(item => item.getName() === "SecurityContext")
                    )
                );
            }) as ImportDeclaration;

            if (securityContextImportDeclaration) {
                const securityContextImportSpecifier = securityContextImportDeclaration
                    .getImportClause()
                    .getNamedImports()
                    .find(item => item.getName() === "SecurityContext");

                let securityContextIdentifier = securityContextImportSpecifier.getName();
                if (securityContextImportSpecifier.getAliasNode()) {
                    securityContextIdentifier = securityContextImportSpecifier
                        .getAliasNode()
                        .getText();
                }

                meta.security = Boolean(
                    contextInterface
                        .getExtends()
                        .find(item => item.getText() === securityContextIdentifier)
                );
            }
        }
    }

    return meta;
}
