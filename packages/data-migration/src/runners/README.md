Runners create context specific to the type of migrations they're running:

- DynamoDB
- Elasticsearch
- S3
- ....

Each of these migration types require different contexts, instances of clients, etc.
Runners encapsulate this logic, and the main migration process remains clean and simple, without knowing details of
individual migration types.
