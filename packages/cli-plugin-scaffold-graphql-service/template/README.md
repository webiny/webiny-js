# packageName

### Install

```
yarn add packageName
```

### Import package into the GraphQL API file

```ts title="graphQlIndexFile"
// at the top of the file
import targetPlugin from "packageName";

// somewhere after headlessCmsPlugins() in the end of the createHandler() function
targetPlugin()
```

### Tests
From the project root, run:
```
LOCAL_ELASTICSEARCH=true yarn test location
```

Also, you can change the Elasticsearch port by setting `LOCAL_ELASTICSEARCH` variable, like this:
```
ELASTICSEARCH_PORT=9200 LOCAL_ELASTICSEARCH=true yarn test location
```

### Deploy the API
To deploy the API, run the deploy command:
```
yarn webiny deploy api --env=dev
```

### Elasticsearch
To create the Elasticsearch index, run the `install` mutation
```
mutation TargetsInstallMutation {
    targets {
        install {
            data
            error {
                message
                code
                data
            }
        }
    }
}
```
in the API playground.

To delete the Elasticsearch index, run the `uninstall` mutation
```
mutation TargetsUninstallMutation {
    targets {
        uninstall {
            data
            error {
                message
                code
                data
            }
        }
    }
}
```
in the API playground.

### Learn more
Learn more about scaffolding at https://docs.webiny.com/docs/tutorials/create-an-application/introduction

### Contributing
Want to help us improve this scaffold? Become a contributor on our [Github](https://github.com/webiny/webiny-js) and join our [Slack](https://webiny-community.slack.com).

Please see our [Contributing Guidelines](https://github.com/webiny/webiny-js/blob/next/docs/CONTRIBUTING.md) which explain repo organization, setup, testing, and other steps.