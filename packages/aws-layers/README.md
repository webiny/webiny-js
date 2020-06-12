# @webiny/aws-layers

This package is intended to be used in your Webiny project's `api/resources.js` configuration file.
It exposes Webiny layers for some of the key resources so you can simply include them in your project and not have to create/deploy them on your own. Those layers are published in multiple AWS regions for you to use.

## Usage

```js
// api/resources.js
const { getLayerArn } = require("@webiny/aws-layers");

// Then in your resources definition...
module.exports = () => ({
  resources: {
    // ... other resources ... 
    imageTransformer: {
      // ... other options ...
      deploy: {
        component: "@webiny/serverless-function",
        inputs: {
          // ...other inputs ...
          // Get layer ARN using layer name and a region
          layers: [getLayerArn("webiny-v4-sharp", process.env.AWS_REGION)]
        }
      }
    }
  }
});
```