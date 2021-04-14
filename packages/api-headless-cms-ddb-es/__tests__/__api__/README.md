# api-headless-cms

### Env variables

###### LOCAL_ELASTICSEARCH
Do not run elasticsearch when starting the tests, use local one. You must install it and run if, of course.

###### ELASTICSEARCH_PORT
Custom port for local elasticsearch.

##### Usage
````
ELASTICSEARCH_PORT=9200 LOCAL_ELASTICSEARCH=true yarn test packages/api-headless-cms --filter=ddb-es
````