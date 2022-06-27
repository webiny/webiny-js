# Registering Plugins

The following examples how to register relevant plugins in a [handler function](../../../handler).

```ts
import { createHandler } from "@webiny/handler-aws";
import { createWcpContext, createWcpGraphQL } from "@webiny/api-wcp";

export const handler = createHandler({
  plugins: [
    // Registers WCP context API.  
    createWcpContext(),
      
    // Registers WCP GraphQL   
    createWcpGraphQL()
    // ...
  ]
});
```
