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
    AwsTags,
    BlueGreenDeployments,
    Vpc
} from "./pulumi/extensions/index.js";

import { OpenSearch, ElasticSearch, AwsDefaultRegion } from "./extensions/index.js";
import { EnvIs, EnvIsNot } from "@webiny/project/extensions/infra/index.js";

export const Infra = {
    Vpc: Vpc.ReactComponent,
    BlueGreenDeployments: BlueGreenDeployments.ReactComponent,
    ElasticSearch,
    OpenSearch,
    PulumiResourceNamePrefix: PulumiResourceNamePrefix.ReactComponent,
    ProductionEnvironments: ProductionEnvironments.ReactComponent,
    Aws: {
        DefaultRegion: AwsDefaultRegion,
        Tags: AwsTags.ReactComponent
    },
    Env: {
        Is: EnvIs,
        IsNot: EnvIsNot
    },
    Admin: {
        BeforeBuild: AdminBeforeBuild.ReactComponent,
        BeforeDeploy: AdminBeforeDeploy.ReactComponent,
        BeforeWatch: AdminBeforeWatch.ReactComponent,
        AfterBuild: AdminAfterBuild.ReactComponent,
        AfterDeploy: AdminAfterDeploy.ReactComponent,
        Pulumi: AdminPulumi.ReactComponent,
        CustomDomains: AdminCustomDomains.ReactComponent,
        StackOutputValue: AdminStackOutputValue.ReactComponent
    },
    Api: {
        BeforeBuild: ApiBeforeBuild.ReactComponent,
        BeforeDeploy: ApiBeforeDeploy.ReactComponent,
        BeforeWatch: ApiBeforeWatch.ReactComponent,
        AfterBuild: ApiAfterBuild.ReactComponent,
        AfterDeploy: ApiAfterDeploy.ReactComponent,
        Pulumi: ApiPulumi.ReactComponent,
        StackOutputValue: ApiStackOutputValue.ReactComponent
    },
    Core: {
        BeforeBuild: CoreBeforeBuild.ReactComponent,
        BeforeDeploy: CoreBeforeDeploy.ReactComponent,
        BeforeWatch: CoreBeforeWatch.ReactComponent,
        AfterBuild: CoreAfterBuild.ReactComponent,
        AfterDeploy: CoreAfterDeploy.ReactComponent,
        Pulumi: CorePulumi.ReactComponent,
        StackOutputValue: CoreStackOutputValue.ReactComponent
    }
};
