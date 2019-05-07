// @flow
import {
    resolveCreate,
    resolveDelete,
    resolveGet,
    resolveList,
    resolveUpdate
} from "webiny-api/graphql";

import resolveLoginUser from "./userResolvers/loginUser";
import resolveLoginUsingToken from "./userResolvers/loginUsingToken";
import resolveGetCurrentUser from "./userResolvers/getCurrentUser";
import resolveUpdateCurrentUser from "./userResolvers/updateCurrentUser";
import { UserType } from "./types";
import Role from "./Role";
import Group from "./Group";

const userFetcher = ctx => ctx.security.entities.User;

export default {
    typeDefs: () => [
        Role.typeDefs,
        Group.typeDefs,
        UserType,
        /* GraphQL */ `
            type Avatar {
                name: String
                size: Int
                type: String
                src: String
            }

            type UserLogin {
                token: String
                expiresOn: Int
                user: User
            }

            # This input type is used by administrators to update other user's accounts
            input UserInput {
                email: String
                password: String
                firstName: String
                lastName: String
                avatar: FileInput
                enabled: Boolean
                groups: [ID]
                roles: [ID]
            }

            # This input type is used by the user who is updating his own account
            input CurrentUserInput {
                email: String
                firstName: String
                lastName: String
                avatar: FileInput
                password: String
            }

            type UserResponse {
                data: User
                error: Error
            }

            type UserListResponse {
                data: [User]
                meta: ListMeta
                error: Error
            }

            type UserLoginResponse {
                data: UserLogin
                error: Error
            }
        `
    ],
    typeExtensions: `
        extend type SecurityQuery {
            # "Get current user"
            getCurrentUser: UserResponse
            
            # "Get a single user by id or specific search criteria"
            getUser(
                id: ID 
                where: JSON
                sort: String
            ): UserResponse
            
            # "Get a list of users"
            listUsers(
                page: Int
                perPage: Int
                where: JSON
                sort: JSON
                search: SearchInput
            ): UserListResponse
        }
        
        extend type SecurityMutation {
            # "Login user"
            loginUser(
                username: String! 
                password: String! 
                remember: Boolean
            ): UserLoginResponse
            
            # "Login user using token"
            loginUsingToken(
                token: String! 
            ): UserLoginResponse
            
            # "Update current user"
            updateCurrentUser(
                data: CurrentUserInput!
            ): UserResponse
            
            createUser(
                data: UserInput!
            ): UserResponse
            
            updateUser(
                id: ID!
                data: UserInput!
            ): UserResponse
        
            deleteUser(
                id: ID!
            ): DeleteResponse
        }
    `,
    resolvers: {
        SecurityQuery: {
            getCurrentUser: resolveGetCurrentUser(userFetcher),
            getUser: resolveGet(userFetcher),
            listUsers: resolveList(userFetcher)
        },
        SecurityMutation: {
            loginUser: resolveLoginUser(userFetcher),
            loginUsingToken: resolveLoginUsingToken(userFetcher),
            updateCurrentUser: resolveUpdateCurrentUser(userFetcher),
            createUser: resolveCreate(userFetcher),
            updateUser: resolveUpdate(userFetcher),
            deleteUser: resolveDelete(userFetcher)
        }
    }
};
