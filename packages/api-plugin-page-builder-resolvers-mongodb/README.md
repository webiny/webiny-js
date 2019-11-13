# @webiny/api-plugin-page-builder-resolvers-mongodb

A set of resolvers for Page Builder API using MongoDB.

## How to use
Add the plugin to the `plugins` section of your service:

```yaml
myService:
  component: "@webiny/serverless-apollo-service"
    inputs:
      # ... other inputs ...
      plugins:
        # ... other plugins ...
        - "@webiny/api-plugin-page-builder-resolvers-mongodb"
```
