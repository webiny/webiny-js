import { createHandler } from "@webiny/handler-aws/raw";

export const useHandler = (...plugins: any[]) => {
    const handler = createHandler({
        plugins: [...plugins]
    });

    return { handler };
};
