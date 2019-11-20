# @webiny/api-plugin-create-apollo-handler

This Webiny API plugin creates an Apollo handler from the provided schema.
It uses the [apollo-server-lambda](https://www.npmjs.com/package/apollo-server-lambda) package to create the handler. 

## How to use
Add the plugin to the `plugins` section of your service:

```yaml
myService:
  component: "@webiny/serverless-apollo-service"
    inputs:
      # ... other inputs ...
      plugins:
        # ... other plugins ...
        - factory: "@webiny/api-plugin-create-apollo-handler"
          options: # Optional
            server: 
              introspection: true
              playground: true 
```

The default CORS configuration is as follows:

```js
{
  origin: "*",
  methods: "GET,HEAD,POST"
}
```

If you need to change the defaults, see the list of all supported options in the [official package docs](https://www.npmjs.com/package/apollo-server-lambda#cors-options), and add the `handler` configuration like this:

```yaml
myService:
  component: "@webiny/serverless-apollo-service"
    inputs:
      # ... other inputs ...
      plugins:
        # ... other plugins ...
        - factory: "@webiny/api-plugin-create-apollo-handler"
          options: # Optional
            server: 
              introspection: true
              playground: true
            handler:
              cors:
                origin: "*"
                methods: ["GET", "HEAD"]
```
