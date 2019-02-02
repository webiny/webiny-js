# webiny-cloud-sdk

An SDK used by `webiny-cli` to create Webiny projects and deploy static sites and functions to the Webiny Cloud.

## How to use
Install the package:
```
yarn add webiny-cloud-sdk
```

Instantiate an SDK using your user account token:

```
import WebinyCloudSDK from "webiny-cloud-sdk";
const sdk = new WebinyCloudSDK({ token: USER_TOKEN })
```