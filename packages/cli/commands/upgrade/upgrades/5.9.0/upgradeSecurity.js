const { Node } = require("ts-morph");

function isSecurityPlugins(node) {
    return Node.isCallExpression(node) && node.getExpression().getText() === "securityPlugins";
}

async function upgradeGraphQLIndex(file, filePath, { info, error }) {
    info(`Upgrading ${info.hl(filePath)}`);

    let importPath = "@webiny/api-security-admin-users";
    const adminUsersImport = file.getImportDeclaration("@webiny/api-security-admin-users");
    if (!adminUsersImport) {
        const lastImport = file.getImportDeclarations().pop();

        file.insertImportDeclaration(lastImport.getChildIndex() + 1, {
            defaultImport: "adminUsersPlugins",
            moduleSpecifier: importPath
        });

        // Try fetching plugins from handler config object
        let plugins = file.getFirstDescendant(
            node => Node.isPropertyAssignment(node) && node.getName() === "plugins"
        );

        if (plugins) {
            const security = plugins.getInitializer().getElements().findIndex(isSecurityPlugins);
            plugins.getInitializer().insertElement(security, "adminUsersPlugins()");
        } else {
            // If not found, the project may still be using the old array-like syntax
            plugins = file.getFirstDescendant(
                node =>
                    Node.isCallExpression(node) &&
                    node.getExpression().getText() === "createHandler"
            );

            if (!plugins) {
                error(`Unable to upgrade automatically!`);
                return;
            }

            const security = plugins.getArguments().findIndex(isSecurityPlugins);
            plugins.insertArgument(security, "adminUsersPlugins()");
        }
    }
}

async function upgradeGraphQLSecurity(file, filePath, { info }) {
    info(`Upgrading ${info.hl(filePath)}`);

    // Rename default import variable name
    const authenticatorImport = file.getImportDeclaration("@webiny/api-security/authenticator");
    if (authenticatorImport) {
        authenticatorImport.renameDefaultImport("security");
    }

    // Update imports
    const map = {
        "@webiny/api-security-tenancy": "@webiny/api-tenancy",
        "@webiny/api-security/authenticator": "@webiny/api-security",
        "@webiny/api-plugin-security-cognito/authentication":
            "@webiny/api-security-cognito-authentication",
        "@webiny/api-plugin-security-cognito/identityProvider":
            "@webiny/api-security-admin-users-cognito"
    };

    file.getImportDeclarations().forEach(imp => {
        const moduleSpecifier = imp.getModuleSpecifier().getLiteralValue();
        if (moduleSpecifier in map) {
            imp.setModuleSpecifier(map[moduleSpecifier]);
        } else {
            if (moduleSpecifier.includes("@webiny/api-security-tenancy")) {
                imp.setModuleSpecifier(
                    moduleSpecifier.replace("api-security-tenancy", "api-security-admin-users")
                );
            }
        }
    });

    // Update plugin factories
    const authenticator = file.getFirstDescendant(node => {
        return Node.isCallExpression(node) && node.getExpression().getText() === "authenticator";
    });

    if (authenticator) {
        authenticator.setExpression("security");
    }

    // Update tenancy comments
    const tenancy = file.getFirstDescendant(node => {
        return Node.isCallExpression(node) && node.getExpression().getText() === "tenancy";
    });

    const tenancyComments = tenancy.getLeadingCommentRanges();
    if (tenancyComments) {
        file.replaceText(
            [tenancyComments[0].getPos(), tenancyComments[0].getEnd()],
            `/**
             * Setup tenancy context which is a requirement for all Webiny projects.
             * Learn more: https://www.webiny.com/docs/key-topics/multi-tenancy
             */`
        );
    }

    // Update security comments
    const security = file.getFirstDescendant(node => {
        return Node.isCallExpression(node) && node.getExpression().getText() === "security";
    });

    if (security) {
        const securityComments = security.getLeadingCommentRanges();
        if (securityComments) {
            file.replaceText(
                [securityComments[0].getPos(), securityComments[0].getEnd()],
                `/**
             * Setup Webiny Security Framework to handle authentication and authorization.
             * Learn more: https://www.webiny.com/docs/key-topics/security-framework/introduction
             */`
            );
        }
    }

    // Update security comments
    const cognitoIdP = file.getFirstDescendant(node => {
        return (
            Node.isCallExpression(node) &&
            node.getExpression().getText() === "cognitoIdentityProvider"
        );
    });

    if (cognitoIdP) {
        const cognitoComments = cognitoIdP.getLeadingCommentRanges();
        if (cognitoComments) {
            file.replaceText(
                [cognitoComments[0].getPos(), cognitoComments[0].getEnd()],
                `/**
             * Cognito IDP plugin (hooks for User CRUD methods).
             * This plugin will perform CRUD operations on Amazon Cognito when you do something with the user
             * via the UI or API. Its purpose is to push changes to Cognito when they happen in your app.
             */`
            );
        }
    }
}

async function upgradeHeadlessSecurity(file, filePath, context) {
    // Headless security is almost identical and we can reuse graphql upgrade
    await upgradeGraphQLSecurity(file, filePath, context);

    const cognitoIdPImport = file.getImportDeclaration("@webiny/api-security-admin-users-cognito");
    if (cognitoIdPImport) {
        cognitoIdPImport.renameDefaultImport("adminUsersContext");
        cognitoIdPImport.setModuleSpecifier("@webiny/api-security-admin-users/context");
    }

    const adminUsers = file.getFirstDescendant(node => {
        return (
            Node.isCallExpression(node) && node.getExpression().getText() === "adminUsersContext"
        );
    });

    if (adminUsers) {
        if (adminUsers.getArguments().length > 0) {
            adminUsers.removeArgument(0);
        }

        const adminUsersComments = adminUsers.getLeadingCommentRanges();
        if (adminUsersComments) {
            file.replaceText(
                [adminUsersComments[0].getPos(), adminUsersComments[0].getEnd()],
                `/**
             * Add Admin Users context to support authentication and authorization plugins.
             */`
            );
        }
    }
}

async function upgradeAdminApp(file, filePath, { info }) {
    info(`Upgrading ${info.hl(filePath)}`);

    const tenancyImport = file.getImportDeclaration(
        "@webiny/app-security-tenancy/contexts/Tenancy"
    );

    if (tenancyImport) {
        tenancyImport.setModuleSpecifier("@webiny/app-tenancy/contexts/Tenancy");
    }

    const authenticationImport = file.getImportDeclaration(
        "@webiny/app-plugin-security-cognito/Authentication"
    );

    if (authenticationImport) {
        authenticationImport.setModuleSpecifier(
            "@webiny/app-security-admin-users-cognito/Authentication"
        );
    }
}

async function upgradeAdminGetIdentityData(file, filePath, { info }) {
    info(`Upgrading ${info.hl(filePath)}`);

    const queryImport = file.getImportDeclaration("@webiny/app-security-tenancy/graphql");

    if (queryImport) {
        queryImport.setModuleSpecifier("@webiny/app-security-admin-users/graphql");
    }
}

async function upgradeAdminSecurity(file, filePath, { info }) {
    info(`Upgrading ${info.hl(filePath)}`);

    // Remove obsolete import
    const cognitoIdentityProviderImport = file.getImportDeclaration(
        "@webiny/app-plugin-security-cognito/identityProvider"
    );

    if (cognitoIdentityProviderImport) {
        cognitoIdentityProviderImport.remove();
    }

    // Remove cognitoIdentityProvider plugins
    const cognitoIdentityProvider = file.getFirstDescendant(node => {
        return (
            Node.isCallExpression(node) &&
            node.getExpression().getText() === "cognitoIdentityProvider"
        );
    });

    if (cognitoIdentityProvider) {
        cognitoIdentityProvider.getParent().removeElement(cognitoIdentityProvider);
    }

    // Refactor imports
    file.getImportDeclarations().forEach(imp => {
        const moduleSpecifier = imp.getModuleSpecifier().getLiteralValue();

        if (moduleSpecifier.includes("@webiny/app-plugin-security-cognito")) {
            imp.setModuleSpecifier("@webiny/app-security-admin-users-cognito");
            return;
        }

        const defaultImport = imp.getDefaultImport();
        if (defaultImport && defaultImport.getText() === "securityTenancy") {
            imp.renameDefaultImport("adminUsers");
        }

        if (moduleSpecifier.includes("@webiny/app-security-tenancy")) {
            imp.setModuleSpecifier(
                moduleSpecifier.replace("app-security-tenancy", "app-security-admin-users")
            );
        }
    });

    // Update comments
    const cognitoSecurity = file.getFirstDescendant(node => {
        return Node.isCallExpression(node) && node.getExpression().getText() === "cognitoSecurity";
    });

    if (cognitoSecurity) {
        const comments = cognitoSecurity.getLeadingCommentRanges();
        if (comments) {
            file.replaceText(
                [comments[0].getPos(), comments[0].getEnd()],
                `/**
                 * Configure Amplify, add Cognito related UI fields, and attach Authorization header
                 * on every GraphQL request using the authenticated identity.
                 */`
            );
        }
    }
}

module.exports = {
    upgradeGraphQLIndex,
    upgradeGraphQLSecurity,
    upgradeHeadlessSecurity,
    upgradeAdminApp,
    upgradeAdminGetIdentityData,
    upgradeAdminSecurity
};
