export const createLambdaEvent = () => {
    return {
        method: "post",
        body: JSON.stringify({
            someRequestParameter: true
        }),
        headers: {
            "x-webiny-test": "yes"
        },
        cookies: ["MyWebinyCookie: no"],
        path: {
            base: "/webiny",
            parameters: {
                yes: true,
                no: false
            },
            query: ""
        }
    };
};
