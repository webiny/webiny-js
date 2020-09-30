import gql from "graphql-tag";

export const rolesAutoComplete: any = gql`
    query LoadRoles(
        $where: JSON
        $sort: JSON
        $search: SecurityRoleSearchInput
        $limit: Int
        $after: String
        $before: String
    ) {
        security {
            roles: listRoles(
                where: $where
                sort: $sort
                search: $search
                limit: $limit
                after: $after
                before: $before
            ) {
                data {
                    id
                    name
                }
            }
        }
    }
`;

export const groupsAutoComplete: any = gql`
    query LoadGroups(
        $where: JSON
        $sort: JSON
        $search: SecurityGroupSearchInput
        $limit: Int
        $after: String
        $before: String
    ) {
        security {
            groups: listGroups(
                where: $where
                sort: $sort
                search: $search
                limit: $limit
                after: $after
                before: $before
            ) {
                data {
                    id
                    name
                }
            }
        }
    }
`;
