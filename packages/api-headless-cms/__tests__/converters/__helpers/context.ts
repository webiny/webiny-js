import { useHandler } from "~tests/testHelpers/useHandler.js";

export const getContext = async () => {
    const contextHandler = useHandler({
        path: "manage"
    });
    return await contextHandler.handler({
        path: "manage",
        headers: {
            "x-tenant": "root"
        }
    });
};
