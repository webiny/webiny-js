import { ICreateQueryFactory } from "./types";

export const createQueryFactory: ICreateQueryFactory = ({ invoke }) => {
    return ({ query }) => {
        return params => {
            return invoke({
                httpMethod: "POST",
                headers: params?.headers,
                body: {
                    query,
                    variables: params?.variables
                }
            });
        };
    };
};
