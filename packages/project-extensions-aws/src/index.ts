/*
 * Extension definitions for AWS projects: a type, a params schema and the `hosting: "aws"` tag,
 * with no AWS or Pulumi code. `project-aws` reads their config entries when it deploys.
 *
 * A new AWS-only extension goes here. The AWS-tagged definitions still in `@webiny/project` (the
 * deploy and `Core*` hooks, `ProductionEnvironments`, `PulumiResourceNamePrefix`) stay there
 * because the build and deploy pipeline in that package reads them; they move when that pipeline
 * moves to `project-aws`.
 */
export * from "./extensions/index.js";
