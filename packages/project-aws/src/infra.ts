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
    ApiStackOutputValue,
    CoreAfterBuild,
    CoreAfterDeploy,
    CoreBeforeBuild,
    CoreBeforeDeploy,
    CoreBeforeWatch,
    CoreStackOutputValue,
    ProductionEnvironments,
    PulumiResourceNamePrefix
} from "@webiny/project/extensions/index.js";

import { CorePulumi, ApiPulumi, AdminPulumi } from "./pulumi/extensions/index.js";

import {
    AdminCustomDomains,
    ApiCustomDomains,
    AwsTags,
    BlueGreenDeployments,
    Vpc
} from "./pulumi/extensions/index.js";

import { OpenSearch } from "./extensions/OpenSearch.js";
import { AwsDefaultRegion } from "./extensions/AwsDefaultRegion.js";
import { Encryption } from "./extensions/Encryption.js";
import { ApiLambdaFunction } from "./extensions/ApiLambdaFunction.js";
import { EnvVar, ApiMaxBundleSize } from "@webiny/project/extensions/index.js";
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

export const Infra = {
    Encryption,
    Vpc,
    BlueGreenDeployments,
    OpenSearch,
    PulumiResourceNamePrefix,
    ProductionEnvironments,
    EnvVar,
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
        StackOutputValue: CoreStackOutputValue
    }
};
