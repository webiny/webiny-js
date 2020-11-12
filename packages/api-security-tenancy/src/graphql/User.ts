import { hasPermission } from "@webiny/api-security";
import resolveLogin from "./userResolvers/login";
import resolveUpdateCurrentUser from "./userResolvers/updateCurrentUser";
import resolveCreateUser from "./userResolvers/createUser";
import resolveUpdateUser from "./userResolvers/updateUser";
import resolveDeleteUser from "./userResolvers/deleteUser";
import listUsers from "./userResolvers/listUsers";
import getUser from "./userResolvers/getUser";

export default {
    typeDefs: /* GraphQL */ `    
        type TenantWithPermissions {
            id: ID
            name: String
            permissions: [JSON]
        }

        type SecurityIdentity {
            id: ID
            login: String
            permissions: [TenantWithPermissions]
            firstName: String
            lastName: String
            fullName: String
            avatar: JSON
            gravatar: String
        }

        type SecurityUser {
            login: String
            firstName: String
            lastName: String
            fullName: String
            gravatar: String
            avatar: JSON
            createdOn: DateTime
        }

        """
        Contains user settings by specific key, ex: search-filters.
        """
        type SecurityUserSettings {
            key: String
            data: JSON
        }

        """
        This input type is used by administrators to update other user's accounts within the same tenant.
        """
        input SecurityUserInput {
            login: String
            firstName: String
            lastName: String
            avatar: JSON
        }

        """
        This input type is used by the user who is updating his own account
        """
        input SecurityCurrentUserInput {
            login: String
            firstName: String
            lastName: String
            avatar: JSON
        }

        type SecurityUserResponse {
            data: SecurityUser
            error: SecurityUserError
        }

        type SecurityUserError {
            code: String
            message: String
            data: JSON
        }

        type SecurityUserDeleteResponse {
            data: Boolean
            error: SecurityUserError
        }

        type SecurityUserListResponse {
            data: [SecurityUser]
            error: SecurityUserError
        }

        type SecurityIdentityLoginResponse {
            data: SecurityIdentity
            error: SecurityError
        }

        extend type SecurityQuery {
            "Get a single user by id or specific search criteria"
            getUser(login: String): SecurityUserResponse

            "Get a list of users"
            listUsers: SecurityUserListResponse
        }

        extend type SecurityMutation {
            "Login using ID token obtained from a 3rd party identity provider"
            login: SecurityIdentityLoginResponse

            "Update current user"
            updateCurrentUser(data: SecurityCurrentUserInput!): SecurityUserResponse

            createUser(data: SecurityUserInput!): SecurityUserResponse

            updateUser(login: String!, data: SecurityUserInput!): SecurityUserResponse

            deleteUser(login: String!): SecurityUserDeleteResponse
        }
    `,
    resolvers: {
        PersonalAccessToken: {
            token: pat => {
                return pat.token.substr(-4);
            }
        },
        SecurityUser: {
            fullName(user) {
                return `${user.firstName} ${user.lastName}`;
            },
            async avatar(user) {
                return user.avatar;
            }
        },
        SecurityIdentity: {
            fullName(user) {
                return `${user.firstName} ${user.lastName}`;
            },
            login: (_, args, context) => {
                return context.security.getIdentity().login;
            },
            async avatar(user) {
                return user.avatar;
            },
            async permissions(user, args, context) {
                return context.security.tenant.getUserPermissions(user.id);
            }
        },
        SecurityQuery: {
            getUser: hasPermission("security.user.manage")(getUser),
            listUsers: hasPermission("security.user.manage")(listUsers)
        },
        SecurityMutation: {
            login: resolveLogin,
            updateCurrentUser: resolveUpdateCurrentUser,
            createUser: hasPermission("security.user.manage")(resolveCreateUser),
            updateUser: hasPermission("security.user.manage")(resolveUpdateUser),
            deleteUser: hasPermission("security.user.manage")(resolveDeleteUser)
        }
    }
};
