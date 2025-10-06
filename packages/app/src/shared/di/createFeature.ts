import { Container } from "@webiny/di-container";

export interface FeatureDefinition<TExports = any, TParams extends any[] = []> {
    name: string;
    register: (container: Container, ...args: TParams) => void;
    resolve: (container: Container) => TExports;
}

export function createFeature<
    TExports = any,
    TParams extends any[] = [] // tuple for extra args
>(def: {
    name: string;
    register: (container: Container, ...args: TParams) => void;
    resolve: (container: Container) => TExports;
}): FeatureDefinition<TExports, TParams> {
    return {
        name: def.name,
        register: def.register,
        resolve: (container: Container): TExports => {
            return def.resolve(container);
        }
    };
}
