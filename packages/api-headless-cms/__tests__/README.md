# Tests

### Env variables

###### LOCAL_ELASTICSEARCH
Do not run elasticsearch when starting the tests, use local one. You must install it and run if, of course.


###### ELASTICSEARCH_PORT
Custom port for local elasticsearch.

###### DB_TABLE_HEADLESS_CMS
Table name for Cms Environment objects


##### Usage
````
ELASTICSEARCH_PORT=9200 LOCAL_ELASTICSEARCH=true DB_TABLE_HEADLESS_CMS=HeadlessCms yarn test packages/api-headless-cms
````