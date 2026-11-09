import { AdminAfterBuild } from "~/extensions/index.js";
import { AdminAfterDeploy } from "~/extensions/index.js";
import { AdminBeforeBuild } from "~/extensions/index.js";
import { AdminBeforeDeploy } from "~/extensions/index.js";
import { AdminBeforeWatch } from "~/extensions/index.js";
import { AdminStackOutputValue } from "~/extensions/index.js";
import { ApiAfterBuild } from "~/extensions/index.js";
import { ApiAfterDeploy } from "~/extensions/index.js";
import { ApiBeforeBuild } from "~/extensions/index.js";
import { ApiBeforeDeploy } from "~/extensions/index.js";
import { ApiBeforeWatch } from "~/extensions/index.js";
import { ApiMaxBundleSize } from "~/extensions/index.js";
import { ApiStackOutputValue } from "~/extensions/index.js";
import { CoreAfterBuild } from "~/extensions/index.js";
import { CoreAfterDeploy } from "~/extensions/index.js";
import { CoreBeforeBuild } from "~/extensions/index.js";
import { CoreBeforeDeploy } from "~/extensions/index.js";
import { CoreBeforeWatch } from "~/extensions/index.js";
import { CoreStackOutputValue } from "~/extensions/index.js";
import { Encryption } from "~/extensions/index.js";
import { EnvVar } from "~/extensions/index.js";
import { Hashing } from "~/extensions/index.js";
import { ProductionEnvironments } from "~/extensions/index.js";
import { PulumiResourceNamePrefix } from "~/extensions/index.js";
import { CiIs } from "~/extensions/infra/index.js";
import { CiIsNot } from "~/extensions/infra/index.js";
import { EnvIs } from "~/extensions/infra/index.js";
import { EnvIsNot } from "~/extensions/infra/index.js";
import { EnvIsNotProd } from "~/extensions/infra/index.js";
import { EnvIsProd } from "~/extensions/infra/index.js";
import { useEnv } from "~/extensions/infra/index.js";
import { AdminCustomDomains } from "~/extensions/aws/index.js";
import { AdminPulumi } from "~/extensions/aws/index.js";
import { ApiCustomDomains } from "~/extensions/aws/index.js";
import { ApiLambdaFunction } from "~/extensions/aws/index.js";
import { ApiPulumi } from "~/extensions/aws/index.js";
import { AwsDefaultRegion } from "~/extensions/aws/index.js";
import { AwsTags } from "~/extensions/aws/index.js";
import { BlueGreenDeployments } from "~/extensions/aws/index.js";
import { CorePulumi } from "~/extensions/aws/index.js";
import { DynamoDbPitr } from "~/extensions/aws/index.js";
import { OpenSearch } from "~/extensions/aws/index.js";
import { S3BucketVersioning } from "~/extensions/aws/index.js";
import { Vpc } from "~/extensions/aws/index.js";
import { AdminUrl } from "~/extensions/standalone/index.js";
import { ApiUrl } from "~/extensions/standalone/index.js";
import { FileStorage } from "~/extensions/standalone/index.js";
import { Postgres } from "~/extensions/standalone/index.js";
import { Sqlite } from "~/extensions/standalone/index.js";

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
