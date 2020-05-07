{
    watch: ["./[PACKAGE_PATH]/build"],
    build: {
        root: "./[PACKAGE_PATH]",
        script: "yarn build"
    },
    deploy: {
        component: "@webiny/serverless-function",
        inputs: {
            region: process.env.AWS_REGION,
            description: "GraphQL API",
            code: "./[PACKAGE_PATH]/build",
            handler: "handler.handler",
            memory: 512,
            env: apolloServiceEnv
        }
    }
}