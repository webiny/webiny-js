import { useContainer } from "@webiny/app";
import { useMemo } from "react";
import { LexicalContext } from "~/exports/admin.js";

export const useLexicalContext = () => {
    const container = useContainer();

    return useMemo(() => {
        const lexicalContext = container.resolve(LexicalContext);
        return { lexicalContext };
    }, [container]);
};
