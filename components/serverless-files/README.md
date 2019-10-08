# @webiny/serverless-files
[![](https://img.shields.io/npm/dw/@webiny/serverless-files.svg)](https://www.npmjs.com/package/@webiny/serverless-files) 
[![](https://img.shields.io/npm/v/@webiny/serverless-files.svg)](https://www.npmjs.com/package/@webiny/serverless-files)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

The infrastructure for the [Webiny Files (@webiny/api-files)](../../packages/api-files) API. 

It deploys a single API Gateway with `/files/{fileKey}` route for downloading files, and 
the `/graphql` route which is consumed by the Apollo's GraphQL Gateway.

Tip: Use a CDN (Cloudfront) to cache all output from the `/files/{fileKey}`.

## Usage
Use it in your `serverless.yml` file like so:

```yaml
name: my-app

vars:
  region: "us-east-1"
  env:
    WEBINY_JWT_SECRET: ${env.WEBINY_JWT_SECRET}
  database:
    server: ${env.MONGODB_SERVER}
    name: ${env.MONGODB_NAME}

files:
  component: "@webiny/serverless-files"
  inputs:
    region: ${vars.region}
    bucket: "webiny-files-4"
    name: files
    memory: 128
    database: ${vars.database}
    env: ${vars.env}
    
anotherService:
  ...    
```
