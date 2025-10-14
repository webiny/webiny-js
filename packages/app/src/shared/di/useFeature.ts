import type { Container } from "@webiny/di-container";
import { useContainer } from "./DiContainerProvider.js";
import { FeatureDefinition } from "./createFeature.js";

const featureCache = new WeakMap<Container, Map<string, unknown>>();

export function useFeature<TExports>(feature: FeatureDefinition<TExports>): TExports {
    const container = useContainer();

    let featureMap = featureCache.get(container);
    if (!featureMap) {
        featureMap = new Map();
        featureCache.set(container, featureMap);
    }

    if (featureMap.has(feature.name)) {
        return featureMap.get(feature.name) as TExports;
    }

    const exports = feature.resolve(container);
    featureMap.set(feature.name, exports);
    return exports;
}
