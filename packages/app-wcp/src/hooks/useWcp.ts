import { useContext, useCallback } from "react";
import { WcpContext, WcpContextValue } from "../contexts";
import { WcpProject, WcpProjectPackage } from "~/types";

interface UseWcpHook {
    getProject: () => WcpProject | null;
    canUseFeature: (featureId: keyof WcpProjectPackage["features"]) => boolean;
}

export function useWcp(): UseWcpHook {
    const context = useContext<WcpContextValue>(WcpContext);

    const getProject: UseWcpHook["getProject"] = useCallback(
        () => context.project,
        [context.project]
    );

    const canUseFeature: UseWcpHook["canUseFeature"] = useCallback(
        featureId => {
            return context.project?.package?.features?.[featureId]?.enabled === true;
        },
        [context.project]
    );

    return { getProject, canUseFeature };
}
