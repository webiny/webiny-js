import type { Container } from "@webiny/di";

export type FeatureDefinition<TRegister = void> = [TRegister] extends [void]
    ? {
          name: string;
          register(container: Container): void;
      }
    : {
          name: string;
          register(container: Container, context: TRegister): void;
      };

export function createFeature<TRegister = void>(
    def: FeatureDefinition<TRegister>
): FeatureDefinition<TRegister> {
    const feature = {
        name: def.name,
        register: def.register
    };

    Reflect.defineMetadata("wby:isFeature", true, feature);

    return feature as FeatureDefinition<TRegister>;
}
