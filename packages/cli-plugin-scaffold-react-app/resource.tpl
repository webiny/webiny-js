{
    build: {
         root: "./[PACKAGE_PATH]",
         script: `yarn build:${cli.env}`
     },
     deploy: {
         component: "@webiny/serverless-function",
         inputs: {
             role: "${lambdaRole.arn}",
             region: process.env.AWS_REGION,
             description: "Webiny Admin",
             code: "./[PACKAGE_PATH]/build",
             handler: "handler.handler",
             memory: 128,
             timeout: 30
         }
     }
 }