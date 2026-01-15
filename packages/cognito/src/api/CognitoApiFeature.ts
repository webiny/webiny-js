import { createFeature } from "@webiny/feature/api";
import { AdminUsersSchema } from "~/api/graphql/user.gql.js";
import { AdminUserInstallerFeature } from "./features/AdminUserInstaller/feature.js";
import { CognitoIdpFeature } from "./features/CognitoIdp/index.js";
import { CognitoService } from "./features/shared/CognitoService.js";
import { CreateAdminUserFeature } from "./features/CreateAdminUser/index.js";
import { UpdateAdminUserFeature } from "./features/UpdateAdminUser/index.js";
import { DeleteAdminUserFeature } from "./features/DeleteAdminUser/index.js";
import { CognitoConfig } from "./features/shared/abstractions.js";

export const CognitoApiFeature = createFeature({
    name: "CognitoApiFeature",
    register(container) {
        container.registerInstance(CognitoConfig, {
            region: process.env.COGNITO_REGION,
            userPoolId: process.env.COGNITO_USER_POOL_ID
        });

        container.register(CognitoService).inSingletonScope();

        // Register features
        CreateAdminUserFeature.register(container);
        UpdateAdminUserFeature.register(container);
        DeleteAdminUserFeature.register(container);
        AdminUserInstallerFeature.register(container);
        CognitoIdpFeature.register(container);

        // Register GraphQL schema
        container.register(AdminUsersSchema);
    }
});
