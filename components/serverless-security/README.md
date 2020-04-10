# @webiny/serverless-security
[![](https://img.shields.io/npm/dw/@webiny/serverless-security.svg)](https://www.npmjs.com/package/@webiny/serverless-security) 
[![](https://img.shields.io/npm/v/@webiny/serverless-security.svg)](https://www.npmjs.com/package/@webiny/serverless-security)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com) 

Serverless-security deploys an API Gateway with  the `/graphql` route which is consumed by the Apollo's GraphQL Gateway.

It also deploys a `validatePAT` Lamda Function which receives a Personal Access Token and returns essential user information (id, type, access).

## Usage
Use it in your `serverless.yml` file like so:

```yaml
name: my-app

vars:
  region: "us-east-1"
    mongodb:
     server: ${env.MONGODB_SERVER}
      name: ${env.MONGODB_NAME}
  debug: ${env.DEBUG
  apollo:
    server:
      introspection: ${env.GRAPHQL_INTROSPECTION}
      playground: ${env.GRAPHQL_PLAYGROUND}
  security:
    token:
      expiresIn: 2592000 # 30 days
      secret: ${env.JWT_SECRET}

dbProxy:
  component: "@webiny/serverless-db-proxy"
  inputs:
    testConnectionBeforeDeploy: true
    region: ${vars.region}
    concurrencyLimit: 15
    timeout: 30
    env:
      MONGODB_SERVER: ${vars.mongodb.server}
      MONGODB_NAME: ${vars.mongodb.name}

security:
  component: "@webiny/serverless-security"
  inputs:
    region: ${vars.region}
    memory: 512
    debug: ${vars.debug}
    functions:
      apolloService:
        memory: 512
        timeout: 30
        debug: ${vars.debug}
        plugins:
          - factory: "@webiny/api-plugin-create-apollo-handler"
            options: ${vars.apollo}
          - factory: "@webiny/api-plugin-commodo-db-proxy"
            options:
              functionArn: ${dbProxy.arn}
          - factory: "@webiny/api-security/plugins/service"
            options: ${vars.security}
          - "@webiny/api-files/plugins"
          - "@webiny/api-plugin-files-resolvers-mongodb"
    
anotherService:
  ...    
```
