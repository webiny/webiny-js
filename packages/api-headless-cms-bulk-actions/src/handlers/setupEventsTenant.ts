import { createHandlerOnRequest } from "@webiny/handler";

export const setupEventsTenant = () => {
    return createHandlerOnRequest(async request => {
        request.headers = {
            ...request.headers,
            "x-tenant": request.headers["x-tenant"] || "root"
        };

        return;
    });
};
