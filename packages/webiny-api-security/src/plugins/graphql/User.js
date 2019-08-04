import {
    resolveCreate,
    resolveDelete,
    resolveGet,
    resolveList,
    resolveUpdate
} from "webiny-api/graphql";

import resolveLoginSecurityUser from "./userResolvers/loginUser";
import resolveLoginUsingToken from "./userResolvers/loginUsingToken";
import resolveGetCurrentSecurityUser from "./userResolvers/getCurrentUser";
import resolveUpdateCurrentSecurityUser from "./userResolvers/updateCurrentUser";
import resolveGetCurrentSecurityUserSettings from "./userResolvers/getCurrentUserSettings";
import resolveUpdateCurrentSecurityUserSettings from "./userResolvers/updateCurrentUserSettings";

const userFetcher = ctx => ctx.getEntity("SecurityUser");
const userSettingsFetcher = ctx => ctx.getEntity("SecurityUserSettings");

export default {
    typeDefs: /* GraphQL */ `
        type SecurityUserLogin {
            token: String
            expiresOn: Int
            user: SecurityUser
        }

        type SecurityUserAccess {
            scopes: [String]
            roles: [String]
            fullAccess: Boolean
        }

        type SecurityUser @key(fields: "id") {
            id: ID
            email: String
            firstName: String
            lastName: String
            fullName: String
            gravatar: String
            avatar: File
            enabled: Boolean
            groups: [SecurityGroup]
            roles: [SecurityRole]
            scopes: [String]
            access: SecurityUserAccess
            createdOn: DateTime
        }

        # Contains user settings by specific key, ex: search-filters.
        type SecurityUserSettings {
            key: String
            data: JSON
        }

        # This input type is used by administrators to update other user's accounts
        input SecurityUserInput {
            email: String
            password: String
            firstName: String
            lastName: String
            avatar: RefInput
            enabled: Boolean
            groups: [ID]
            roles: [ID]
        }

        # This input type is used by the user who is updating his own account
        input CurrentSecurityUserInput {
            email: String
            firstName: String
            lastName: String
            avatar: RefInput
            password: String
        }

        type SecurityUserResponse {
            data: SecurityUser
            error: SecurityUserError
        }

        input SecurityUserSearchInput {
            query: String
            fields: [String]
            operator: String
        }

        type SecurityUserListMeta {
            totalCount: Int
            totalPages: Int
            page: Int
            perPage: Int
            from: Int
            to: Int
            previousPage: Int
            nextPage: Int
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
            meta: SecurityUserListMeta
            error: SecurityUserError
        }

        type SecurityUserLoginResponse {
            data: SecurityUserLogin
            error: SecurityUserError
        }

        extend type SecurityQuery {
            "Get current user"
            getCurrentUser: SecurityUserResponse

            "Get settings of current user"
            getCurrentUserSettings(key: String!): JSON

            "Get a single user by id or specific search criteria"
            getUser(id: ID, where: JSON, sort: String): SecurityUserResponse

            "Get a list of users"
            listUsers(
                page: Int
                perPage: Int
                where: JSON
                sort: JSON
                search: SecurityUserSearchInput
            ): SecurityUserListResponse
        }

        extend type SecurityMutation {
            "Login user"
            loginUser(
                username: String!
                password: String!
                remember: Boolean
            ): SecurityUserLoginResponse

            "Login user using token"
            loginUsingToken(token: String!): SecurityUserLoginResponse

            "Update current user"
            updateCurrentUser(data: CurrentSecurityUserInput!): SecurityUserResponse

            "Update settings of current user"
            updateCurrentUserSettings(key: String!, data: JSON!): JSON

            createUser(data: SecurityUserInput!): SecurityUserResponse

            updateUser(id: ID!, data: SecurityUserInput!): SecurityUserResponse

            deleteUser(id: ID!): SecurityUserDeleteResponse
        }
    `,
    resolvers: {
        SecurityUser: {
            __resolveReference(reference, context) {
                return userFetcher(context).findById(reference.id);
            },
            avatar(user) {
                return { __typename: "File", id: user.avatar };
            }
        },
        SecurityQuery: {
            getCurrentUser: resolveGetCurrentSecurityUser(userFetcher),
            getCurrentUserSettings: resolveGetCurrentSecurityUserSettings(userSettingsFetcher),
            getUser: resolveGet(userFetcher),
            listUsers: resolveList(userFetcher)
        },
        SecurityMutation: {
            loginUser: resolveLoginSecurityUser(userFetcher),
            loginUsingToken: resolveLoginUsingToken(userFetcher),
            updateCurrentUser: resolveUpdateCurrentSecurityUser(userFetcher),
            updateCurrentUserSettings: resolveUpdateCurrentSecurityUserSettings(
                userSettingsFetcher
            ),
            createUser: resolveCreate(userFetcher),
            updateUser: resolveUpdate(userFetcher),
            deleteUser: resolveDelete(userFetcher)
        }
    }
};
