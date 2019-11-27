# @webiny/api-plugin-lumigo-tracer

A plugin to wrap a handler with Lumigo tracer: https://lumigo.io/

## How to use?

1) Create an account at https://lumigo.io/. 
2) Configure Lumigo integration (follow the Lumigo onboarding) and obtain the `token`.
3) Configure the API plugin in your Webiny project.

In your `serverless.yml` add a plugin to your `@webiny/serverless-apollo-gateway` or `@webiny/serverless-apollo-service` component:

Example 1: Apollo Gateway

```yml
vars:
  lumigo:
    token: YOUR_LUMIGO_TOKEN
    enabled: true

gateway:
  component: "@webiny/serverless-apollo-gateway"
  inputs:
    # ... other inputs
    plugins:
      - factory: "@webiny/api-plugin-lumigo-tracer"
        options: ${vars.lumigo}
      - factory: "@webiny/api-plugin-create-apollo-gateway"
        options:
          server: ${vars.apollo.server}
          services:
            - name: security
              url: ${security.api.graphqlUrl}
            - name: files
              url: ${files.api.graphqlUrl}
            - name: pageBuilder
              url: ${pageBuilder.api.graphqlUrl}
            - name: i18n
              url: ${i18n.api.graphqlUrl}
```

Exapmle 2: Apollo Service

```yml
vars:
  lumigo:
    token: t_2ca9bcacb45a4482ada38
    enabled: true

i18n:
  component: "@webiny/serverless-apollo-service"
  inputs:
    # ... other inputs
    plugins:
      - factory: "@webiny/api-plugin-lumigo-tracer"
        options: ${vars.lumigo}
      - factory: "@webiny/api-plugin-create-apollo-handler"
        options: ${vars.apollo}
      # ... other pluguins
```
