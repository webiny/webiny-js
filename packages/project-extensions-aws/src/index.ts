/*
 * Extension definitions for AWS projects: a type, a params schema and the `hosting: "aws"` tag,
 * with no AWS or Pulumi code. `project-aws` reads their config entries when it deploys.
 *
 * A new AWS-only extension goes here, unless code in `@webiny/project` reads it. Those stay in
 * `@webiny/project` even though they are tagged `hosting: "aws"`: the `CoreBeforeBuild`,
 * `CoreAfterBuild` and `CoreBeforeWatch` hooks, which the shared build and watch decorators run,
 * and `ProductionEnvironments`, which the shared `watch` checks.
 */
export * from "./extensions/index.js";
