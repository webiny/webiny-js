# @webiny/api-plugin-commodo-nedb

This Webiny API plugin provides a Commodo driver for Nedb. It sets an instance of the Nedb driver to `context.commodo.driver`.

## How to use
Add the plugin to the `plugins` section of your service:

```yaml
myService:
  component: "@webiny/serverless-apollo-service"
    inputs:
      # ... other inputs ...
      plugins:
        # ... other plugins ...
        - factory: "@webiny/api-plugin-commodo-nedb"
          options:
            database:
              server: NEDB_SERVER_URI
              name: NEDB_DATABASE_NAME
```
