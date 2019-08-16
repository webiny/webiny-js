// @flow
import gql from "graphql-tag";

export const rolesAutoComplete = gql`
    query LoadRoles($where: JSON, $sort: JSON, $page: Int, $perPage: Int, $search: SecurityRoleSearchInput) {
        security {
            roles: listRoles(
                where: $where
                sort: $sort
                page: $page
                perPage: $perPage
                search: $search
            ) {
                data {
                    id
                    name
                }
            }
        }
    }
`;

export const groupsAutoComplete = gql`
    query LoadGroups($where: JSON, $sort: JSON, $page: Int, $perPage: Int, $search: SecurityGroupSearchInput) {
        security {
            groups: listGroups(
                where: $where
                sort: $sort
                page: $page
                perPage: $perPage
                search: $search
            ) {
                data {
                    id
                    name
                }
            }
        }
    }
`;
