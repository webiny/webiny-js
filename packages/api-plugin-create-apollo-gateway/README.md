# @webiny/api-plugin-create-apollo-gateway

A plugin to setup an Apollo Federation Gateway.

## How to use

Add the plugin to the `plugins` section of your apollo gateway service:

```yaml
myService:
  component: "@webiny/serverless-apollo-gateway"
    inputs:
      # ... other inputs ...
    plugins:
      - factory: "@webiny/api-plugin-create-apollo-gateway"
        options:
          server:
            introspection: true
            playground: true
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
