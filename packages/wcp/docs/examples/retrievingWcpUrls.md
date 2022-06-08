# Retrieving WCP URLs

We can use the following functions in order to retrieve WCP-related URLs. 

```ts
import { getWcpAppUrl, getWcpApiUrl, getWcpGqlApiUrl } from "@webiny/wcp";

console.log(getWcpAppUrl()); // Returns "https://app.webiny.com".
console.log(getWcpApiUrl()); // Returns "https://d3mudimnmgk2a9.cloudfront.net".
console.log(getWcpGqlApiUrl()); // Returns "https://d3mudimnmgk2a9.cloudfront.net/graphql".
```

Note that the URLs can be overridden with `WCP_APP_URL` and `WCP_API_URL` environment variables.
