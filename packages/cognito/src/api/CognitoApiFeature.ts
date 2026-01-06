import { createFeature } from "@webiny/feature/api";
import { AdminUserInstallerFeature } from "./features/AdminUserInstaller/feature.js";
import { CognitoIdpFeature } from "./features/CognitoIdp/index.js";
import { SyncWithCognitoFeature } from "./features/SyncWithCognito/feature.js";
import { AdminUsersSchema } from "~/api/graphql/user.gql.js";

export const CognitoApiFeature = createFeature({
    name: "CognitoApiFeature",
    register(container) {
        AdminUserInstallerFeature.register(container);
        CognitoIdpFeature.register(container);
        SyncWithCognitoFeature.register(container);

        container.register(AdminUsersSchema);
    }
});
