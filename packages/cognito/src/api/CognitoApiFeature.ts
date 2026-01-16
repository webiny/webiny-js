import { createFeature } from "@webiny/feature/api";
import { AdminUsersSchema } from "~/api/graphql/user.gql.js";
import { UserInstallerFeature } from "./features/UserInstaller/feature.js";
import { CognitoIdpFeature } from "./features/CognitoIdp/index.js";
import { CreateUserFeature } from "./features/CreateUser/index.js";
import { UpdateUserFeature } from "./features/UpdateUser/index.js";
import { DeleteUserFeature } from "./features/DeleteUser/index.js";
import { CognitoServiceFeature } from "~/api/features/CognitoService/feature.js";

export const CognitoApiFeature = createFeature({
    name: "CognitoApiFeature",
    register(container) {
        // Register features
        CreateUserFeature.register(container);
        UpdateUserFeature.register(container);
        DeleteUserFeature.register(container);
        UserInstallerFeature.register(container);
        CognitoIdpFeature.register(container);
        CognitoServiceFeature.register(container, {
            region: String(process.env.COGNITO_REGION),
            userPoolId: String(process.env.COGNITO_USER_POOL_ID)
        });

        // Register GraphQL schema
        container.register(AdminUsersSchema);
    }
});
