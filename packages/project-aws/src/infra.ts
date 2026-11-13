import {
    AdminAfterBuild,
    AdminBeforeBuild,
    AdminBeforeWatch,
    ApiAfterBuild,
    ApiBeforeBuild,
    ApiBeforeWatch,
    CoreAfterBuild,
    CoreBeforeBuild,
    CoreBeforeWatch,
    ProductionEnvironments
} from "@webiny/project/extensions/index.js";
import { AdminAfterDeploy } from "@webiny/project-extensions-aws/extensions/index.js";
import { AdminBeforeDeploy } from "@webiny/project-extensions-aws/extensions/index.js";
import { ApiAfterDeploy } from "@webiny/project-extensions-aws/extensions/index.js";
import { ApiBeforeDeploy } from "@webiny/project-extensions-aws/extensions/index.js";
import { CoreAfterDeploy } from "@webiny/project-extensions-aws/extensions/index.js";
import { CoreBeforeDeploy } from "@webiny/project-extensions-aws/extensions/index.js";
import { PulumiResourceNamePrefix } from "@webiny/project-extensions-aws/extensions/index.js";

import { CorePulumi, ApiPulumi, AdminPulumi } from "./pulumi/extensions/index.js";

import {
    AdminCustomDomains,
    ApiCustomDomains,
    AwsTags,
    BlueGreenDeployments,
    DynamoDbPitr,
    S3BucketVersioning,
    Vpc
} from "./pulumi/extensions/index.js";

import { OpenSearch } from "./extensions/OpenSearch.js";
import { Postgres } from "./extensions/Postgres.js";
import { RdsProxy } from "./extensions/RdsProxy.js";
import { AdminStackOutputValue } from "@webiny/project-extensions-aws/extensions/index.js";
import { ApiStackOutputValue } from "@webiny/project-extensions-aws/extensions/index.js";
import { CoreStackOutputValue } from "@webiny/project-extensions-aws/extensions/index.js";
import { AwsDefaultRegion } from "@webiny/project-extensions-aws/extensions/AwsDefaultRegion.js";
import { ApiLambdaFunction } from "./extensions/ApiLambdaFunction.js";
import { EnvVar } from "@webiny/project/extensions/index.js";
import { Encryption } from "@webiny/project-extensions-aws/extensions/index.js";
import { Hashing } from "@webiny/project-extensions-aws/extensions/index.js";
import { ApiMaxBundleSize } from "@webiny/project-extensions-aws/extensions/index.js";
import {
    EnvIs,
    EnvIsNot,
    EnvIsProd,
    EnvIsNotProd,
    useEnv,
    CiIs,
    CiIsNot
} from "@webiny/project/extensions/infra/index.js";

export { useEnv };

// Core app resources. Exposed under Infra.Core, and top-level for backward compatibility.
const DynamoDb = {
    Pitr: DynamoDbPitr
};

const S3Bucket = {
    Versioning: S3BucketVersioning
};

export const Infra = {
    // Grouped crypto config surface.
    Crypto: {
        Encryption,
        Hashing
    },
    // Kept top-level for backward compatibility (prefer Infra.Crypto.Encryption going forward).
    Encryption,
    Vpc,
    Postgres,
    RdsProxy,
    BlueGreenDeployments,
    // Kept top-level for backward compatibility (prefer Infra.Core.OpenSearch going forward).
    OpenSearch,
    PulumiResourceNamePrefix,
    ProductionEnvironments,
    EnvVar,
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
    Ci: {
        Is: CiIs,
        IsNot: CiIsNot
    },
    Admin: {
        BeforeBuild: AdminBeforeBuild,
        BeforeDeploy: AdminBeforeDeploy,
        BeforeWatch: AdminBeforeWatch,
        AfterBuild: AdminAfterBuild,
        AfterDeploy: AdminAfterDeploy,
        Pulumi: AdminPulumi,
        CustomDomains: AdminCustomDomains,
        StackOutputValue: AdminStackOutputValue
    },
    Api: {
        BeforeBuild: ApiBeforeBuild,
        BeforeDeploy: ApiBeforeDeploy,
        BeforeWatch: ApiBeforeWatch,
        AfterBuild: ApiAfterBuild,
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
