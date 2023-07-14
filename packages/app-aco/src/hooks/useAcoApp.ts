import { useContext } from "react";
import { AcoAppContext, AcoAppProviderContext } from "~/contexts/app";

export const useAcoApp = (): AcoAppProviderContext => {
    const context = useContext(AcoAppContext);

    if (!context) {
        throw new Error("useAcoApp must be used within a AcoAppContext");
    }

    return {
        app: context.app,
        folderIdPath: context.folderIdPath,
        folderIdInPath: context.folderIdInPath,
        model: context.model,
        client: context.client,
        mode: context.mode,
        loading: context.loading,
        error: context.error
    };
};
