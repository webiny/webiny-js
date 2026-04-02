import {
    AdminAfterBuild,
    AdminAfterDeploy,
    AdminBeforeBuild,
    AdminBeforeDeploy,
    AdminBeforeWatch,
    AdminPulumi,
    AdminStackOutputValue,
    ApiAfterBuild,
    ApiAfterDeploy,
    ApiBeforeBuild,
    ApiBeforeDeploy,
    ApiBeforeWatch,
    ApiPulumi,
    ApiStackOutputValue,
    CoreAfterBuild,
    CoreAfterDeploy,
    CoreBeforeBuild,
    CoreBeforeDeploy,
    CoreBeforeWatch,
    CorePulumi,
    CoreStackOutputValue,
    ProductionEnvironments,
    PulumiResourceNamePrefix
} from "@webiny/project/extensions/index.js";

import {
    AdminCustomDomains,
    ApiCustomDomains,
    AwsTags,
    BlueGreenDeployments,
    Vpc
} from "./pulumi/extensions/index.js";

import { OpenSearch } from "./extensions/OpenSearch.js";
import { AwsDefaultRegion } from "./extensions/AwsDefaultRegion.js";
import { ApiLambdaFunction } from "./extensions/ApiLambdaFunction.js";
import { EnvVar } from "@webiny/project/extensions/index.js";
import { EnvIs, EnvIsNot, CiIs, CiIsNot } from "@webiny/project/extensions/infra/index.js";

export const Infra = {
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
        Is: EnvIs,
        IsNot: EnvIsNot
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
        LambdaFunction: ApiLambdaFunction
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
