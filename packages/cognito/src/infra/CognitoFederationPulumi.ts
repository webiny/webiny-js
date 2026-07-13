import { CorePulumi } from "@webiny/project-aws/exports/infra/core.js";
import {
    configureAdminCognitoFederation,
    type CognitoIdentityProvidersConfig
} from "@webiny/project-aws/pulumi/apps/core/cognitoIdentityProviders/configure.js";

class CognitoFederationPulumiImpl implements CorePulumi.Interface {
    execute(app: CorePulumi.Params): void {
        const raw = process.env.COGNITO_FEDERATION_INFRA_CONFIG;
        if (!raw) {
            return;
        }

        const config: CognitoIdentityProvidersConfig = JSON.parse(raw);
        configureAdminCognitoFederation(app, config);
    }
}

export default CorePulumi.createImplementation({
    implementation: CognitoFederationPulumiImpl,
    dependencies: []
});
