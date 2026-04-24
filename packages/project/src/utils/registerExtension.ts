import { isDecorator } from "@webiny/di";
import type { Container } from "@webiny/di";

/**
 * Registers an extension in the container.
 * `extension` is typed as `any` because it can be many things.
 */
export function registerExtension(container: Container, extension: any) {
    const isFeature = Reflect.getMetadata("wby:isFeature", extension);

    if (isFeature) {
        extension.register(container);
        return;
    }

    if (isDecorator(extension)) {
        container.registerDecorator(extension);
        return;
    }

    container.register(extension);
}
