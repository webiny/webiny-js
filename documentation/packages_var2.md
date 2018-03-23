# Packages
The following is a complete list of packages, which are used by the Webiny platform, but can also be used standalone if needed.

## API

| Package | About
| --- | --- |
[API](https://github.com/webiny/webiny-js/tree/master/packages-api/webiny-api) | Express middleware to quickly build powerful REST APIs. <br/><br/> [![Known Vulnerabilities](https://snyk.io/test/github/webiny/webiny-js/badge.svg?targetFile=packages-api%2Fwebiny-api%2Fpackage.json)](https://snyk.io/test/github/webiny/webiny-js?targetFile=packages-api%2Fwebiny-api%2Fpackage.json)
[API Security](https://github.com/webiny/webiny-js/tree/master/packages-api/webiny-api-security) | Provides an app which handles security layer for your project. It includes both authentication and authorization mechanisms. <br/><br/> [![Known Vulnerabilities](https://snyk.io/test/github/webiny/webiny-js/badge.svg?targetFile=packages-api%2Fwebiny-api-security%2Fpackage.json)](https://snyk.io/test/github/webiny/webiny-js?targetFile=packages-api%2Fwebiny-api-security%2Fpackage.json)

## Entity
Entity layer which can work with various database / storage systems like MySQL, MongoDB and even IndexedDB or localStorage if needed.

| Package | About
| --- | --- |
[Entity](https://github.com/webiny/webiny-js/tree/master/packages-utils/webiny-entity) | Main package which needs to be used with appropriate driver. <br/><br/> [![Known Vulnerabilities](https://snyk.io/test/github/webiny/webiny-js/badge.svg?targetFile=packages-utils%2Fwebiny-entity%2Fpackage.json)](https://snyk.io/test/github/webiny/webiny-js?targetFile=packages-utils%2Fwebiny-entity%2Fpackage.json)
[Memory](https://github.com/webiny/webiny-js/tree/master/packages-utils/webiny-entity-memory) | In-memory driver for `webiny-entity`. <br/><br/> [![Known Vulnerabilities](https://snyk.io/test/github/webiny/webiny-js/badge.svg?targetFile=packages-utils%2Fwebiny-entity-memory%2Fpackage.json)](https://snyk.io/test/github/webiny/webiny-js?targetFile=packages-utils%2Fwebiny-entity-memory%2Fpackage.json)
[MySQL](https://github.com/webiny/webiny-js/tree/master/packages-utils/webiny-entity-mysql) | MySQL driver for `webiny-entity`. <br/><br/> [![Known Vulnerabilities](https://snyk.io/test/github/webiny/webiny-js/badge.svg?targetFile=packages-utils%2Fwebiny-entity-mysql%2Fpackage.json)](https://snyk.io/test/github/webiny/webiny-js?targetFile=packages-utils%2Fwebiny-entity-mysql%2Fpackage.json)

## Files
A plugginable file storage system that make storing files easy.

| Package | About
| --- | --- |
[File Storage](https://github.com/webiny/webiny-js/tree/master/packages-utils/webiny-file-storage) | Main package which needs to be used with appropriate driver. <br/><br/> [![Known Vulnerabilities](https://snyk.io/test/github/webiny/webiny-js/badge.svg?targetFile=packages-utils%2Fwebiny-file-storage%2Fpackage.json)](https://snyk.io/test/github/webiny/webiny-js?targetFile=packages-utils%2Fwebiny-file-storage%2Fpackage.json)
[Local Storage](https://github.com/webiny/webiny-js/tree/master/packages-utils/webiny-file-storage-local) | A local filesystem storage driver for `webiny-file-storage`. <br/><br/> [![Known Vulnerabilities](https://snyk.io/test/github/webiny/webiny-js/badge.svg?targetFile=packages-utils%2Fwebiny-file-storage-local%2Fpackage.json)](https://snyk.io/test/github/webiny/webiny-js?targetFile=packages-utils%2Fwebiny-file-storage-local%2Fpackage.json)
[Amazon S3](https://github.com/webiny/webiny-js/tree/master/packages-utils/webiny-file-storage-s3) | AWS S3 driver for `webiny-file-storage` interface. <br/><br/> [![Known Vulnerabilities](https://snyk.io/test/github/webiny/webiny-js/badge.svg?targetFile=packages-utils%2Fwebiny-file-storage-s3%2Fpackage.json)](https://snyk.io/test/github/webiny/webiny-js?targetFile=packages-utils%2Fwebiny-file-storage-s3%2Fpackage.json)

## Database utilities
A set of packages that makes working with databases (eg. MySQL )easier.

| Package | About
| --- | --- |
[MySQL Connection](https://github.com/webiny/webiny-js/tree/master/packages-utils/webiny-mysql-connection) | A simple wrapper over node mysql package - simplifies usage and replaces callbacks with promises. <br/><br/> [![Known Vulnerabilities](https://snyk.io/test/github/webiny/webiny-js/badge.svg?targetFile=packages-utils%2Fwebiny-mysql-connection%2Fpackage.json)](https://snyk.io/test/github/webiny/webiny-js?targetFile=packages-utils%2Fwebiny-mysql-connection%2Fpackage.json)
[SQL Table](https://github.com/webiny/webiny-js/tree/master/packages-utils/webiny-sql-table) | Enables defining tables within application code, which can later be used to create / update tables in a real database.<br/><br/> [![Known Vulnerabilities](https://snyk.io/test/github/webiny/webiny-js/badge.svg?targetFile=packages-utils%2Fwebiny-sql-table%2Fpackage.json)](https://snyk.io/test/github/webiny/webiny-js?targetFile=packages-utils%2Fwebiny-sql-table%2Fpackage.json)
[MySQL Table](https://github.com/webiny/webiny-js/tree/master/packages-utils/webiny-sql-table-mysql) | MySQL driver for `webiny-sql-table` package, which enables defining tables for MySQL databases.<br/><br/> [![Known Vulnerabilities](https://snyk.io/test/github/webiny/webiny-js/badge.svg?targetFile=packages-utils%2Fwebiny-sql-table-mysql%2Fpackage.json)](https://snyk.io/test/github/webiny/webiny-js?targetFile=packages-utils%2Fwebiny-sql-table-mysql%2Fpackage.json)
[SQL Table Sync](https://github.com/webiny/webiny-js/tree/master/packages-utils/webiny-sql-table-sync) | A tool that works with `webiny-sql-table` tables, and syncs table structures in a real database instances.<br/><br/> [![Known Vulnerabilities](https://snyk.io/test/github/webiny/webiny-js/badge.svg?targetFile=packages-utils%2Fwebiny-sql-table-sync%2Fpackage.json)](https://snyk.io/test/github/webiny/webiny-js?targetFile=packages-utils%2Fwebiny-sql-table-sync%2Fpackage.json)

## Other
Other useful packages.

| Package | About
| --- | --- |
[Compose](https://github.com/webiny/webiny-js/tree/master/packages-utils/webiny-cli) | Compose multiple functions into a connect-style middleware. <br/><br/> [![Known Vulnerabilities](https://snyk.io/test/github/webiny/webiny-js/badge.svg?targetFile=packages-utils%2Fwebiny-compose%2Fpackage.json)](https://snyk.io/test/github/webiny/webiny-js?targetFile=packages-utils%2Fwebiny-cli%2Fpackage.json)
[Data Extractor](https://github.com/webiny/webiny-js/tree/master/packages-utils/webiny-data-extractor) | A small library for easy async data extraction, using dot and square brackets notation. <br/><br/> [![Known Vulnerabilities](https://snyk.io/test/github/webiny/webiny-js/badge.svg?targetFile=packages-utils%2Fwebiny-data-extractor%2Fpackage.json)](https://snyk.io/test/github/webiny/webiny-js?targetFile=packages-utils%2Fwebiny-data-extractor%2Fpackage.json)
[Webiny JIMP](https://github.com/webiny/webiny-js/tree/master/packages-utils/webiny-model) | A wrapper for JIMP image processing library. <br/><br/> [![Known Vulnerabilities](https://snyk.io/test/github/webiny/webiny-js/badge.svg?targetFile=packages-utils%2Fwebiny-model%2Fpackage.json)](https://snyk.io/test/github/webiny/webiny-js?targetFile=packages-utils%2Fwebiny-model%2Fpackage.json)  
[Model](https://github.com/webiny/webiny-js/tree/master/packages-utils/webiny-model) | Model, store and validate data using models. <br/><br/> [![Known Vulnerabilities](https://snyk.io/test/github/webiny/webiny-js/badge.svg?targetFile=packages-utils%2Fwebiny-model%2Fpackage.json)](https://snyk.io/test/github/webiny/webiny-js?targetFile=packages-utils%2Fwebiny-model%2Fpackage.json) 
[Scripts](https://github.com/webiny/webiny-js/tree/master/packages-utils/webiny-scripts) | A set of utility scripts for development and production builds (currently used with `webiny-client` projects). <br/><br/> [![Known Vulnerabilities](https://snyk.io/test/github/webiny/webiny-js/badge.svg?targetFile=packages-utils%2Fwebiny-scripts%2Fpackage.json)](https://snyk.io/test/github/webiny/webiny-js?targetFile=packages-utils%2Fwebiny-scripts%2Fpackage.json)
[Validation](https://github.com/webiny/webiny-js/tree/master/packages-utils/webiny-validation)| A simple, pluginable and async data validation library, packed with frequently used validators like `required`, `email`, `url`, `creditCard` etc. <br/><br/> [![Known Vulnerabilities](https://snyk.io/test/github/webiny/webiny-js/badge.svg?targetFile=packages-utils%2Fwebiny-validation%2Fpackage.json)](https://snyk.io/test/github/webiny/webiny-js?targetFile=packages-utils%2Fwebiny-validation%2Fpackage.json)
[Service Manager](https://github.com/webiny/webiny-js/tree/master/packages-utils/webiny-service-manager)| A simple service manager. <br/><br/> [![Known Vulnerabilities](https://snyk.io/test/github/webiny/webiny-js/badge.svg?targetFile=packages-utils%2Fwebiny-service-manager%2Fpackage.json)](https://snyk.io/test/github/webiny/webiny-js?targetFile=packages-utils%2Fwebiny-service-manager%2Fpackage.json)
