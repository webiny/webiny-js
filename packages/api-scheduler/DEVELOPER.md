## @webiny/api-scheduler

Run tests:
DynamoDB Only:

```bash
yarn test packages/api-scheduler -- --storage=ddb
```

DynamoDB + Opensearch:

```bash
yarn test packages/api-scheduler -- --storage=ddb-os,ddb
```

Run tests with coverage:

DynamoDB Only:

```bash
yarn test packages/api-scheduler --coverage --coverage.include="packages/api-scheduler/src/**" -- --storage=ddb
```

DynamoDB + Opensearch:

```bash
yarn test packages/api-scheduler --coverage --coverage.include="packages/api-scheduler/src/**" -- --storage=ddb-os,ddb
```
