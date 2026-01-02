import {
    AdminAfterBuild,
    AdminAfterDeploy,
    AdminBeforeBuild,
    AdminBeforeDeploy,
    AdminBeforeWatch,
    AdminPulumi,
    ApiAfterBuild,
    ApiAfterDeploy,
    ApiBeforeBuild,
    ApiBeforeDeploy,
    ApiBeforeWatch,
    ApiPulumi,
    CoreAfterBuild,
    CoreAfterDeploy,
    CoreBeforeBuild,
    CoreBeforeDeploy,
    CoreBeforeWatch,
    CorePulumi,
    ProductionEnvironments,
    PulumiResourceNamePrefix
} from "@webiny/project/extensions/index.js";

import {
    AdminCustomDomains,
    AwsTags,
    BlueGreenDeployments,
    Vpc
} from "./pulumi/extensions/index.js";

import { OpenSearch, ElasticSearch, AwsDefaultRegion } from "./extensions/index.js";
import { EnvIs, EnvIsNot } from "@webiny/project/extensions/infra/index.js";

export const Infra = {
    Vpc,
    BlueGreenDeployments,
    ElasticSearch,
    OpenSearch,
    PulumiResourceNamePrefix,
    ProductionEnvironments,
    Aws: {
        DefaultRegion: AwsDefaultRegion,
        Tags: AwsTags
    },
    Env: {
        Is: EnvIs,
        IsNot: EnvIsNot
    },
    Admin: {
        BeforeBuild: AdminBeforeBuild,
        BeforeDeploy: AdminBeforeDeploy,
        BeforeWatch: AdminBeforeWatch,
        AfterBuild: AdminAfterBuild,
        AfterDeploy: AdminAfterDeploy,
        Pulumi: AdminPulumi,
        CustomDomains: AdminCustomDomains
    },
    Api: {
        BeforeBuild: ApiBeforeBuild,
        BeforeDeploy: ApiBeforeDeploy,
        BeforeWatch: ApiBeforeWatch,
        AfterBuild: ApiAfterBuild,
        AfterDeploy: ApiAfterDeploy,
        Pulumi: ApiPulumi
    },
    Core: {
        BeforeBuild: CoreBeforeBuild,
        BeforeDeploy: CoreBeforeDeploy,
        BeforeWatch: CoreBeforeWatch,
        AfterBuild: CoreAfterBuild,
        AfterDeploy: CoreAfterDeploy,
        Pulumi: CorePulumi
    }
};
