import type { Container } from "@webiny/di-container";

export interface FeatureDefinition<TRegister> {
    name: string;
    register(container: Container, context?: TRegister): void;
}

export function createFeature<TRegister>(def: {
    name: string;
    register(container: Container, context?: TRegister): void;
}): FeatureDefinition<TRegister> {
    return {
        name: def.name,
        register: def.register
    };
}
