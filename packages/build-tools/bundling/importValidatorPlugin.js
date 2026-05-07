// ANSI color codes
const red = "\x1b[31m";
const yellow = "\x1b[33m";
const cyan = "\x1b[36m";
const reset = "\x1b[0m";
const bold = "\x1b[1m";

const whitelist = [
    "@webiny/cognito",
    "@webiny/auth0",
    "@webiny/okta",
    "@webiny/plugins",
    // Container-runtime adapters and storage. Extensions building the
    // container-mode API entry need these directly; they have no equivalent
    // through the `webiny` umbrella package today (Stage 5 of the container
    // refactor). A future iteration may surface these through `webiny/*`.
    "@webiny/handler-node",
    "@webiny/handler-graphql",
    "@webiny/api-core",
    "@webiny/api-core-sqlite",
    "@webiny/api-headless-cms",
    "@webiny/api-headless-cms-sqlite",
    "@webiny/api-file-manager-fs",
    "@webiny/db-sqlite"
];

export const createImportValidatorPlugin = () => {
    return {
        name: "extensions-import-validator",
        setup(api) {
            api.modifyRspackConfig(config => {
                config.plugins = config.plugins || [];
                config.plugins.push({
                    name: "ExtensionsImportValidatorPlugin",
                    apply(compiler) {
                        compiler.hooks.compilation.tap(
                            "ExtensionsImportValidatorPlugin",
                            (compilation, { normalModuleFactory }) => {
                                normalModuleFactory.hooks.beforeResolve.tap(
                                    "ExtensionsImportValidatorPlugin",
                                    resolveData => {
                                        const request = resolveData.request;
                                        const contextInfo = resolveData.contextInfo;
                                        const issuer = contextInfo?.issuer;

                                        // Check if the import request is a @webiny/* package
                                        if (!request?.startsWith("@webiny/")) {
                                            return;
                                        }

                                        // Allow whitelisted packages
                                        if (whitelist.some(pkg => request.startsWith(pkg))) {
                                            return;
                                        }

                                        // Check if the import originates from extensions folder
                                        if (!issuer) {
                                            return;
                                        }

                                        const normalizedIssuer = issuer.replace(/\\/g, "/");

                                        // Check if the issuer is within the extensions folder
                                        if (!normalizedIssuer.includes("/extensions/")) {
                                            return;
                                        }

                                        // Check if the import is coming through the webiny parent package
                                        // by checking if the issuer is from node_modules/webiny
                                        const issuerModule = contextInfo?.issuerModule;
                                        if (issuerModule) {
                                            const moduleIdentifier =
                                                issuerModule.identifier?.() || "";
                                            if (
                                                moduleIdentifier.includes("/node_modules/webiny/")
                                            ) {
                                                return; // Allow imports through webiny package
                                            }
                                        }

                                        const error = new Error(
                                            `${red}Direct imports of @webiny/* packages are not allowed. Import from "webiny" package instead.${reset}\n\n` +
                                                `${bold}Location:${reset} ${cyan}${issuer.replace(process.cwd(), "")}${reset}\n` +
                                                `${bold}Import:${reset} ${yellow}${request}${reset}\n`
                                        );
                                        error.name = "ExtensionsImportError";
                                        error.hideStack = true;

                                        compilation.errors.push(error);
                                    }
                                );
                            }
                        );
                    }
                });
            });
        }
    };
};
