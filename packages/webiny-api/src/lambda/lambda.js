// @flow
import createApolloHandler from "./createApolloHandler";

function getErrorResponse(error: Error & Object) {
    return {
        body: JSON.stringify({
            errors: [{ code: error.code, message: error.message }]
        }),
        statusCode: 200,
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true
        }
    };
}

let handler = {};

export const createHandler = (configFactory: (context: Object) => Promise<Object>) => {
    return async (event: Object, context: Object) => {
        const config = await configFactory(context);

        return await new Promise(async (resolve, reject) => {
            const cacheKey =
                config.handler && config.handler.cacheKey ? config.handler.cacheKey : "default";
            if (!handler[cacheKey]) {
                try {
                    handler[cacheKey] = await createApolloHandler(config);
                } catch (e) {
                    if (process.env.NODE_ENV === "development") {
                        console.log(e); // eslint-disable-line
                    }
                    return resolve(getErrorResponse(e));
                }
            }

            handler[cacheKey](event, context, (error, data) => {
                if (error) {
                    return reject(error);
                }

                if (
                    process.env.NODE_ENV !== "production" &&
                    data.headers["Content-Type"] === "application/json"
                ) {
                    data.body = JSON.stringify(JSON.parse(data.body), null, 2);
                }

                data.headers = {
                    ...data.headers,
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Credentials": true
                };
                resolve(data);
            });
        });
    };
};
