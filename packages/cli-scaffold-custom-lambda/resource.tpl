{
    watch: ["./[PACKAGE_PATH]/build"],
    build: {
        root: "./[PACKAGE_PATH]",
        script: "yarn build"
    },
    deploy: {
        component: "@webiny/serverless-function",
        inputs: {
            description: "Custom lambda function",
            region: vars.region,
            code: "./[PACKAGE_PATH]/build",
            handler: "handler.handler",
            memory: 512
        }
    }
}