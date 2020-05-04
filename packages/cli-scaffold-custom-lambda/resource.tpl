{
    watch: ["./services/[PACKAGE_NAME]/build"],
    build: {
        root: "./services/[PACKAGE_NAME]",
        script: "yarn build"
    },
    deploy: {
        component: "@webiny/serverless-function",
        inputs: {
            description: "Custom lambda function",
            region: vars.region,
            code: "./services/[PACKAGE_NAME]/build",
            handler: "handler.handler",
            memory: 512,
            env: {
                DEBUG: vars.debug
            }
        }
    }
}