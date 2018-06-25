// @flow
import type { Api } from "webiny-api";

// TODO: odvojiti install proceduru jer ovdje se ne triggera do prvog requesta

export default (app: Api) => {
    return async (event: any) => {
        const handle = await app.prepare();
        const { output, statusCode } = await handle({ event });

        return {
            statusCode: statusCode || 200,
            headers: {
                "Access-Control-Allow-Origin": "*"
            },
            body: JSON.stringify(output)
        };
    };
};
