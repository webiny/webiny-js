# @webiny/api-plugin-commodo-db-proxy

This Webiny API plugin provides a Commodo driver for MongoDB. It sets an instance of the MongoDB driver to `context.commodo.driver`.

## How to use
Add the plugin to the `plugins` section of your service:

```yaml
myService:
  component: "@webiny/serverless-apollo-service"
    inputs:
      # ... other inputs ...
      plugins:
        # ... other plugins ...
        - factory: "@webiny/api-plugin-commodo-db-proxy"
          options:
            database:
              server: MONGODB_SERVER_URI
              name: MONGODB_DATABASE_NAME
```
