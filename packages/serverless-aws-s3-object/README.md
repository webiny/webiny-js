# aws-s3

Instantly deploy and manage your S3 buckets with [Serverless Components](https://github.com/serverless/components). Supports acceleration as well as file & directory uploads.

&nbsp;

1. [Install](#1-install)
2. [Create](#2-create)
3. [Configure](#3-configure)
4. [Deploy](#4-deploy)
5. [Upload](#5-upload)

&nbsp;


### 1. Install

```console
$ npm install -g serverless
```

### 2. Create

Just create a `serverless.yml` file

```console
$ touch serverless.yml
$ touch .env      # your AWS api keys
```

```
# .env
AWS_ACCESS_KEY_ID=XXX
AWS_SECRET_ACCESS_KEY=XXX
```


### 3. Configure

```yml
# serverless.yml

myBucket:
  component: "@serverless/aws-s3"
  inputs:
    accelerated: false # default is true. Enables upload acceleartion for the bucket
    region: us-east-1
    cors:
      CORSRules:
      - AllowedHeaders:
        - "*"
        AllowedMethods:
        - PUT
        - POST
        - DELETE
        AllowedOrigins:
        - http://www.example.com
        MaxAgeSeconds: 3000

```

### 4. Deploy

```console
$ serverless
```

### 5. Upload
If you're using this component programmatically within another component, you could also easily upload files and/or directories to your bucket.
 
```js

const bucket = await this.load('@serverless/aws-s3')

// deploy
await bucket({
  accelerated: true
})

// upload directory
await bucket.upload({ dir: './my-files' })

// upload file
await bucket.upload({ file: './my-file.txt' })

```

[Cache-control](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control) headers can also be set:

```js

// upload directory, setting cache-control headers
await bucket.upload({ dir: './my-files', cacheControl: 'max-age=86400' })

// upload file, setting cache-control header
await bucket.upload({ file: './my-file.txt', cacheControl: 'max-age=86400' })
```

For a full example on how this component could be used, [take a look at how the website component is using it](https://github.com/serverless-components/website/).

&nbsp;

### New to Components?

Checkout the [Serverless Components](https://github.com/serverless/components) repo for more information.
