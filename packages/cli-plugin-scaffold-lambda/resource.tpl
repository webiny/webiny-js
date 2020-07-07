{
    watch: ["./[PACKAGE_PATH]/build"],
    build: {
        root: "./[PACKAGE_PATH]",
        script: "yarn build"
    },
    deploy: {
        component: "@webiny/serverless-function",
        inputs: {
            role: "${lambdaRole.arn}",
            description: "Custom lambda function",
            region: process.env.AWS_REGION,
            code: "./[PACKAGE_PATH]/build",
            handler: "handler.handler",
            memory: 512
        }
    }
}
