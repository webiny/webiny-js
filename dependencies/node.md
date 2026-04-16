# Node Dependencies - Alternatives

## @aws-sdk/client-_, @aws-sdk/lib-_, @aws-sdk/credential-providers, @aws-sdk/s3-presigned-post, @aws-sdk/s3-request-presigner, @aws-sdk/util-dynamodb

Status: ok

## @smithy/node-http-handler

Status: ok

## @pulumi/aws, @pulumi/pulumi, @pulumi/random

Status: ok

## @opensearch-project/opensearch

Status: ok

## @fastify/aws-lambda, @fastify/compress, @fastify/cookie, fastify

Status: ok

## dynamodb-toolbox

Status: ok
Currently 0.9.5. v1 is available with improved types and API.
https://github.com/jeremydaly/dynamodb-toolbox

## jest-dynalite

Status: ok

## aws-sdk-client-mock

Status: ok

## aws-amplify

Status: ok

## nodemailer

Status: ok

## pino, pino-lambda, pino-pretty

Status: ok

## sharp

Status: ok

## archiver

Status: ok

## adm-zip

Status: ok

## unzipper

Status: ok

## decompress

Status: replace
Last published 2020. Use `adm-zip` (already in deps) for zip, or `node:zlib` + `tar` (already in deps) for tarballs.

## ncp

Status: replace
Last published 2015. Use `fs.cpSync` (built-in Node 22+).

```js
import { cpSync } from "node:fs";
cpSync(src, dest, { recursive: true });
```

## fs-extra

Status: reduce
Node 22+ has `fs.cpSync`, `fs.rmSync({ recursive: true })`, `fs.mkdirSync({ recursive: true })`. Only keep if `ensureDir`, `outputJson`, or `move` are heavily used.

## verdaccio

Status: ok

## execa

Status: ok
Note: `node:child_process` `execFileSync`/`spawn` covers simple cases without the dependency.

## rimraf

Status: replace
Use `fs.rmSync` (built-in Node 22+).

```js
import { rmSync } from "node:fs";
rmSync(dir, { recursive: true, force: true });
```

## chokidar

Status: ok
Note: `fs.watch` with `{ recursive: true }` works on macOS/Windows in Node 22+, but chokidar is more reliable cross-platform.

## tar

Status: ok

## mqtt

Status: ok

## @grpc/grpc-js

Status: ok

## @octokit/rest

Status: ok

## @auth0/auth0-spa-js

Status: ok

## @okta/okta-auth-js

Status: ok

## jose

Status: ok

## jsonwebtoken

Status: replace
Use `jose` (already in deps). Modern, ESM-native, uses Web Crypto, works in both Node and browser.

```js
import { SignJWT, jwtVerify } from "jose";
const secret = new TextEncoder().encode("secret");
const token = await new SignJWT({ sub: "user" }).setProtectedHeader({ alg: "HS256" }).sign(secret);
```

## next

Status: ok

## webpack

Status: replace
`@rsbuild/core` and `@rspack/core` are already in deps. Migrate remaining webpack configs to rspack (drop-in compatible, 10x faster).

## @svgr/webpack

Status: replace
Use `@rsbuild/plugin-svgr` (already in deps) when migrating off webpack.

## babel-loader

Status: replace
rspack uses SWC natively. No loader needed.

## css-loader, style-loader, sass-loader, postcss-loader, url-loader, raw-loader, file-loader

Status: replace
All webpack loaders. rspack/rsbuild handle CSS, Sass, PostCSS, and assets natively via built-in modules. Remove when migrating off webpack.

## @rsbuild/core, @rsbuild/plugin-react, @rsbuild/plugin-sass, @rsbuild/plugin-svgr, @rsbuild/plugin-type-check, @rspack/core

Status: ok

## sass

Status: ok

## postcss, postcss-import

Status: ok

## @tailwindcss/postcss, tailwindcss

Status: ok
