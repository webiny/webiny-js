# The demo website deployment (App Runner)

The Website Builder site that renders migrated pages, previews components for the render step, and
answers "Open site". Deployed 2026-10-09 so the demo does not depend on a laptop or a tunnel.

- **URL:** https://cg2vpcghdp.eu-central-1.awsapprunner.com, set as the frontend domain (admin →
  Configure Frontend), which the render step and "Open site" read.
- **Service:** App Runner `webiny-demo-website`, eu-central-1, account 636962863878, 1 vCPU / 2 GB.
  ARN `arn:aws:apprunner:eu-central-1:636962863878:service/webiny-demo-website/e22ac7d4aa65408bb5cd0a8edb743bc3`.
  Health check: HTTP `/sandbox/component`.
- **Image:** ECR `636962863878.dkr.ecr.eu-central-1.amazonaws.com/webiny-demo-website:latest`, pulled
  with the `AppRunnerECRAccessRole` (App Runner's standard ECR-access role, created for this).
  Auto-deploy is off: a new image is deployed with `aws apprunner start-deployment`.

## Source and build

The app is `../next-website-migration-tool` (branch `starter-kit-6.6.x`). It resolves every `@webiny`
package, including the unreleased SDK, from this monorepo through `NODE_PATH`, so it cannot be built from
git alone. The image is built from a **copy** beside it, `../next-website-deploy`, so the app's own
working tree is not touched. The copy's `next.config.ts` differs from the app's in four ways, all for the
deploy build:

1. **`output: "standalone"`** with `outputFileTracingRoot: ".."`, so the monorepo files the app uses are
   traced in.
2. **`typescript.ignoreBuildErrors` and `eslint.ignoreDuringBuilds`.** The app type-checks with errors
   against the current SDK (`components/DocumentRenderer.tsx`, `next.config.ts`), which `next dev` never
   checks. The deploy builds exactly what runs in dev; it does not fix them.
3. **`outputFileTracingIncludes`** for pino's whole dependency closure (`pino`, `thread-stream`,
   `real-require`, …) and for `css-tree`, `mdn-data` and `source-map-js`. pino loads its transport
   through worker threads, which tracing cannot see.
4. **`serverExternalPackages: ["css-tree"]`.** This was not enough on its own; see the workaround below.

## Workarounds in the image (`Dockerfile`)

- **The frozen css-tree path.** `css-tree` (via `@webiny/sdk-frontend`) loads its data with
  `createRequire(import.meta.url)`, and the bundler froze that URL to the build machine's path
  (`/Users/svenalhamad/Dev/webiny-js-migration-tool/node_modules/css-tree/...`). The image creates that
  path as a symlink to the traced `node_modules`. If the build machine or path changes, the symlink must
  follow.
- **`HOSTNAME`.** App Runner sets `HOSTNAME` to the instance name and Next's standalone server binds to
  it, so the health check never reached it. The start command sets `HOSTNAME=0.0.0.0` itself.
- **`sharp`.** The build carries macOS's binary; the image installs `sharp@0.34.5` for Linux x64.

## Redeploy

1. Sync the copy: `rsync -a --exclude .next --exclude .git --exclude next.config.ts
../next-website-migration-tool/ ../next-website-deploy/`. The copy keeps its own `next.config.ts`.
2. In the copy, run `NODE_PATH=../webiny-js-migration-tool/node_modules npx next build`.
3. Assemble the image context: `.next/standalone/*`, plus `.next/static` and `public` into
   `next-website-deploy/`, plus `.env`. Remove `@img/sharp-darwin-arm64` and
   `@img/sharp-libvips-darwin-arm64`.
4. Build with the Dockerfile kept at `../next-website-deploy/deploy/Dockerfile` (the context's `app/` folder
   holds step 3's files): `docker buildx build --platform linux/amd64 -t website-demo:latest --load .`.
5. **Test the container itself before pushing.** `docker run -e HOSTNAME=x -p 3200:8080`, then fetch a
   tenant page and `/sandbox/component`. A run of the standalone folder on the build machine is not a
   test: the frozen paths exist there.
6. Tag, push to ECR, then run `aws apprunner start-deployment --service-arn <ARN>`.

## Lessons recorded

- The standalone build served pages from an empty folder on the build machine and still failed in the
  container. The check passed only because the frozen absolute path existed on that machine.
- The domain is set in **Configure Frontend** (frontend-settings). Website Builder's own
  `UpdateSettingsGateway` is registered but no screen calls it. It was corrected to send
  `frontend.updateSettings`, but it was never the way the domain is set.
