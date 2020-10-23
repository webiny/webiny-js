# @webiny/handler-db-nedb

This Webiny API plugin provides a db driver for Nedb. It sets an instance of the Nedb driver to `context.db.driver`.

## How to use
Add the plugin to the `plugins` section of your service:

```yaml
myService:
  component: "@webiny/serverless-apollo-service"
    inputs:
      # ... other inputs ...
      plugins:
        # ... other plugins ...
        - factory: "@webiny/handler-db-nedb"
          options:
            database:
              server: NEDB_SERVER_URI
              name: NEDB_DATABASE_NAME
```
