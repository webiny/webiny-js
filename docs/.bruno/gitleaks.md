# Gitleaks findings

Scan: `gitleaks git --verbose` (gitleaks 8.30.1), branch `next`, 2026-10-09.
21,834 commits scanned, **109 findings**, **39 unique values**.

Status (2026-10-12): **all findings reviewed and resolved**, including a TruffleHog cross-check (see below). `gitleaks git` with `.gitleaks.toml` reports no leaks.
`gitleaks dir` reports no leaks in tracked files.

Secret values in this file are cut to 8 characters. Run gitleaks locally to see full values.
Each real-looking key has a Where / URLs / Verified / Action comment in `.gitleaks.toml`.

## How findings are allowlisted

- **Made-up and test values still in the codebase:** exact-value `regexes` (L01, L02, L17, L28, L29).
- **Vendored Yarn bundles:** `paths` (L18, L24).
- **Old commits with test fixtures and file keys only:** one `commits` list.
- **Real-looking keys:** one `[[allowlists]]` block per key, by `commits`.

## Summary

| ID | Rule | Hits | Where | In HEAD | Result |
|----|------|------|-------|---------|--------|
| L01 | azure-ad-client-secret | 5 | `skills/user-skills/configure-entraid/SKILL.md` | yes | Made-up example value. Allowlisted by value. |
| L02 | generic-api-key | 1 | `packages/api-wcp/__tests__/utils.test.ts` (now `packages/api-core/__tests__/wcp/utils.test.ts`) | yes | Dummy test value. Allowlisted by value. |
| L03 | generic-api-key | 2 | `packages-utils/webiny-file-storage-s3/tests/s3MockResponses.js` | no | S3 mock token. Old test fixture. |
| L04 | generic-api-key | 1 | `packages/api-wcp/src/utils.ts` (`5584544a48`, 2022) | no | Confirmed safe by WCP owner. WCP dev environment key, removed 2 hours later in `1ebc376880`. Dev endpoint `d16nfk35w3a3cu.cloudfront.net` no longer resolves. |
| L05–L13 | generic-api-key | 15 | security mocks, `App.editor.tsx`, page builder install data, file manager upgrade | no | File keys (`*.jpg`, `*.svg`). Old fixtures. |
| L14 | generic-api-key | 3 | `packages/{webiny-api-headless,api-headless-cms}/IDEAS.md` (2019–2020) | no | Safe. Contentful delivery token is still active (HTTP 200), but read-only and for a test space. Accepted. |
| L15 | generic-api-key | 1 | `.npmrc` (`1b8335aa7a`, 2018) | no | Confirmed safe. Token for internal Verdaccio registry `webiny-npm:4873`, long gone. npm tokens rotate every 90 days. |
| L16 | generic-api-key | 1 | `packages/api-mailer/__tests__/password.test.ts` | no | Test password. |
| L17 | generic-api-key | 6 | `api-prerendering-service/__tests__/.../extractPeLoaderDataFromHtml.test.ts` | yes | HTML `data-key` attribute. Allowlisted by value. |
| L18, L24 | generic-api-key | 4 | `.yarn/releases/*.cjs`, `create-webiny-project/utils/binaries/yarn-*.cjs` | no | Minified Yarn bundles. Allowlisted by path. |
| L19 | generic-api-key | 6 | telemetry / tracking packages (2020–2021) | no | Confirmed safe by telemetry owner. Write-only telemetry key, public by design. Removed in `16b0da12a4` (2024-03). Current `@webiny/wts-client` sends no key. |
| L20 | generic-api-key | 2 | `postman.json` (`2b9830fd10`, 2025) | no | Flagged value is a Marketo tracking cookie. See "Kibo" below. |
| L21 | generic-api-key | 6 | `pagesFilesData.json/.js` | no | File keys (`*.jpeg`). Old fixtures. |
| L22 | generic-api-key | 1 | `nextjs/__mocks__/stories/userMock.ts` (2025) | no | Kibo refresh token, expired 2022. See "Kibo" below. |
| L23 | generic-api-key | 2 | `api-security/__tests__/*.test.js` | no | Test PAT. |
| L25 | generic-api-key | 4 | `packages/app-website-builder/planning/*.js` | yes | Example value. SpaceX API v5 needs no key, and the API fails anyway. Files are not imported. Kept as is, allowlisted by value. |
| L26 | generic-api-key | 1 | `project-utils/__tests__/.../telemetryFunction.test.ts` | no | Test constant. |
| L27 | generic-api-key | 1 | `packages/pulumi-aws/src/apps/api/ApiCloudfront.ts` | no | Resource name, not a secret. |
| L28 | generic-api-key | 6 | `extensions/MyApiKey.ts`, SDK skill docs, tests | yes | Placeholder `wat_12345678`. Allowlisted by value. |
| L29 | generic-api-key | 31 | `packages/webhooks/__tests__/**`, webhook plan docs | yes | Test signing secret. Allowlisted by value. |
| L30–L33 | github-pat | 4 | `packages/cli-plugin-scaffold-ci/src/**` (2021) | no | Safe. GitHub API returns 401 for all 4 tokens (checked 2026-10-09). Revoked. |
| L34–L35 | jwt | 2 | `kiboAuthToken.ts`, `useGetEcommerceSettings.ts` (2025) | no | Kibo access tokens, expired 2025-06-12 and 2025-07-10. See "Kibo" below. |
| L36–L37 | jwt | 2 | `api-headless-cms/.../authentication.ts`, `examples/spa/.../app.js` | no | Webiny user JWTs, expired 2020-07-23 and 2018-04-17. |
| L38–L39 | jwt | 2 | `nextjs/__mocks__/stories/userMock.ts` (2025) | no | Kibo access tokens, expired 2022. See "Kibo" below. |

"In HEAD" = file still exists on `next`. "no" = only in history.

## Kibo credentials (not flagged by gitleaks)

`postman.json` in commit `2b9830fd10` (Pavel, 2025-06-12, "wip: ecommerce plugin") also holds a Kibo
OAuth credential pair at lines 220–234: `apihost`, `applicationKey` (client_id) and `sharedSecret` (client_secret).
Gitleaks does not flag it because the key name and the value are on separate JSON lines.
The file was deleted in `e53eceafb5` (2025-07-29). It stays in public history.

- Commit: https://github.com/webiny/webiny-js/commit/2b9830fd10014d173b4aca58c50bd078c0754fb1
- File: https://github.com/webiny/webiny-js/blob/2b9830fd10014d173b4aca58c50bd078c0754fb1/postman.json#L220-L234

Result: confirmed dead (2026-10-12). Pavel confirmed the Kibo keys are old and no longer valid.

## TruffleHog cross-check

Scan: `trufflehog git file://. --no-verification --json` (trufflehog 3.99.2), 2026-10-12.
195 hits, 0 verified (no network calls). The default gitleaks rules do not flag T01-T03. The custom rules below now do,
and T01-T03 are allowlisted by commit in `.gitleaks.toml`.

### Real credentials missed by gitleaks (all dead)

| ID | What | Where | Commit | Check | Result |
|----|------|-------|--------|-------|--------|
| T01 | MongoDB Atlas, user `adrian`, cluster `adriantest-kvgdz` | `scripts/setupCiCypress.js` L14 | `12bf97a40c` (Adrian, 2020-08-02) | `_mongodb._tcp.adriantest-kvgdz.mongodb.net` SRV: NXDOMAIN | Safe. Cluster deleted. |
| T02 | MongoDB Atlas, user `webiny-sls`, cluster `webiny-sls-ddei2` | `serverless.yaml` L32 | `4281032220` (Pavel, 2019-08-04) | `_mongodb._tcp.webiny-sls-ddei2.mongodb.net` SRV: NXDOMAIN | Safe. Cluster deleted. |
| T03 | RDS MySQL production password, host `webiny.c8xvs8v5ria6.eu-west-1.rds.amazonaws.com` | `examples/{api,graphql}/src/configs/database.js` L17, and `dist/configs/database.js` inside `examples/{api,graphql}/.serverless/webiny-demo.zip` | 7 commits, `e5f8cb603a` (2018-03-26) to `d2e3c254fa` (2018-06-25) | host: NXDOMAIN | Safe. Instance deleted. |

T03 was not flagged by TruffleHog either. It was found while inspecting the zip for other hits.

- T01: https://github.com/webiny/webiny-js/blob/12bf97a40c52518c0983746a0f95c877b4025f42/scripts/setupCiCypress.js#L14
- T02: https://github.com/webiny/webiny-js/blob/4281032220eb2a2c2a04083ab343129c2d0c4cbf/serverless.yaml#L32
- T03: https://github.com/webiny/webiny-js/blob/e5f8cb603acd7eaeaac337750565e3c5b0b14f81/examples/api/src/configs/database.js#L17
- T03: https://github.com/webiny/webiny-js/blob/bfb347287726faf8d20f895932fbee47b739756b/examples/graphql/src/configs/database.js#L17

### Already known

- `Github` (4): the L30-L33 PATs. Revoked.
- `Azure` (6): the L01 made-up Entra value, including its copy in `.gitleaks.toml`.

### Noise

- `FlatIO` (60), `TLy` (1): integrity hashes in `yarn.lock`.
- `NpmToken` (20), `Gitlab` (14): minified code in `.yarn/releases/yarn-4.*.cjs`.
- `PrivateKey` (5): library test fixtures inside `webiny-demo.zip` (`jsonwebtoken/test/*.pem`, `h2o2/test`, `http-signature` docs).
- `GitHubOauth2` (56): commit hashes in `jsonwebtoken/CHANGELOG.md` inside `webiny-demo.zip`.
- `URI` (19): `user:pass@` example URLs in library docs inside the zips, and test URLs in `packages/validation/__tests__/url.test.js`.
- `Box` (4): Adobe `mbox=session#...` cookie in `postman.json`, and random strings in an SVG and `package-lock.json`.
- `Circle` (2), `Sirv` (1), `Netlify` (1): random strings in `node_modules.zip`, an SVG and `Comments.tsx`.

## Custom gitleaks rules

Added 2026-10-12 to `.gitleaks.toml`. They cover secret formats the default rules missed in this review.
Tested against full history before adding.

| Rule | Catches | Would have caught | Allowlist |
|------|---------|-------------------|-----------|
| `json-key-value-secret` | `{"key": "...secret/token/password/apiKey/clientId...", "value": "..."}` pairs, also across lines (Postman environments) | Kibo `applicationKey` and `sharedSecret` in `postman.json` | entropy >= 3.0 |
| `connection-string-credentials` | `mongodb`, `postgres`, `mysql`, `mariadb`, `redis`, `amqp` URIs with `user:password@` | T01, T02 | placeholders `{...}`, `<...>`, `${...}` |
| `config-password` | `password: "..."` / `password = "..."` with 8+ characters | T03 | entropy >= 3.5; skips `__tests__/`, `__mocks__/`, `*.test.*` |

Test run before tuning: 16 new hits. 6 real (T01, T02, T03 in 3 commits, all dead), 10 false positives
(test files for `config-password`, and the `CONTRIBUTING.md` placeholder for `connection-string-credentials`).
After tuning and allowlisting T01-T03: `gitleaks git` and `gitleaks dir` report no leaks.

Tradeoff: `config-password` ignores test files, so a real password in a test file is not caught by that rule.

## Details

Each fingerprint (`commit:file:rule:line`) can go to `.gitleaksignore` as-is.

### L01 — `azure-ad-client-secret` — 5 hit(s)

- Match: `=~Gp7Q~97…`
- Occurrences (`commit:file:line` = fingerprint):
  - `a145f9ed5d7a0e26ffb4d4885ea3b4a9d59ce1fa:skills/user-skills/configure-entraid/SKILL.md:azure-ad-client-secret:61` (2026-07-07, Pavel Denisjuk) [view](https://github.com/webiny/webiny-js/blob/a145f9ed5d7a0e26ffb4d4885ea3b4a9d59ce1fa/skills/user-skills/configure-entraid/SKILL.md#L61)
  - `f95501c5136dabc42f716ffaed4e3aa52b34df55:skills/user-skills/configure-entraid/SKILL.md:azure-ad-client-secret:99` (2026-07-08, Pavel Denisjuk) [view](https://github.com/webiny/webiny-js/blob/f95501c5136dabc42f716ffaed4e3aa52b34df55/skills/user-skills/configure-entraid/SKILL.md#L99)
  - `c6222c67d7f8c181d637b920e091d5663bdd025d:skills/user-skills/configure-entraid/SKILL.md:azure-ad-client-secret:99` (2026-07-08, Pavel Denisjuk) [view](https://github.com/webiny/webiny-js/blob/c6222c67d7f8c181d637b920e091d5663bdd025d/skills/user-skills/configure-entraid/SKILL.md#L99)
  - `1d272f5636f8b5832fa4ba8847d2529602a6b2c6:skills/user-skills/configure-entraid/SKILL.md:azure-ad-client-secret:99` (2026-07-12, Pavel Denisjuk) [view](https://github.com/webiny/webiny-js/blob/1d272f5636f8b5832fa4ba8847d2529602a6b2c6/skills/user-skills/configure-entraid/SKILL.md#L99)
  - `9f196e021a3117abffb180b2e7f3ec0fae49cf45:skills/user-skills/configure-entraid/SKILL.md:azure-ad-client-secret:99` (2026-07-13, Pavel Denisjuk) [view](https://github.com/webiny/webiny-js/blob/9f196e021a3117abffb180b2e7f3ec0fae49cf45/skills/user-skills/configure-entraid/SKILL.md#L99)

### L02 — `generic-api-key` — 1 hit(s)

- Match: `apiKey: "0fc47574…"`
- Occurrences (`commit:file:line` = fingerprint):
  - `8d258aa2ebd8562b79e395d7aeea6316405f7f4e:packages/api-wcp/__tests__/utils.test.ts:generic-api-key:5` (2022-08-16, Bruno Zorić) [view](https://github.com/webiny/webiny-js/blob/8d258aa2ebd8562b79e395d7aeea6316405f7f4e/packages/api-wcp/__tests__/utils.test.ts#L5)

### L03 — `generic-api-key` — 2 hit(s)

- Match: `NextContinuationToken: "1w41l63U…"`
- Occurrences (`commit:file:line` = fingerprint):
  - `4b3ef9d890ef313694d39b8c0c0df21d76e5d096:packages-utils/webiny-file-storage-s3/tests/s3MockResponses.js:generic-api-key:57` (2018-01-27, SvenAlHamad) [view](https://github.com/webiny/webiny-js/blob/4b3ef9d890ef313694d39b8c0c0df21d76e5d096/packages-utils/webiny-file-storage-s3/tests/s3MockResponses.js#L57)
  - `4f98ecb47fbb2358e912e7945d95c464df14d82f:packages-utils/webiny-file-storage-s3/tests/s3MockResponses.js:generic-api-key:87` (2018-02-10, Pavel910) [view](https://github.com/webiny/webiny-js/blob/4f98ecb47fbb2358e912e7945d95c464df14d82f/packages-utils/webiny-file-storage-s3/tests/s3MockResponses.js#L87)

### L04 — `generic-api-key` — 1 hit(s)

- Match: `apiKey":"5d155766…"`
- Occurrences (`commit:file:line` = fingerprint):
  - `5584544a48cc82ddfbc1936614b5a196353ef6b0:packages/api-wcp/src/utils.ts:generic-api-key:7` (2022-05-24, Adrian Smijulj) [view](https://github.com/webiny/webiny-js/blob/5584544a48cc82ddfbc1936614b5a196353ef6b0/packages/api-wcp/src/utils.ts#L7)

### L05 — `generic-api-key` — 6 hit(s)

- Match: `key: "8kgvqs3i…"`
- Occurrences (`commit:file:line` = fingerprint):
  - `e76121574fd232826617bca48aead55ad5cb48a4:packages/api-security-tenancy/__tests__/mocks/securityUser.js:generic-api-key:5` (2020-11-12, Pavel Denisjuk) [view](https://github.com/webiny/webiny-js/blob/e76121574fd232826617bca48aead55ad5cb48a4/packages/api-security-tenancy/__tests__/mocks/securityUser.js#L5)
  - `e76121574fd232826617bca48aead55ad5cb48a4:packages/api-security-tenancy/__tests__/mocks/securityUser.js:generic-api-key:14` (2020-11-12, Pavel Denisjuk) [view](https://github.com/webiny/webiny-js/blob/e76121574fd232826617bca48aead55ad5cb48a4/packages/api-security-tenancy/__tests__/mocks/securityUser.js#L14)
  - `e76121574fd232826617bca48aead55ad5cb48a4:packages/api-security-tenancy/__tests__/mocks/securityUser.js:generic-api-key:23` (2020-11-12, Pavel Denisjuk) [view](https://github.com/webiny/webiny-js/blob/e76121574fd232826617bca48aead55ad5cb48a4/packages/api-security-tenancy/__tests__/mocks/securityUser.js#L23)
  - `3b6a18f94afde4cacb32f3f7b8b9b7e1f9902231:packages/api-security-user-management/__tests__/mocks/securityUser.js:generic-api-key:5` (2020-10-30, Ashutosh) [view](https://github.com/webiny/webiny-js/blob/3b6a18f94afde4cacb32f3f7b8b9b7e1f9902231/packages/api-security-user-management/__tests__/mocks/securityUser.js#L5)
  - `3b6a18f94afde4cacb32f3f7b8b9b7e1f9902231:packages/api-security-user-management/__tests__/mocks/securityUser.js:generic-api-key:14` (2020-10-30, Ashutosh) [view](https://github.com/webiny/webiny-js/blob/3b6a18f94afde4cacb32f3f7b8b9b7e1f9902231/packages/api-security-user-management/__tests__/mocks/securityUser.js#L14)
  - `3b6a18f94afde4cacb32f3f7b8b9b7e1f9902231:packages/api-security-user-management/__tests__/mocks/securityUser.js:generic-api-key:23` (2020-10-30, Ashutosh) [view](https://github.com/webiny/webiny-js/blob/3b6a18f94afde4cacb32f3f7b8b9b7e1f9902231/packages/api-security-user-management/__tests__/mocks/securityUser.js#L23)

### L06 — `generic-api-key` — 1 hit(s)

- Match: `key: "8kgw5rpy…"`
- Occurrences (`commit:file:line` = fingerprint):
  - `7bf1eab0aa25c1d70d2991e84d213a8ee5102b26:apps/admin/code/src/App.editor.tsx:generic-api-key:30` (2020-10-31, Pavel Denisjuk) [view](https://github.com/webiny/webiny-js/blob/7bf1eab0aa25c1d70d2991e84d213a8ee5102b26/apps/admin/code/src/App.editor.tsx#L30)

### L07 — `generic-api-key` — 1 hit(s)

- Match: `key: "8kkxzkhv…"`
- Occurrences (`commit:file:line` = fingerprint):
  - `12aaebae4e4d5f19aebee478d81a33ac9b249c53:packages/api-page-builder/src/graphql/graphql/install/welcome-to-webiny-page-data.ts:generic-api-key:3521` (2021-02-12, Ashutosh) [view](https://github.com/webiny/webiny-js/blob/12aaebae4e4d5f19aebee478d81a33ac9b249c53/packages/api-page-builder/src/graphql/graphql/install/welcome-to-webiny-page-data.ts#L3521)

### L08 — `generic-api-key` — 1 hit(s)

- Match: `key: "8kkxzki0…"`
- Occurrences (`commit:file:line` = fingerprint):
  - `12aaebae4e4d5f19aebee478d81a33ac9b249c53:packages/api-page-builder/src/graphql/graphql/install/welcome-to-webiny-page-data.ts:generic-api-key:1710` (2021-02-12, Ashutosh) [view](https://github.com/webiny/webiny-js/blob/12aaebae4e4d5f19aebee478d81a33ac9b249c53/packages/api-page-builder/src/graphql/graphql/install/welcome-to-webiny-page-data.ts#L1710)

### L09 — `generic-api-key` — 1 hit(s)

- Match: `key: "8kkxzki2…"`
- Occurrences (`commit:file:line` = fingerprint):
  - `50c2e2d134d2b7eac8dbdcb05754ff761a903aff:packages/api-page-builder/src/graphql/crud/install/welcome-to-webiny-page-data.ts:generic-api-key:2557` (2021-08-02, Pavel Denisjuk) [view](https://github.com/webiny/webiny-js/blob/50c2e2d134d2b7eac8dbdcb05754ff761a903aff/packages/api-page-builder/src/graphql/crud/install/welcome-to-webiny-page-data.ts#L2557)

### L10 — `generic-api-key` — 2 hit(s)

- Match: `key: "8kkxzki3…"`
- Occurrences (`commit:file:line` = fingerprint):
  - `12aaebae4e4d5f19aebee478d81a33ac9b249c53:packages/api-page-builder/src/graphql/graphql/install/welcome-to-webiny-page-data.ts:generic-api-key:2361` (2021-02-12, Ashutosh) [view](https://github.com/webiny/webiny-js/blob/12aaebae4e4d5f19aebee478d81a33ac9b249c53/packages/api-page-builder/src/graphql/graphql/install/welcome-to-webiny-page-data.ts#L2361)
  - `12aaebae4e4d5f19aebee478d81a33ac9b249c53:packages/api-page-builder/src/graphql/graphql/install/welcome-to-webiny-page-data.ts:generic-api-key:4037` (2021-02-12, Ashutosh) [view](https://github.com/webiny/webiny-js/blob/12aaebae4e4d5f19aebee478d81a33ac9b249c53/packages/api-page-builder/src/graphql/graphql/install/welcome-to-webiny-page-data.ts#L4037)

### L11 — `generic-api-key` — 1 hit(s)

- Match: `key: "8kkxzki4…"`
- Occurrences (`commit:file:line` = fingerprint):
  - `50c2e2d134d2b7eac8dbdcb05754ff761a903aff:packages/api-page-builder/src/graphql/crud/install/welcome-to-webiny-page-data.ts:generic-api-key:2119` (2021-08-02, Pavel Denisjuk) [view](https://github.com/webiny/webiny-js/blob/50c2e2d134d2b7eac8dbdcb05754ff761a903aff/packages/api-page-builder/src/graphql/crud/install/welcome-to-webiny-page-data.ts#L2119)

### L12 — `generic-api-key` — 1 hit(s)

- Match: `key: "8klunupd…"`
- Occurrences (`commit:file:line` = fingerprint):
  - `f4d2b5e73c899077cb1207940f2ab169a880aec9:packages/api-file-manager/src/plugins/upgrades/v5.0.0/index.ts:generic-api-key:112` (2021-03-08, Pavel Denisjuk) [view](https://github.com/webiny/webiny-js/blob/f4d2b5e73c899077cb1207940f2ab169a880aec9/packages/api-file-manager/src/plugins/upgrades/v5.0.0/index.ts#L112)

### L13 — `generic-api-key` — 1 hit(s)

- Match: `key: "9kkxzki5…"`
- Occurrences (`commit:file:line` = fingerprint):
  - `12aaebae4e4d5f19aebee478d81a33ac9b249c53:packages/api-page-builder/src/graphql/graphql/install/welcome-to-webiny-page-data.ts:generic-api-key:140` (2021-02-12, Ashutosh) [view](https://github.com/webiny/webiny-js/blob/12aaebae4e4d5f19aebee478d81a33ac9b249c53/packages/api-page-builder/src/graphql/graphql/install/welcome-to-webiny-page-data.ts#L140)

### L14 — `generic-api-key` — 3 hit(s)

- Match: `access_token=FD1uQl5i…`
- Occurrences (`commit:file:line` = fingerprint):
  - `b597aa7945a4b52325072158f64ed7d5c122b4a0:packages/api-headless-cms/IDEAS.md:generic-api-key:23` (2020-01-28, Pavel Denisjuk) [view](https://github.com/webiny/webiny-js/blob/b597aa7945a4b52325072158f64ed7d5c122b4a0/packages/api-headless-cms/IDEAS.md#L23)
  - `f07e856a3bc99332d26c0888252a63195107f406:packages/api-headless-cms/IDEAS.md:generic-api-key:23` (2020-01-28, Pavel Denisjuk) [view](https://github.com/webiny/webiny-js/blob/f07e856a3bc99332d26c0888252a63195107f406/packages/api-headless-cms/IDEAS.md#L23)
  - `63487120aa660ee0ae03b7dd4080adac6b608020:packages/webiny-api-headless/IDEAS.md:generic-api-key:23` (2019-06-27, Pavel910) [view](https://github.com/webiny/webiny-js/blob/63487120aa660ee0ae03b7dd4080adac6b608020/packages/webiny-api-headless/IDEAS.md#L23)

### L15 — `generic-api-key` — 1 hit(s)

- Match: `_authToken=FbK1wDkC…`
- Occurrences (`commit:file:line` = fingerprint):
  - `1b8335aa7a9a4d0e819c6dd63bc630258be52959:.npmrc:generic-api-key:2` (2018-06-11, Pavel910) [view](https://github.com/webiny/webiny-js/blob/1b8335aa7a9a4d0e819c6dd63bc630258be52959/.npmrc#L2)

### L16 — `generic-api-key` — 1 hit(s)

- Match: `password = "GZPJWYVI…"`
- Occurrences (`commit:file:line` = fingerprint):
  - `3337e33e11780d045c1a65141dd95701db0e3592:packages/api-mailer/__tests__/password.test.ts:generic-api-key:4` (2022-10-25, Bruno Zorić) [view](https://github.com/webiny/webiny-js/blob/3337e33e11780d045c1a65141dd95701db0e3592/packages/api-mailer/__tests__/password.test.ts#L4)

### L17 — `generic-api-key` — 6 hit(s)

- Match: `key: "GfT8AoRs…"`
- Occurrences (`commit:file:line` = fingerprint):
  - `005dc9feda17c8deb93cfca332148184c5cde150:packages/api-prerendering-service/__tests__/render/extractPeLoaderDataFromHtml.test.ts:generic-api-key:9` (2024-12-05, Adrian Smijulj) [view](https://github.com/webiny/webiny-js/blob/005dc9feda17c8deb93cfca332148184c5cde150/packages/api-prerendering-service/__tests__/render/extractPeLoaderDataFromHtml.test.ts#L9)
  - `005dc9feda17c8deb93cfca332148184c5cde150:packages/api-prerendering-service/__tests__/render/extractPeLoaderDataFromHtml.test.ts:generic-api-key:45` (2024-12-05, Adrian Smijulj) [view](https://github.com/webiny/webiny-js/blob/005dc9feda17c8deb93cfca332148184c5cde150/packages/api-prerendering-service/__tests__/render/extractPeLoaderDataFromHtml.test.ts#L45)
  - `bd1354d8ee670ec47eebfcbcfd8cf09c24b8efc0:packages/api-prerendering-service/__tests__/render/extractPeLoaderDataFromHtml.test.ts:generic-api-key:9` (2024-12-05, Adrian Smijulj) [view](https://github.com/webiny/webiny-js/blob/bd1354d8ee670ec47eebfcbcfd8cf09c24b8efc0/packages/api-prerendering-service/__tests__/render/extractPeLoaderDataFromHtml.test.ts#L9)
  - `bd1354d8ee670ec47eebfcbcfd8cf09c24b8efc0:packages/api-prerendering-service/__tests__/render/extractPeLoaderDataFromHtml.test.ts:generic-api-key:45` (2024-12-05, Adrian Smijulj) [view](https://github.com/webiny/webiny-js/blob/bd1354d8ee670ec47eebfcbcfd8cf09c24b8efc0/packages/api-prerendering-service/__tests__/render/extractPeLoaderDataFromHtml.test.ts#L45)
  - `92a9b5498798ee248db97ce174a370dc9d9b2664:packages/api-prerendering-service/__tests__/render/extractPeLoaderDataFromHtml.test.ts:generic-api-key:17` (2024-12-12, Adrian Smijulj) [view](https://github.com/webiny/webiny-js/blob/92a9b5498798ee248db97ce174a370dc9d9b2664/packages/api-prerendering-service/__tests__/render/extractPeLoaderDataFromHtml.test.ts#L17)
  - `91cf386db2a381d54c584efc6a53d5897a41922c:packages/api-prerendering-service/__tests__/render/extractPeLoaderDataFromHtml.test.ts:generic-api-key:17` (2024-12-12, Adrian Smijulj) [view](https://github.com/webiny/webiny-js/blob/91cf386db2a381d54c584efc6a53d5897a41922c/packages/api-prerendering-service/__tests__/render/extractPeLoaderDataFromHtml.test.ts#L17)

### L18 — `generic-api-key` — 3 hit(s)

- Match: `In.MismatchedTokenException=In.isRec… `
- Occurrences (`commit:file:line` = fingerprint):
  - `12029b4ee322a0b8ad859a193ad57629165df6e4:.yarn/releases/yarn-3.6.3.cjs:generic-api-key:127` (2023-09-13, Bruno Zorić) [view](https://github.com/webiny/webiny-js/blob/12029b4ee322a0b8ad859a193ad57629165df6e4/.yarn/releases/yarn-3.6.3.cjs#L127)
  - `5f045fc16360b859aaf70d39d818eccdeba2d64d:.yarn/releases/yarn-3.6.4.cjs:generic-api-key:127` (2023-10-24, Bruno Zorić) [view](https://github.com/webiny/webiny-js/blob/5f045fc16360b859aaf70d39d818eccdeba2d64d/.yarn/releases/yarn-3.6.4.cjs#L127)
  - `c06ae3884feffb20586f08913d2f2ea9debc77fa:packages/create-webiny-project/utils/binaries/yarn-3.6.4.cjs:generic-api-key:127` (2023-10-24, Bruno Zorić) [view](https://github.com/webiny/webiny-js/blob/c06ae3884feffb20586f08913d2f2ea9debc77fa/packages/create-webiny-project/utils/binaries/yarn-3.6.4.cjs#L127)

### L19 — `generic-api-key` — 6 hit(s)

- Match: `api_key:"ZdDZgkeO…"`
- Occurrences (`commit:file:line` = fingerprint):
  - `8ae7ef62735b7c0dca7caeecfbe9e85c7d52edfb:apps/site/code/app/build-ssr/renderer.js:generic-api-key:84` (2020-09-17, Adrian Smijulj) [view](https://github.com/webiny/webiny-js/blob/8ae7ef62735b7c0dca7caeecfbe9e85c7d52edfb/apps/site/code/app/build-ssr/renderer.js#L84)
  - `348126bcc49fa3c74e60b0b3f91fdf94c82be38b:apps/site/code/app/build-ssr/renderer.js:generic-api-key:48500` (2020-09-18, Adrian Smijulj) [view](https://github.com/webiny/webiny-js/blob/348126bcc49fa3c74e60b0b3f91fdf94c82be38b/apps/site/code/app/build-ssr/renderer.js#L48500)
  - `ad828e19a930be5fa835c040837a0b0d24aa1cd6:packages/app-template/src/telemetry/Telemetry.tsx:generic-api-key:7` (2020-06-28, Pavel Denisjuk) [view](https://github.com/webiny/webiny-js/blob/ad828e19a930be5fa835c040837a0b0d24aa1cd6/packages/app-template/src/telemetry/Telemetry.tsx#L7)
  - `a764e854c5da0ebcb99038e9b9aaf3184202edc3:packages/telemetry/index.js:generic-api-key:4` (2021-08-22, Adrian Smijulj) [view](https://github.com/webiny/webiny-js/blob/a764e854c5da0ebcb99038e9b9aaf3184202edc3/packages/telemetry/index.js#L4)
  - `f36768eeb4c07fc8379e93cadc7a8feec3990b9f:packages/tracking/api.js:generic-api-key:2` (2020-09-08, Pavel Denisjuk) [view](https://github.com/webiny/webiny-js/blob/f36768eeb4c07fc8379e93cadc7a8feec3990b9f/packages/tracking/api.js#L2)
  - `ffa453a305ec2dbce49ee4872ea2744dab7539da:packages/tracking/index.js:generic-api-key:23` (2020-07-07, Pavel Denisjuk) [view](https://github.com/webiny/webiny-js/blob/ffa453a305ec2dbce49ee4872ea2744dab7539da/packages/tracking/index.js#L23)

### L20 — `generic-api-key` — 2 hit(s)

- Match: `token:_mch-moz…;`
- Occurrences (`commit:file:line` = fingerprint):
  - `2b9830fd10014d173b4aca58c50bd078c0754fb1:postman.json:generic-api-key:64` (2025-06-12, Pavel Denisjuk) [view](https://github.com/webiny/webiny-js/blob/2b9830fd10014d173b4aca58c50bd078c0754fb1/postman.json#L64)
  - `2b9830fd10014d173b4aca58c50bd078c0754fb1:postman.json:generic-api-key:124` (2025-06-12, Pavel Denisjuk) [view](https://github.com/webiny/webiny-js/blob/2b9830fd10014d173b4aca58c50bd078c0754fb1/postman.json#L124)

### L21 — `generic-api-key` — 6 hit(s)

- Match: `key": "blonde-6…"`
- Occurrences (`commit:file:line` = fingerprint):
  - `de75c4ca5f6f742e0be96cb8688607387ea2f966:components/serverless-page-builder/installation/importData/pagesFilesData.json:generic-api-key:42` (2019-10-28, Adrian Smijulj) [view](https://github.com/webiny/webiny-js/blob/de75c4ca5f6f742e0be96cb8688607387ea2f966/components/serverless-page-builder/installation/importData/pagesFilesData.json#L42)
  - `de75c4ca5f6f742e0be96cb8688607387ea2f966:components/serverless-page-builder/installation/importData/pagesFilesData.json:generic-api-key:51` (2019-10-28, Adrian Smijulj) [view](https://github.com/webiny/webiny-js/blob/de75c4ca5f6f742e0be96cb8688607387ea2f966/components/serverless-page-builder/installation/importData/pagesFilesData.json#L51)
  - `92b6ba9acb5e5c478f2884aba4dbea0692d158f7:packages/api-page-builder/src/installation/data/pagesFilesData.json:generic-api-key:42` (2020-04-28, Pavel Denisjuk) [view](https://github.com/webiny/webiny-js/blob/92b6ba9acb5e5c478f2884aba4dbea0692d158f7/packages/api-page-builder/src/installation/data/pagesFilesData.json#L42)
  - `92b6ba9acb5e5c478f2884aba4dbea0692d158f7:packages/api-page-builder/src/installation/data/pagesFilesData.json:generic-api-key:51` (2020-04-28, Pavel Denisjuk) [view](https://github.com/webiny/webiny-js/blob/92b6ba9acb5e5c478f2884aba4dbea0692d158f7/packages/api-page-builder/src/installation/data/pagesFilesData.json#L51)
  - `333305660278d906224f907e7e733aa16a0b71bd:packages/api-page-builder/src/plugins/graphql/installResolver/importData/pagesFilesData.js:generic-api-key:42` (2019-10-25, Adrian Smijulj) [view](https://github.com/webiny/webiny-js/blob/333305660278d906224f907e7e733aa16a0b71bd/packages/api-page-builder/src/plugins/graphql/installResolver/importData/pagesFilesData.js#L42)
  - `333305660278d906224f907e7e733aa16a0b71bd:packages/api-page-builder/src/plugins/graphql/installResolver/importData/pagesFilesData.js:generic-api-key:51` (2019-10-25, Adrian Smijulj) [view](https://github.com/webiny/webiny-js/blob/333305660278d906224f907e7e733aa16a0b71bd/packages/api-page-builder/src/plugins/graphql/installResolver/importData/pagesFilesData.js#L51)

### L22 — `generic-api-key` — 1 hit(s)

- Match: `refreshToken: 'cf20cb21…'`
- Occurrences (`commit:file:line` = fingerprint):
  - `2b9830fd10014d173b4aca58c50bd078c0754fb1:nextjs/__mocks__/stories/userMock.ts:generic-api-key:47` (2025-06-12, Pavel Denisjuk) [view](https://github.com/webiny/webiny-js/blob/2b9830fd10014d173b4aca58c50bd078c0754fb1/nextjs/__mocks__/stories/userMock.ts#L47)

### L23 — `generic-api-key` — 2 hit(s)

- Match: `token = "ddbdaade…"`
- Occurrences (`commit:file:line` = fingerprint):
  - `54cdf3b3c3ac7c3a5615d7bcf2317daab2ba7bd2:packages/api-security/__tests__/personalAccessTokens.test.js:generic-api-key:8` (2020-04-16, Fsalker) [view](https://github.com/webiny/webiny-js/blob/54cdf3b3c3ac7c3a5615d7bcf2317daab2ba7bd2/packages/api-security/__tests__/personalAccessTokens.test.js#L8)
  - `0ee998a7cacc80916307bb00289df094bdb983d9:packages/api-security/__tests__/validateAccessToken.test.js:generic-api-key:6` (2020-04-16, Pavel Denisjuk) [view](https://github.com/webiny/webiny-js/blob/0ee998a7cacc80916307bb00289df094bdb983d9/packages/api-security/__tests__/validateAccessToken.test.js#L6)

### L24 — `generic-api-key` — 1 hit(s)

- Match: `dn.MismatchedTokenException=dn.isRec… `
- Occurrences (`commit:file:line` = fingerprint):
  - `fc2f0dafbb036bf26f1c24cce46edbcfcf38cca7:.yarn/releases/yarn-3.1.0.cjs:generic-api-key:92` (2021-12-02, Pavel Denisjuk) [view](https://github.com/webiny/webiny-js/blob/fc2f0dafbb036bf26f1c24cce46edbcfcf38cca7/.yarn/releases/yarn-3.1.0.cjs#L92)

### L25 — `generic-api-key` — 4 hit(s)

- Match: `apiKey: 'f1a790f8…'`
- Occurrences (`commit:file:line` = fingerprint):
  - `17dc16ac71bcb86d9bde8d46b72a25acb392438c:packages/app-website-builder/planning/pageFromTemplate.js:generic-api-key:36` (2025-05-26, Pavel Denisjuk) [view](https://github.com/webiny/webiny-js/blob/17dc16ac71bcb86d9bde8d46b72a25acb392438c/packages/app-website-builder/planning/pageFromTemplate.js#L36)
  - `c8c9498ee69a0b0cd42c872416702121e444778c:packages/app-website-builder/planning/pageFromTemplate.js:generic-api-key:37` (2025-07-29, Pavel Denisjuk) [view](https://github.com/webiny/webiny-js/blob/c8c9498ee69a0b0cd42c872416702121e444778c/packages/app-website-builder/planning/pageFromTemplate.js#L37)
  - `17dc16ac71bcb86d9bde8d46b72a25acb392438c:packages/app-website-builder/planning/pageWithDataSource.js:generic-api-key:14` (2025-05-26, Pavel Denisjuk) [view](https://github.com/webiny/webiny-js/blob/17dc16ac71bcb86d9bde8d46b72a25acb392438c/packages/app-website-builder/planning/pageWithDataSource.js#L14)
  - `c8c9498ee69a0b0cd42c872416702121e444778c:packages/app-website-builder/planning/pageWithDataSource.js:generic-api-key:15` (2025-07-29, Pavel Denisjuk) [view](https://github.com/webiny/webiny-js/blob/c8c9498ee69a0b0cd42c872416702121e444778c/packages/app-website-builder/planning/pageWithDataSource.js#L15)

### L26 — `generic-api-key` — 1 hit(s)

- Match: `VALID_API_KEY = "f79af720…"`
- Occurrences (`commit:file:line` = fingerprint):
  - `a036766272a71b5fc9d355ce2ec1607d2e670020:packages/project-utils/__tests__/bundling/function/telemetryFunction.test.ts:generic-api-key:8` (2022-04-01, Ewan) [view](https://github.com/webiny/webiny-js/blob/a036766272a71b5fc9d355ce2ec1607d2e670020/packages/project-utils/__tests__/bundling/function/telemetryFunction.test.ts#L8)

### L27 — `generic-api-key` — 1 hit(s)

- Match: `DataAccessPointAccount": "fm-bucke…"`
- Occurrences (`commit:file:line` = fingerprint):
  - `9df0fd2ff32b9adb89ee853fed1d54d52a124dd4:packages/pulumi-aws/src/apps/api/ApiCloudfront.ts:generic-api-key:202` (2023-07-05, adrians5j) [view](https://github.com/webiny/webiny-js/blob/9df0fd2ff32b9adb89ee853fed1d54d52a124dd4/packages/pulumi-aws/src/apps/api/ApiCloudfront.ts#L202)

### L28 — `generic-api-key` — 6 hit(s)

- Match: `token: "wat_1234…"`
- Occurrences (`commit:file:line` = fingerprint):
  - `783e017fd38892dcbdf4241de9254720ed80b8e2:extensions/MyApiKey.ts:generic-api-key:8` (2026-01-12, Pavel Denisjuk) [view](https://github.com/webiny/webiny-js/blob/783e017fd38892dcbdf4241de9254720ed80b8e2/extensions/MyApiKey.ts#L8)
  - `bf6459ea0b67c262391b82f24312eaca8320ef4b:packages/api-website-builder/src/features/nextjs/MarkdownContentBuilder.test.ts:generic-api-key:225` (2026-01-17, Pavel Denisjuk) [view](https://github.com/webiny/webiny-js/blob/bf6459ea0b67c262391b82f24312eaca8320ef4b/packages/api-website-builder/src/features/nextjs/MarkdownContentBuilder.test.ts#L225)
  - `81787d12df2a1f439b07418974fc9855ae7645bb:packages/mcp/src/skills/webiny-sdk.md:generic-api-key:218` (2026-03-07, Pavel Denisjuk) [view](https://github.com/webiny/webiny-js/blob/81787d12df2a1f439b07418974fc9855ae7645bb/packages/mcp/src/skills/webiny-sdk.md#L218)
  - `eff151073be651c3a93cdd18a69b7fa24615bf50:skills/user-skills/webiny-sdk/SKILL.md:generic-api-key:231` (2026-03-27, Pavel Denisjuk) [view](https://github.com/webiny/webiny-js/blob/eff151073be651c3a93cdd18a69b7fa24615bf50/skills/user-skills/webiny-sdk/SKILL.md#L231)
  - `0e130a8f74790c5a596199c465a14bb09d1f2da5:skills/user-skills/webiny-sdk/SKILL.md:generic-api-key:333` (2026-05-04, Sven) [view](https://github.com/webiny/webiny-js/blob/0e130a8f74790c5a596199c465a14bb09d1f2da5/skills/user-skills/webiny-sdk/SKILL.md#L333)
  - `4726e699350febb5c063b1b3e54092037a22d7db:skills/user-skills/webiny-sdk/SKILL.md:generic-api-key:333` (2026-05-04, adrians5j) [view](https://github.com/webiny/webiny-js/blob/4726e699350febb5c063b1b3e54092037a22d7db/skills/user-skills/webiny-sdk/SKILL.md#L333)

### L29 — `generic-api-key` — 31 hit(s)

- Match: `signingSecret: "whsec_dG…"`
- Occurrences (`commit:file:line` = fingerprint):
  - `eecafb9dac77a5bf051cce8ef7b258517bbc852d:docs/superpowers/plans/2026-05-17-webhooks-graphql-tests.md:generic-api-key:422` (2026-05-20, Bruno Zorić) [view](https://github.com/webiny/webiny-js/blob/eecafb9dac77a5bf051cce8ef7b258517bbc852d/docs/superpowers/plans/2026-05-17-webhooks-graphql-tests.md#L422)
  - `eecafb9dac77a5bf051cce8ef7b258517bbc852d:docs/superpowers/plans/2026-05-17-webhooks-graphql-tests.md:generic-api-key:832` (2026-05-20, Bruno Zorić) [view](https://github.com/webiny/webiny-js/blob/eecafb9dac77a5bf051cce8ef7b258517bbc852d/docs/superpowers/plans/2026-05-17-webhooks-graphql-tests.md#L832)
  - `eecafb9dac77a5bf051cce8ef7b258517bbc852d:docs/superpowers/plans/2026-05-17-webhooks-graphql-tests.md:generic-api-key:1072` (2026-05-20, Bruno Zorić) [view](https://github.com/webiny/webiny-js/blob/eecafb9dac77a5bf051cce8ef7b258517bbc852d/docs/superpowers/plans/2026-05-17-webhooks-graphql-tests.md#L1072)
  - `4d5533f4513a099c85ad7d535d3324898c4bf9a0:docs/superpowers/plans/2026-05-20-webhook-deliveries-page.md:generic-api-key:145` (2026-05-21, Bruno Zorić) [view](https://github.com/webiny/webiny-js/blob/4d5533f4513a099c85ad7d535d3324898c4bf9a0/docs/superpowers/plans/2026-05-20-webhook-deliveries-page.md#L145)
  - `4d5533f4513a099c85ad7d535d3324898c4bf9a0:docs/superpowers/plans/2026-05-21-webhook-delivery-retention-setting.md:generic-api-key:635` (2026-05-21, Bruno Zorić) [view](https://github.com/webiny/webiny-js/blob/4d5533f4513a099c85ad7d535d3324898c4bf9a0/docs/superpowers/plans/2026-05-21-webhook-delivery-retention-setting.md#L635)
  - `cb6561ad5059748cd55b5d3d6a87f869e261e10a:packages/webhooks/__tests__/SendWebhookTask.test.ts:generic-api-key:22` (2026-05-18, Bruno Zorić) [view](https://github.com/webiny/webiny-js/blob/cb6561ad5059748cd55b5d3d6a87f869e261e10a/packages/webhooks/__tests__/SendWebhookTask.test.ts#L22)
  - `cb6561ad5059748cd55b5d3d6a87f869e261e10a:packages/webhooks/__tests__/WebhookSignPayload.test.ts:generic-api-key:7` (2026-05-18, Bruno Zorić) [view](https://github.com/webiny/webiny-js/blob/cb6561ad5059748cd55b5d3d6a87f869e261e10a/packages/webhooks/__tests__/WebhookSignPayload.test.ts#L7)
  - `cb6561ad5059748cd55b5d3d6a87f869e261e10a:packages/webhooks/__tests__/WebhookVerifyPayload.test.ts:generic-api-key:10` (2026-05-18, Bruno Zorić) [view](https://github.com/webiny/webiny-js/blob/cb6561ad5059748cd55b5d3d6a87f869e261e10a/packages/webhooks/__tests__/WebhookVerifyPayload.test.ts#L10)
  - `cb6561ad5059748cd55b5d3d6a87f869e261e10a:packages/webhooks/__tests__/graphql/webhookCrud.test.ts:generic-api-key:13` (2026-05-18, Bruno Zorić) [view](https://github.com/webiny/webiny-js/blob/cb6561ad5059748cd55b5d3d6a87f869e261e10a/packages/webhooks/__tests__/graphql/webhookCrud.test.ts#L13)
  - `cb6561ad5059748cd55b5d3d6a87f869e261e10a:packages/webhooks/__tests__/graphql/webhookDeliveries.test.ts:generic-api-key:13` (2026-05-18, Bruno Zorić) [view](https://github.com/webiny/webiny-js/blob/cb6561ad5059748cd55b5d3d6a87f869e261e10a/packages/webhooks/__tests__/graphql/webhookDeliveries.test.ts#L13)
  - `4d8df81cb57f0879399342831df30266dc223162:packages/webhooks/__tests__/graphql/webhookPersistenceError.test.ts:generic-api-key:13` (2026-06-07, Bruno Zorić) [view](https://github.com/webiny/webiny-js/blob/4d8df81cb57f0879399342831df30266dc223162/packages/webhooks/__tests__/graphql/webhookPersistenceError.test.ts#L13)
  - `cb6561ad5059748cd55b5d3d6a87f869e261e10a:packages/webhooks/__tests__/graphql/webhookTrigger.test.ts:generic-api-key:10` (2026-05-18, Bruno Zorić) [view](https://github.com/webiny/webiny-js/blob/cb6561ad5059748cd55b5d3d6a87f869e261e10a/packages/webhooks/__tests__/graphql/webhookTrigger.test.ts#L10)
  - `cb6561ad5059748cd55b5d3d6a87f869e261e10a:packages/webhooks/__tests__/useCases/createWebhook.test.ts:generic-api-key:18` (2026-05-18, Bruno Zorić) [view](https://github.com/webiny/webiny-js/blob/cb6561ad5059748cd55b5d3d6a87f869e261e10a/packages/webhooks/__tests__/useCases/createWebhook.test.ts#L18)
  - `cb6561ad5059748cd55b5d3d6a87f869e261e10a:packages/webhooks/__tests__/useCases/createWebhook.test.ts:generic-api-key:46` (2026-05-18, Bruno Zorić) [view](https://github.com/webiny/webiny-js/blob/cb6561ad5059748cd55b5d3d6a87f869e261e10a/packages/webhooks/__tests__/useCases/createWebhook.test.ts#L46)
  - `cb6561ad5059748cd55b5d3d6a87f869e261e10a:packages/webhooks/__tests__/useCases/createWebhook.test.ts:generic-api-key:62` (2026-05-18, Bruno Zorić) [view](https://github.com/webiny/webiny-js/blob/cb6561ad5059748cd55b5d3d6a87f869e261e10a/packages/webhooks/__tests__/useCases/createWebhook.test.ts#L62)
  - `cb6561ad5059748cd55b5d3d6a87f869e261e10a:packages/webhooks/__tests__/useCases/createWebhook.test.ts:generic-api-key:77` (2026-05-18, Bruno Zorić) [view](https://github.com/webiny/webiny-js/blob/cb6561ad5059748cd55b5d3d6a87f869e261e10a/packages/webhooks/__tests__/useCases/createWebhook.test.ts#L77)
  - `cb6561ad5059748cd55b5d3d6a87f869e261e10a:packages/webhooks/__tests__/useCases/createWebhook.test.ts:generic-api-key:86` (2026-05-18, Bruno Zorić) [view](https://github.com/webiny/webiny-js/blob/cb6561ad5059748cd55b5d3d6a87f869e261e10a/packages/webhooks/__tests__/useCases/createWebhook.test.ts#L86)
  - `cb6561ad5059748cd55b5d3d6a87f869e261e10a:packages/webhooks/__tests__/useCases/createWebhook.test.ts:generic-api-key:101` (2026-05-18, Bruno Zorić) [view](https://github.com/webiny/webiny-js/blob/cb6561ad5059748cd55b5d3d6a87f869e261e10a/packages/webhooks/__tests__/useCases/createWebhook.test.ts#L101)
  - `cb6561ad5059748cd55b5d3d6a87f869e261e10a:packages/webhooks/__tests__/useCases/createWebhook.test.ts:generic-api-key:116` (2026-05-18, Bruno Zorić) [view](https://github.com/webiny/webiny-js/blob/cb6561ad5059748cd55b5d3d6a87f869e261e10a/packages/webhooks/__tests__/useCases/createWebhook.test.ts#L116)
  - `cb6561ad5059748cd55b5d3d6a87f869e261e10a:packages/webhooks/__tests__/useCases/createWebhook.test.ts:generic-api-key:130` (2026-05-18, Bruno Zorić) [view](https://github.com/webiny/webiny-js/blob/cb6561ad5059748cd55b5d3d6a87f869e261e10a/packages/webhooks/__tests__/useCases/createWebhook.test.ts#L130)
  - `cb6561ad5059748cd55b5d3d6a87f869e261e10a:packages/webhooks/__tests__/useCases/createWebhook.test.ts:generic-api-key:148` (2026-05-18, Bruno Zorić) [view](https://github.com/webiny/webiny-js/blob/cb6561ad5059748cd55b5d3d6a87f869e261e10a/packages/webhooks/__tests__/useCases/createWebhook.test.ts#L148)
  - `cb6561ad5059748cd55b5d3d6a87f869e261e10a:packages/webhooks/__tests__/useCases/deleteWebhook.test.ts:generic-api-key:16` (2026-05-18, Bruno Zorić) [view](https://github.com/webiny/webiny-js/blob/cb6561ad5059748cd55b5d3d6a87f869e261e10a/packages/webhooks/__tests__/useCases/deleteWebhook.test.ts#L16)
  - `eecafb9dac77a5bf051cce8ef7b258517bbc852d:packages/webhooks/__tests__/useCases/deliveryCompression.test.ts:generic-api-key:27` (2026-05-20, Bruno Zorić) [view](https://github.com/webiny/webiny-js/blob/eecafb9dac77a5bf051cce8ef7b258517bbc852d/packages/webhooks/__tests__/useCases/deliveryCompression.test.ts#L27)
  - `eecafb9dac77a5bf051cce8ef7b258517bbc852d:packages/webhooks/__tests__/useCases/deliveryCompression.test.ts:generic-api-key:83` (2026-05-20, Bruno Zorić) [view](https://github.com/webiny/webiny-js/blob/eecafb9dac77a5bf051cce8ef7b258517bbc852d/packages/webhooks/__tests__/useCases/deliveryCompression.test.ts#L83)
  - `cb6561ad5059748cd55b5d3d6a87f869e261e10a:packages/webhooks/__tests__/useCases/listWebhooks.test.ts:generic-api-key:16` (2026-05-18, Bruno Zorić) [view](https://github.com/webiny/webiny-js/blob/cb6561ad5059748cd55b5d3d6a87f869e261e10a/packages/webhooks/__tests__/useCases/listWebhooks.test.ts#L16)
  - `cb6561ad5059748cd55b5d3d6a87f869e261e10a:packages/webhooks/__tests__/useCases/resendWebhookDelivery.test.ts:generic-api-key:20` (2026-05-18, Bruno Zorić) [view](https://github.com/webiny/webiny-js/blob/cb6561ad5059748cd55b5d3d6a87f869e261e10a/packages/webhooks/__tests__/useCases/resendWebhookDelivery.test.ts#L20)
  - `cb6561ad5059748cd55b5d3d6a87f869e261e10a:packages/webhooks/__tests__/useCases/triggerWebhook.test.ts:generic-api-key:21` (2026-05-18, Bruno Zorić) [view](https://github.com/webiny/webiny-js/blob/cb6561ad5059748cd55b5d3d6a87f869e261e10a/packages/webhooks/__tests__/useCases/triggerWebhook.test.ts#L21)
  - `cb6561ad5059748cd55b5d3d6a87f869e261e10a:packages/webhooks/__tests__/useCases/triggerWebhook.test.ts:generic-api-key:57` (2026-05-18, Bruno Zorić) [view](https://github.com/webiny/webiny-js/blob/cb6561ad5059748cd55b5d3d6a87f869e261e10a/packages/webhooks/__tests__/useCases/triggerWebhook.test.ts#L57)
  - `4d5533f4513a099c85ad7d535d3324898c4bf9a0:packages/webhooks/__tests__/useCases/triggerWebhook.test.ts:generic-api-key:107` (2026-05-21, Bruno Zorić) [view](https://github.com/webiny/webiny-js/blob/4d5533f4513a099c85ad7d535d3324898c4bf9a0/packages/webhooks/__tests__/useCases/triggerWebhook.test.ts#L107)
  - `cb6561ad5059748cd55b5d3d6a87f869e261e10a:packages/webhooks/__tests__/useCases/updateWebhook.test.ts:generic-api-key:16` (2026-05-18, Bruno Zorić) [view](https://github.com/webiny/webiny-js/blob/cb6561ad5059748cd55b5d3d6a87f869e261e10a/packages/webhooks/__tests__/useCases/updateWebhook.test.ts#L16)
  - `cb6561ad5059748cd55b5d3d6a87f869e261e10a:packages/webhooks/__tests__/useCases/updateWebhookDelivery.test.ts:generic-api-key:19` (2026-05-18, Bruno Zorić) [view](https://github.com/webiny/webiny-js/blob/cb6561ad5059748cd55b5d3d6a87f869e261e10a/packages/webhooks/__tests__/useCases/updateWebhookDelivery.test.ts#L19)

### L30 — `github-pat` — 1 hit(s)

- Match: `ghp_58o4…`
- Occurrences (`commit:file:line` = fingerprint):
  - `00138158dbe41f8983373b26bde6f1c2c06df61a:packages/cli-plugin-scaffold-ci/src/githubActions/index.ts:github-pat:73` (2021-05-20, Adrian Smijulj) [view](https://github.com/webiny/webiny-js/blob/00138158dbe41f8983373b26bde6f1c2c06df61a/packages/cli-plugin-scaffold-ci/src/githubActions/index.ts#L73)

### L31 — `github-pat` — 1 hit(s)

- Match: `ghp_HCFc…`
- Occurrences (`commit:file:line` = fingerprint):
  - `1a220a8b72a5b9319049a2f30a13f5153bb7cebc:packages/cli-plugin-scaffold-ci/src/index.ts:github-pat:74` (2021-05-10, Adrian Smijulj) [view](https://github.com/webiny/webiny-js/blob/1a220a8b72a5b9319049a2f30a13f5153bb7cebc/packages/cli-plugin-scaffold-ci/src/index.ts#L74)

### L32 — `github-pat` — 1 hit(s)

- Match: `ghp_jGU3…`
- Occurrences (`commit:file:line` = fingerprint):
  - `583cd695357cad2654f30d36d15a8c4d7d5ab523:packages/cli-plugin-scaffold-ci/src/index.ts:github-pat:77` (2021-05-10, Adrian Smijulj) [view](https://github.com/webiny/webiny-js/blob/583cd695357cad2654f30d36d15a8c4d7d5ab523/packages/cli-plugin-scaffold-ci/src/index.ts#L77)

### L33 — `github-pat` — 1 hit(s)

- Match: `ghp_rGD2…`
- Occurrences (`commit:file:line` = fingerprint):
  - `bc38044581f1744611085fc600faffe4745b74ae:packages/cli-plugin-scaffold-ci/src/githubActions/index.ts:github-pat:37` (2021-05-12, Adrian Smijulj) [view](https://github.com/webiny/webiny-js/blob/bc38044581f1744611085fc600faffe4745b74ae/packages/cli-plugin-scaffold-ci/src/githubActions/index.ts#L37)

### L34 — `jwt` — 1 hit(s)

- Match: `eyJhbGci…"`
- Occurrences (`commit:file:line` = fingerprint):
  - `e7d277c945c5baf26dbc6463ea0a1d425c370bb5:packages/app-website-builder/src/ecommerce/features/settings/getSettings/useGetEcommerceSettings.ts:jwt:22` (2025-07-10, Pavel Denisjuk) [view](https://github.com/webiny/webiny-js/blob/e7d277c945c5baf26dbc6463ea0a1d425c370bb5/packages/app-website-builder/src/ecommerce/features/settings/getSettings/useGetEcommerceSettings.ts#L22)

### L35 — `jwt` — 1 hit(s)

- Match: `eyJhbGci…"`
- Occurrences (`commit:file:line` = fingerprint):
  - `2b9830fd10014d173b4aca58c50bd078c0754fb1:kiboAuthToken.ts:jwt:2` (2025-06-12, Pavel Denisjuk) [view](https://github.com/webiny/webiny-js/blob/2b9830fd10014d173b4aca58c50bd078c0754fb1/kiboAuthToken.ts#L2)

### L36 — `jwt` — 1 hit(s)

- Match: `eyJhbGci…`
- Occurrences (`commit:file:line` = fingerprint):
  - `658972a8695ef6f0c9d023e113608616b315aa00:packages/api-headless-cms/src/content/plugins/authentication.ts:jwt:14` (2020-06-30, Fsalker) [view](https://github.com/webiny/webiny-js/blob/658972a8695ef6f0c9d023e113608616b315aa00/packages/api-headless-cms/src/content/plugins/authentication.ts#L14)

### L37 — `jwt` — 1 hit(s)

- Match: `eyJhbGci…"`
- Occurrences (`commit:file:line` = fingerprint):
  - `cb17a12f6902243ac4d217e4976b2873b78a933b:examples/spa/NewClient/Frontend/app.js:jwt:18` (2018-03-22, Pavel910) [view](https://github.com/webiny/webiny-js/blob/cb17a12f6902243ac4d217e4976b2873b78a933b/examples/spa/NewClient/Frontend/app.js#L18)

### L38 — `jwt` — 1 hit(s)

- Match: `eyJhbGci…'`
- Occurrences (`commit:file:line` = fingerprint):
  - `2b9830fd10014d173b4aca58c50bd078c0754fb1:nextjs/__mocks__/stories/userMock.ts:jwt:26` (2025-06-12, Pavel Denisjuk) [view](https://github.com/webiny/webiny-js/blob/2b9830fd10014d173b4aca58c50bd078c0754fb1/nextjs/__mocks__/stories/userMock.ts#L26)

### L39 — `jwt` — 1 hit(s)

- Match: `eyJhbGci…'`
- Occurrences (`commit:file:line` = fingerprint):
  - `2b9830fd10014d173b4aca58c50bd078c0754fb1:nextjs/__mocks__/stories/userMock.ts:jwt:50` (2025-06-12, Pavel Denisjuk) [view](https://github.com/webiny/webiny-js/blob/2b9830fd10014d173b4aca58c50bd078c0754fb1/nextjs/__mocks__/stories/userMock.ts#L50)

