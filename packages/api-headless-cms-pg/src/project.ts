/*
 * The project extension, for `webiny.config.tsx`. Kept out of the package's index, so the API bundle
 * never imports the project tooling.
 */
export { HeadlessCmsPg } from "./HeadlessCmsPg.js";
/* The defaults build param a hosting sets (`<Infra.AuroraPostgres rdsProxy />` on AWS). */
export { PG_CMS_DEFAULTS_BUILD_PARAM } from "./features/config/abstractions.js";
