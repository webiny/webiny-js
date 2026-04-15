import { useMemo } from "react";
import { useContainer } from "./DiContainerProvider.js";
import { FeatureDefinition } from "./createFeature.js";

export function useFeature<TExports>(feature: FeatureDefinition<TExports, any[]>): TExports {
    const container = useContainer();

    return useMemo(() => feature.resolve(container), [container, feature]);
}
