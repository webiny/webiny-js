/*
 * Types of the Pulumi apps the AWS hosting type deploys. They depend on Pulumi, so they live in
 * `@webiny/project-aws`, which fills these in through declaration merging (see
 * `project-aws/src/abstractions/pulumiTypes.ts`). Keeping only placeholders here means the
 * abstractions below load, and type-check, in a project without `@webiny/project-aws`.
 *
 * The index signature keeps them permissive. In an installed AWS project the Pulumi app types
 * currently resolve to `any`, because their declaration files still contain `~/` import paths, so
 * user code reading `app.resources` compiled before these placeholders existed and has to keep
 * compiling.
 */

export interface CorePulumiApp {
    [key: string]: any;
}

export interface ApiPulumiApp {
    [key: string]: any;
}

export interface AdminPulumiApp {
    [key: string]: any;
}

export interface CustomDomainParams {
    [key: string]: any;
}
