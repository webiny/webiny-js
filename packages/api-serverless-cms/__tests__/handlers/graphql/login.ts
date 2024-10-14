import { ICreateMutationCb, MutationBody } from "~tests/handlers/helpers/factory";

export interface ICreateMockLoginParams {
    createMutation: ICreateMutationCb;
}

export interface ILoginMutationVariables {
    username: string;
    password: string;
}

const createLoginMutation = (): MutationBody => {
    return `mutation Login {
        security {
            login {
                data {
                    id
                    displayName
                    type
                    permissions
                }
                error {
                    code
                    data
                    message
                }
            }
        }
    }`;
};

export const createMockLogIn = (params: ICreateMockLoginParams) => {
    const { createMutation } = params;
    return {
        loginIdentity: createMutation<ILoginMutationVariables>({
            mutation: createLoginMutation()
        })
    };
};
