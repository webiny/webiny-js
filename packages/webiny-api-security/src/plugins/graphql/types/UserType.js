import GroupType from "./GroupType";
import RoleType from "./RoleType";
export default /* GraphQL */ `
    ${GroupType}
    ${RoleType}

    type UserAccess {
        scopes: [String]
        roles: [String]
        fullAccess: Boolean
    }

    type User {
        id: ID
        email: String
        firstName: String
        lastName: String
        fullName: String
        gravatar: String
        avatar: File
        enabled: Boolean
        groups: [Group]
        roles: [Role]
        scopes: [String]
        access: UserAccess
        createdOn: DateTime
    }
`;
