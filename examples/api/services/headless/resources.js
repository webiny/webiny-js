const path = require("path");

module.exports = ({ vars, cli }) => ({
    headless: {
        watch: [path.join(__dirname, "build")],
        build: {
            define: {
                APOLLO_HANDLER_OPTIONS: vars.apollo,
                DB_PROXY_OPTIONS: { functionArn: "${dbProxy.arn}" },
                SECURITY_OPTIONS: vars.security
            },
            root: __dirname,
            script: `yarn build --watch=${cli.watch}`
        },
        deploy: {
            component: "@webiny/serverless-function",
            inputs: {
                description: "Headless CMS handler",
                region: vars.region,
                code: path.join(__dirname, "build"),
                handler: "handler.handler",
                memory: 512,
                env: {
                    SECURITY_API_URL: "${security.api.graphqlUrl}",
                    I18N_API_URL: "${i18n.api.graphqlUrl}",
                    DEBUG: vars.debug
                }
            }
        }
    }
});
