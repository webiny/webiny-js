// @flow
import {
    resolveCreate,
    resolveDelete,
    resolveGet,
    resolveList,
    resolveUpdate
} from "webiny-api/graphql";

import resolveLoginUser from "./userResolvers/loginUser";
import resolveGetCurrentUser from "./userResolvers/getCurrentUser";
import resolveUpdateCurrentUser from "./userResolvers/updateCurrentUser";
import resolveGetCurrentUserSettings from "./userResolvers/getCurrentUserSettings";
import resolveUpdateCurrentUserSettings from "./userResolvers/updateCurrentUserSettings";

const userFetcher = ctx => ctx.security.User;
const userSettingsFetcher = ctx => ctx.security.UserSettings;

export default {
    typeDefs: `
        type Avatar {
            name: String
            size: Int
            type: String
            src: String
        }
        
        input AvatarInput {
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
         
        type User {
            id: ID
            email: String
            firstName: String
            lastName: String
            fullName: String
            gravatar: String
            avatar: Avatar
            enabled: Boolean
            groups: [Group]
            roles: [Role]
            scopes: [String]
            createdOn: DateTime
        }
        
        "Contains user settings by specific key, ex: search-filters."
        type UserSettings {
            key: String
            data: JSON
        }
        
        # This input type is used by administrators to update other user's accounts 
        input UserInput {
            id: ID!
            email: String
            firstName: String
            lastName: String
            avatar: AvatarInput
            enabled: Boolean
            groups: [ID!]
            roles: [ID!]
        }
        
        # This input type is used by the user who is updating his own account
        input CurrentUserInput {
            firstName: String
            lastName: String
            avatar: AvatarInput
            password: String
        }
        
        type UserList {
            data: [User]
            meta: ListMeta
        }
        
        type UserLoginResponse {
            data: UserLogin
            error: Error
        }
    `,
    queryFields: `
        "Get current user"
        getCurrentUser: User
        
        "Get settings of current user"
        getCurrentUserSettings(key: String!): JSON
        
        "Get a single user by id or specific search criteria"
        getUser(
            id: ID 
            where: JSON
            sort: String
        ): User
        
        "Get a list of users"
        listUsers(
            page: Int
            perPage: Int
            where: JSON
            sort: JSON
            search: SearchInput
        ): UserList
    `,
    mutationFields: `
        "Login user"
        loginUser(
            username: String!, 
            password: String!, 
            remember: Boolean
        ): UserLoginResponse
        
        "Update current user"
        updateCurrentUser(
            data: CurrentUserInput!
        ): User
        
        "Update settings of current user"
        updateCurrentUserSettings(
            key: String!, 
            data: JSON!
        ): JSON
        
        createUser(
            data: UserInput!
        ): User
        
        updateUser(
            data: UserInput!
        ): User
    
        deleteUser(
            id: ID!
        ): Boolean
    `,
    queryResolvers: {
        getCurrentUser: resolveGetCurrentUser(userFetcher),
        getCurrentUserSettings: resolveGetCurrentUserSettings(userSettingsFetcher),
        getUser: resolveGet(userFetcher),
        listUsers: resolveList(userFetcher)
    },
    mutationResolvers: {
        loginUser: resolveLoginUser(userFetcher),
        updateCurrentUser: resolveUpdateCurrentUser(userFetcher),
        updateCurrentUserSettings: resolveUpdateCurrentUserSettings(userSettingsFetcher),
        createUser: resolveCreate(userFetcher),
        updateUser: resolveUpdate(userFetcher),
        deleteUser: resolveDelete(userFetcher),
    }
};
