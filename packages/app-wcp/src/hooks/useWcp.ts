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
            // For backwards compatibility with projects created prior to 5.29.0 release.
            if (context.project === null && featureId === "multiTenancy") {
                return process.env.REACT_APP_WEBINY_MULTI_TENANCY === "true";
            }

            return context.project?.package?.features?.[featureId]?.enabled === true;
        },
        [context.project]
    );

    return { getProject, canUseFeature };
}
