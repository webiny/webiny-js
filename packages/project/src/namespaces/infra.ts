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
    DynamoDbPitr,
    OpenSearch,
    S3BucketVersioning,
    Vpc
} from "~/extensions/aws/index.js";
import { AdminUrl, ApiUrl, FileStorage, Postgres, Sqlite } from "~/extensions/standalone/index.js";

export { useEnv };

// Core app resources. Exposed under Infra.Core, and top-level for backward compatibility.
const DynamoDb = {
    Pitr: DynamoDbPitr
};

const S3Bucket = {
    Versioning: S3BucketVersioning
};

/**
 * Infrastructure extensions for every hosting type. An extension that only works in one hosting
 * type says so with the `hosting` tag in its definition, and throws when rendered in a project of
 * the other, e.g. `Infra.Vpc` in a standalone project.
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
    Vpc,
    BlueGreenDeployments,
    // Kept top-level for backward compatibility (prefer Infra.Core.OpenSearch going forward).
    OpenSearch,
    PulumiResourceNamePrefix,
    ProductionEnvironments,
    // Kept top-level for backward compatibility (prefer Infra.Core.DynamoDb and Infra.Core.S3Bucket).
    DynamoDb,
    S3Bucket,
    Aws: {
        DefaultRegion: AwsDefaultRegion,
        Tags: AwsTags
    },
    Env: {
        useEnv,
        Is: EnvIs,
        IsNot: EnvIsNot,
        IsProd: EnvIsProd,
        IsNotProd: EnvIsNotProd
    },

    // Standalone.
    Sqlite,
    Postgres,
    FileStorage,
    ApiUrl,
    AdminUrl,

    Ci: {
        Is: CiIs,
        IsNot: CiIsNot
    },
    Admin: {
        BeforeBuild: AdminBeforeBuild,
        BeforeWatch: AdminBeforeWatch,
        AfterBuild: AdminAfterBuild,
        BeforeDeploy: AdminBeforeDeploy,
        AfterDeploy: AdminAfterDeploy,
        Pulumi: AdminPulumi,
        CustomDomains: AdminCustomDomains,
        StackOutputValue: AdminStackOutputValue
    },
    Api: {
        BeforeBuild: ApiBeforeBuild,
        BeforeWatch: ApiBeforeWatch,
        AfterBuild: ApiAfterBuild,
        BeforeDeploy: ApiBeforeDeploy,
        AfterDeploy: ApiAfterDeploy,
        Pulumi: ApiPulumi,
        CustomDomains: ApiCustomDomains,
        StackOutputValue: ApiStackOutputValue,
        LambdaFunction: ApiLambdaFunction,
        MaxBundleSize: ApiMaxBundleSize
    },
    Core: {
        BeforeBuild: CoreBeforeBuild,
        BeforeDeploy: CoreBeforeDeploy,
        BeforeWatch: CoreBeforeWatch,
        AfterBuild: CoreAfterBuild,
        AfterDeploy: CoreAfterDeploy,
        Pulumi: CorePulumi,
        StackOutputValue: CoreStackOutputValue,
        DynamoDb,
        OpenSearch,
        S3Bucket
    }
};
