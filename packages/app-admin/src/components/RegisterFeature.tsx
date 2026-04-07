import React, { useMemo } from "react";
import { useContainer } from "@webiny/app";
import type { FeatureDefinition } from "@webiny/feature/admin";

// Extract the first parameter type from TParams tuple
type ExtractOptions<TParams extends any[]> = TParams extends [infer First, ...any[]]
    ? First
    : never;

// Conditional props based on whether feature requires options
type RegisterFeatureProps<TParams extends any[]> = {
    feature: FeatureDefinition<any, TParams>;
} & (TParams extends [] ? { options?: never } : { options: ExtractOptions<TParams> });

const RegisterFeatureImpl = <TParams extends any[]>({
    feature,
    options
}: RegisterFeatureProps<TParams>) => {
    const container = useContainer();
    useMemo(() => {
        // Cast feature.register to accept ...any[] to avoid type narrowing issues
        const register = feature.register as (container: any, ...args: any[]) => void;
        if (options !== undefined) {
            register(container, options);
        } else {
            register(container);
        }
    }, [container, feature, options]);
    return null;
};

export const RegisterFeature = React.memo(RegisterFeatureImpl);
