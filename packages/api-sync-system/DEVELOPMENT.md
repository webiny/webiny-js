## How To Use?

### Information About `env` and `variant` Parameters
We will use `dev` environment in the examples.

Variants can be anything you like, for our example we use `blue` and `green`, but you can use `orange`, `black`, `car`,
`horse`, `space`, etc.

### Deploy the Sync System

Deploy the Sync System to the `dev` environment.

```bash
yarn webiny deploy sync --env=dev
```

### Deploy `blue` and `green` Webiny

It imperative the two systems to be in the same environment as the Sync System, as it will automatically connect Webiny deployments in the same environment.

```bash
yarn webiny deploy --env=dev --variant=blue && yarn webiny deploy --env=dev --variant=green
```

Also, there can be more than two systems, so you can deploy as many as you like, just make sure to use different variants.

### Install Webiny Blue Variant

Do a:
```
yarn webiny info
```
Find the `blue` variant Admin URL, and open it in your browser. Install the system by following the instructions.

At that point, green system should be installed as well.


# TODO

### Add BlueGreen, Resolver and Work Folders to User Projects
We need to deploy the following folders to the user project:
- blueGreen
- sync/resolver
- sync/worker

Maybe have it as a CLI command?

### Test the Blue / Green Deployment

- create domains api.bg.webiny.com, admin.bg.webiny.com, website.bg.webiny.com, preview.bg.webiny.com
- deploy the blueGreen application
- make sure the domains are pointing correctly
- switch between blue and green deployments to test the resolver
- create / update entries in blue and green and make sure they are correctly transferred to the other deployment

### Cognito User Transfer

User is currently transferred but password is not so it results in error where user cannot log in and cannot reset
password.
This will be resolved by implementing a login function which will send a code to the user email and log in with that
code.

### Filtering out models which we do not want to sync

Currently, models are filtered out when records are being added into the sync pool. That is ok for creating or updating
records, but when deleting, we do not have the modelId in the item being deleted.

Maybe implement filtering in the resolver ?

### Add proper logging?
Use pino to log all events, separated in proper levels (info, warn, error, debug, etc...).

### Move Resolver plugins (file manager, users) into their own packages
We should move the resolver plugins for file manager and users into their own packages, and those packages should register them.

### Implement Dependency Injection

Currently, we need to pass a ton of methods to the Sync system handlers. It would be simple as

```typescript
const handler = createSyncResolverHandler({
    plugins: [],
    debug: process.env.DEBUG === "true",
    awsWorkerLambdaArn: process.env.AWS_SYNC_WORKER_LAMBDA_ARN,
});
```

if we did not need to pass all creator methods:

```typescript
const handler = createSyncResolverHandler({
    plugins: [],
    debug: process.env.DEBUG === "true",
    awsWorkerLambdaArn: process.env.AWS_SYNC_WORKER_LAMBDA_ARN,
    createS3Client,
    createLambdaClient,
    createDocumentClient,
    createCognitoIdentityProviderClient
});
```

And there might be new methods added in the future.