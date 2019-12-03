# @webiny/api-plugin-{app}-{purpose}

E.g.: A set of resolvers for Files API using MongoDB.

## How to use
Add the plugin to the `plugins` section of your service:

```yaml
myService:
  component: "@webiny/serverless-apollo-service"
    inputs:
      # ... other inputs ...
      plugins:
        # ... other plugins ...
        - "@webiny/api-plugin-{app}-{purpose}"
```
