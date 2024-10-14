import { ICreateMutationFactory } from "./types";

export const createMutationFactory: ICreateMutationFactory = ({ invoke }) => {
    return ({ mutation }) => {
        return params => {
            return invoke({
                httpMethod: "POST",
                headers: params?.headers,
                body: {
                    query: mutation,
                    variables: params?.variables
                }
            });
        };
    };
};
