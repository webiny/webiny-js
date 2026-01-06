import type { Container } from "@webiny/di";

export interface FeatureDefinition<TRegister> {
    name: string;
    register(container: Container, context?: TRegister): void;
}

export function createFeature<TRegister>(def: {
    name: string;
    register(container: Container, context?: TRegister): void;
}): FeatureDefinition<TRegister> {
    const feature = {
        name: def.name,
        register: def.register
    };

    Reflect.defineMetadata("wby:isFeature", true, feature);

    return feature as FeatureDefinition<TRegister>;
}
