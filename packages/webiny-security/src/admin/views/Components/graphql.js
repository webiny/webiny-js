// @flow
import gql from "graphql-tag";

export const rolesAutoComplete = gql`
    query LoadRoles($where: JSON, $sort: JSON, $page: Int, $perPage: Int, $search: SearchInput) {
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
    query LoadGroups($where: JSON, $sort: JSON, $page: Int, $perPage: Int, $search: SearchInput) {
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
