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

import {
    OpenSearch,
    ElasticSearch
} from "./extensions/index.js";

export const Infra = {
    Vpc,
    BlueGreenDeployments,
    ElasticSearch,
    OpenSearch,
    PulumiResourceNamePrefix,
    ProductionEnvironments,
    AwsTags,
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
