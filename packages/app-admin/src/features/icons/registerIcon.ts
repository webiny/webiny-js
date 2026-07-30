import { Container } from "@webiny/di";
import { IconRegistry, type IconComponent } from "./abstractions.js";

/**
 * Registers (or overrides) an icon under `key` in the singleton `IconRegistry`. The registry
 * must already be registered in the container (see `IconRegistryFeature`).
 */
export function registerIcon(container: Container, key: string, component: IconComponent): void {
    container.resolve(IconRegistry).register(key, component);
}
