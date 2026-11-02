import {
    AdminAfterBuild,
    AdminAfterDeploy,
    AdminBeforeBuild,
    AdminBeforeDeploy,
    AdminBeforeWatch,
    AdminStackOutputValue,
    ApiAfterBuild,
    ApiAfterDeploy,
    ApiBeforeBuild,
    ApiBeforeDeploy,
    ApiBeforeWatch,
    ApiMaxBundleSize,
    ApiStackOutputValue,
    CoreAfterBuild,
    CoreAfterDeploy,
    CoreBeforeBuild,
    CoreBeforeDeploy,
    CoreBeforeWatch,
    CoreStackOutputValue,
    Encryption,
    EnvVar,
    Hashing,
    ProductionEnvironments,
    PulumiResourceNamePrefix
} from "~/extensions/index.js";
import {
    CiIs,
    CiIsNot,
    EnvIs,
    EnvIsNot,
    EnvIsNotProd,
    EnvIsProd,
    useEnv
} from "~/extensions/infra/index.js";
import {
    AdminCustomDomains,
    AdminPulumi,
    ApiCustomDomains,
    ApiLambdaFunction,
    ApiPulumi,
    AwsDefaultRegion,
    AwsTags,
    BlueGreenDeployments,
    CorePulumi,
    OpenSearch,
    Vpc
} from "~/extensions/aws/index.js";
import { AdminUrl, ApiUrl, FileStorage, Postgres, Sqlite } from "~/extensions/standalone/index.js";
import { awsOnly, standaloneOnly } from "~/extensions/hosting/index.js";

export { useEnv };

/**
 * Infrastructure extensions for every hosting type. Extensions that only apply to one hosting
 * type throw when rendered in a project of another, e.g. `Infra.Vpc` in a standalone project.
 */
export const Infra = {
    // Grouped crypto config surface.
    Crypto: {
        Encryption,
        Hashing
    },
    // Kept top-level for backward compatibility (prefer Infra.Crypto.Encryption going forward).
    Encryption,
    EnvVar,

    // AWS.
    Vpc: awsOnly("Infra.Vpc", Vpc),
    BlueGreenDeployments: awsOnly("Infra.BlueGreenDeployments", BlueGreenDeployments),
    OpenSearch: awsOnly("Infra.OpenSearch", OpenSearch),
    PulumiResourceNamePrefix: awsOnly("Infra.PulumiResourceNamePrefix", PulumiResourceNamePrefix),
    ProductionEnvironments: awsOnly("Infra.ProductionEnvironments", ProductionEnvironments),
    Aws: {
        DefaultRegion: awsOnly("Infra.Aws.DefaultRegion", AwsDefaultRegion),
        Tags: awsOnly("Infra.Aws.Tags", AwsTags)
    },
    Env: {
        useEnv,
        Is: awsOnly("Infra.Env.Is", EnvIs),
        IsNot: awsOnly("Infra.Env.IsNot", EnvIsNot),
        IsProd: awsOnly("Infra.Env.IsProd", EnvIsProd),
        IsNotProd: awsOnly("Infra.Env.IsNotProd", EnvIsNotProd)
    },

    // Standalone.
    Sqlite: standaloneOnly("Infra.Sqlite", Sqlite),
    Postgres: standaloneOnly("Infra.Postgres", Postgres),
    FileStorage: standaloneOnly("Infra.FileStorage", FileStorage),
    ApiUrl: standaloneOnly("Infra.ApiUrl", ApiUrl),
    AdminUrl: standaloneOnly("Infra.AdminUrl", AdminUrl),

    Ci: {
        Is: CiIs,
        IsNot: CiIsNot
    },
    Admin: {
        BeforeBuild: AdminBeforeBuild,
        BeforeWatch: AdminBeforeWatch,
        AfterBuild: AdminAfterBuild,
        BeforeDeploy: awsOnly("Infra.Admin.BeforeDeploy", AdminBeforeDeploy),
        AfterDeploy: awsOnly("Infra.Admin.AfterDeploy", AdminAfterDeploy),
        Pulumi: awsOnly("Infra.Admin.Pulumi", AdminPulumi),
        CustomDomains: awsOnly("Infra.Admin.CustomDomains", AdminCustomDomains),
        StackOutputValue: awsOnly("Infra.Admin.StackOutputValue", AdminStackOutputValue)
    },
    Api: {
        BeforeBuild: ApiBeforeBuild,
        BeforeWatch: ApiBeforeWatch,
        AfterBuild: ApiAfterBuild,
        BeforeDeploy: awsOnly("Infra.Api.BeforeDeploy", ApiBeforeDeploy),
        AfterDeploy: awsOnly("Infra.Api.AfterDeploy", ApiAfterDeploy),
        Pulumi: awsOnly("Infra.Api.Pulumi", ApiPulumi),
        CustomDomains: awsOnly("Infra.Api.CustomDomains", ApiCustomDomains),
        StackOutputValue: awsOnly("Infra.Api.StackOutputValue", ApiStackOutputValue),
        LambdaFunction: awsOnly("Infra.Api.LambdaFunction", ApiLambdaFunction),
        MaxBundleSize: awsOnly("Infra.Api.MaxBundleSize", ApiMaxBundleSize)
    },
    Core: {
        BeforeBuild: awsOnly("Infra.Core.BeforeBuild", CoreBeforeBuild),
        BeforeDeploy: awsOnly("Infra.Core.BeforeDeploy", CoreBeforeDeploy),
        BeforeWatch: awsOnly("Infra.Core.BeforeWatch", CoreBeforeWatch),
        AfterBuild: awsOnly("Infra.Core.AfterBuild", CoreAfterBuild),
        AfterDeploy: awsOnly("Infra.Core.AfterDeploy", CoreAfterDeploy),
        Pulumi: awsOnly("Infra.Core.Pulumi", CorePulumi),
        StackOutputValue: awsOnly("Infra.Core.StackOutputValue", CoreStackOutputValue)
    }
};
