{
    watch: ["./[PACKAGE_PATH]/build"],
    build: {
        root: "./[PACKAGE_PATH]",
        script: "yarn build",
        define: apolloServiceDefinitions
    },
    deploy: {
        component: "@webiny/serverless-function",
        inputs: {
            region: vars.region,
            description: "GraphQL API",
            code: "./[PACKAGE_PATH]/build",
            handler: "handler.handler",
            memory: 512,
            env: {
                DEBUG: vars.debug
            }
        }
    }
}