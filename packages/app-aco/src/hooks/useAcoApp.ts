import { useContext } from "react";
import { AcoAppContext } from "~/contexts/app";

export const useAcoApp = () => {
    const context = useContext(AcoAppContext);

    if (!context) {
        throw new Error("useAcoApp must be used within a AcoAppContext");
    }

    return {
        app: context.app,
        model: context.model,
        loading: context.loading,
        error: context.error
    };
};
