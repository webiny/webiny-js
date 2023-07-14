import gql from "graphql-tag";
import { AcoError, AcoModel } from "~/types";

export interface GraphQlAcoApp {
    id: string;
    model: AcoModel;
}
export interface GetAppResult {
    aco: {
        app: {
            data: GraphQlAcoApp | null;
            error: AcoError | null;
        };
    };
}
export interface GetAppVariables {
    id: string;
}

export const createGetAppQuery = () => {
    return gql`
        query GetApp($id: ID!) {
            aco {
                app: getApp(id: $id) {
                    data {
                        id
                        model
                    }
                    error {
                        code
                        message
                        data
                        stack
                    }
                }
            }
        }
    `;
};
