import gql from "graphql-tag";
import type { GenericRecord } from "@webiny/app/types.js";
export interface IRole {
    id: string;
    slug: string;
    name: string;
    description: string;
    createdOn: string;
}

export interface IError {
    data: GenericRecord;
    message: string;
    code: string;
}

export interface IListRolesResponse {
    security: {
        roles: {
            data: IRole[];
            error: IError | null;
        };
    };
}

export const LIST_ROLES = gql`
    query ListRoles {
        security {
            roles: listRoles {
                data {
                    id
                    slug
                    name
                    description
                    createdOn
                }
                error {
                    data
                    message
                    code
                }
            }
        }
    }
`;
