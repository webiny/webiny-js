import { useWcp } from "@webiny/app-admin";

export const useCanUseWorkflows = () => {
    const wcp = useWcp();

    const canUseWorkflows = wcp.canUseWorkflows();

    return {
        canUseWorkflows
    };
};
