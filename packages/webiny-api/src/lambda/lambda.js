// @flow
import type { Api } from "webiny-api";

export default (api: Api) => {
    return async (event: any) => {
        const handle = await api.prepare();
        const { output, statusCode } = await handle({ event });

        return {
            statusCode: statusCode || 200,
            headers: {
                "Access-Control-Allow-Origin": "*"
            },
            body: JSON.stringify(output, null, 2)
        };
    };
};
