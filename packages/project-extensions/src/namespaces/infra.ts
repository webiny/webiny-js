import type React from "react";
import { AdminAfterBuild } from "@webiny/project/extensions/index.js";
import { AdminAfterDeploy } from "@webiny/project-extensions-aws/extensions/index.js";
import { AdminBeforeBuild } from "@webiny/project/extensions/index.js";
import { AdminBeforeDeploy } from "@webiny/project-extensions-aws/extensions/index.js";
import { AdminBeforeWatch } from "@webiny/project/extensions/index.js";
import { AdminStackOutputValue } from "@webiny/project-extensions-aws/extensions/index.js";
import { ApiAfterBuild } from "@webiny/project/extensions/index.js";
import { ApiAfterDeploy } from "@webiny/project-extensions-aws/extensions/index.js";
import { ApiBeforeBuild } from "@webiny/project/extensions/index.js";
import { ApiBeforeDeploy } from "@webiny/project-extensions-aws/extensions/index.js";
import { ApiBeforeWatch } from "@webiny/project/extensions/index.js";
import { ApiMaxBundleSize } from "@webiny/project-extensions-aws/extensions/index.js";
import { ApiStackOutputValue } from "@webiny/project-extensions-aws/extensions/index.js";
import { CoreAfterBuild } from "@webiny/project/extensions/index.js";
import { CoreAfterDeploy } from "@webiny/project-extensions-aws/extensions/index.js";
import { CoreBeforeBuild } from "@webiny/project/extensions/index.js";
import { CoreBeforeDeploy } from "@webiny/project-extensions-aws/extensions/index.js";
import { CoreBeforeWatch } from "@webiny/project/extensions/index.js";
import { CoreStackOutputValue } from "@webiny/project-extensions-aws/extensions/index.js";
import { EnvVar } from "@webiny/project/extensions/index.js";
import { ProductionEnvironments } from "@webiny/project/extensions/index.js";
import { PulumiResourceNamePrefix } from "@webiny/project-extensions-aws/extensions/index.js";
import { CiIs } from "@webiny/project/extensions/infra/index.js";
import { CiIsNot } from "@webiny/project/extensions/infra/index.js";
import { EnvIs } from "@webiny/project/extensions/infra/index.js";
import { EnvIsNot } from "@webiny/project/extensions/infra/index.js";
import { EnvIsNotProd } from "@webiny/project/extensions/infra/index.js";
import { EnvIsProd } from "@webiny/project/extensions/infra/index.js";
import { useEnv } from "@webiny/project/extensions/infra/index.js";
import { Encryption as AwsEncryption } from "@webiny/project-extensions-aws/extensions/index.js";
import { Hashing as AwsHashing } from "@webiny/project-extensions-aws/extensions/index.js";
import { Encryption as StandaloneEncryption } from "@webiny/project-extensions-standalone/extensions/index.js";
import { Hashing as StandaloneHashing } from "@webiny/project-extensions-standalone/extensions/index.js";
import { createHostingSwitch } from "~/hosting/createHostingSwitch.js";
import { AdminCustomDomains } from "@webiny/project-extensions-aws/extensions/index.js";
import { AdminPulumi } from "@webiny/project-extensions-aws/extensions/index.js";
import { ApiCustomDomains } from "@webiny/project-extensions-aws/extensions/index.js";
import { ApiLambdaFunction } from "@webiny/project-extensions-aws/extensions/index.js";
import { ApiPulumi } from "@webiny/project-extensions-aws/extensions/index.js";
import { AwsDefaultRegion } from "@webiny/project-extensions-aws/extensions/index.js";
import { AwsTags } from "@webiny/project-extensions-aws/extensions/index.js";
import { BlueGreenDeployments } from "@webiny/project-extensions-aws/extensions/index.js";
import { CorePulumi } from "@webiny/project-extensions-aws/extensions/index.js";
import { DynamoDbPitr } from "@webiny/project-extensions-aws/extensions/index.js";
import { OpenSearch } from "@webiny/project-extensions-aws/extensions/index.js";
import { S3BucketVersioning } from "@webiny/project-extensions-aws/extensions/index.js";
import { Vpc } from "@webiny/project-extensions-aws/extensions/index.js";
import { AdminUrl } from "@webiny/project-extensions-standalone/extensions/index.js";
import { ApiUrl } from "@webiny/project-extensions-standalone/extensions/index.js";
import { FileStorage } from "@webiny/project-extensions-standalone/extensions/index.js";
import { Postgres } from "@webiny/project-extensions-standalone/extensions/index.js";
import { Pglite } from "@webiny/project-extensions-standalone/extensions/index.js";
import { Sqlite } from "@webiny/project-extensions-standalone/extensions/index.js";

export { useEnv };

/*
 * The AWS versions pass the secrets as build params, baked into the API bundle; the standalone
 * versions pass them as env vars, which the standalone API reads when it starts.
 */
const Encryption = createHostingSwitch<React.ComponentProps<typeof AwsEncryption>>(
    { aws: AwsEncryption, standalone: StandaloneEncryption },
    "aws"
);
const Hashing = createHostingSwitch<React.ComponentProps<typeof AwsHashing>>(
    { aws: AwsHashing, standalone: StandaloneHashing },
    "aws"
);

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
    Pglite,
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
