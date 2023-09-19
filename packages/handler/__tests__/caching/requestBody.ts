import { InjectOptions } from "fastify";

export const createRequestBodyValue = () => {
    return {
        name: "John",
        lastName: "Doe"
    };
};
export const createRequestBody = (): InjectOptions => {
    return {
        path: "/webiny-post",
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        query: {},
        payload: JSON.stringify(createRequestBodyValue())
    };
};
