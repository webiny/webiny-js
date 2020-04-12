{
    watch: ["./services/[PACKAGE_NAME]/build"],
    build: {
        root: "./services/[PACKAGE_NAME]",
        script: "yarn build",
        define: apolloServiceDefinitions
    },
    deploy: {
        component: "@webiny/serverless-apollo-service",
        inputs: {
            region: vars.region,
            description: "GraphQL API",
            function: {
                code: "./services/[PACKAGE_NAME]/build",
                handler: "handler.handler",
                memory: 512,
                env: {
                    DEBUG: vars.debug
                }
            }
        }
    }
}