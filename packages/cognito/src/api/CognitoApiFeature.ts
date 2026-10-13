import { createFeature } from "@webiny/feature/api";
import { AdminUsersSchema } from "~/api/graphql/user.gql.js";
import { UserInstallerFeature } from "./features/UserInstaller/feature.js";
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
        // CognitoIdpFeature is not registered here: the AWS API handler registers it in the root
        // container (the request auth step needs it before extensions register). Registering it
        // again per request would add a second Cognito identity provider to every request.
        CognitoServiceFeature.register(container, {
            region: String(process.env.COGNITO_REGION),
            userPoolId: String(process.env.COGNITO_USER_POOL_ID)
        });

        // Register GraphQL schema
        container.register(AdminUsersSchema);
    }
});
