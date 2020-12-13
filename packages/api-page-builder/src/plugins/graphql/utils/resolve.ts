import { Response, ErrorResponse } from "@webiny/handler-graphql";

export default async fn => {
    try {
        return new Response(await fn());
    } catch (e) {
        return new ErrorResponse(e);
    }
};
