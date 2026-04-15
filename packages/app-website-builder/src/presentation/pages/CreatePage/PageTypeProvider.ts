import { PageType, PageTypeProvider as Abstraction } from "./abstractions.js";

class PageTypeProviderImpl implements Abstraction.Interface {
    constructor(private pageTypes: PageType.Interface[]) {}

    getPageTypes(): PageType.Interface[] {
        return this.pageTypes;
    }
}

export const PageTypeProvider = Abstraction.createImplementation({
    implementation: PageTypeProviderImpl,
    dependencies: [[PageType, { multiple: true }]]
});

/**
 * Creates a decorator that removes a page type by name from the provider.
 *
 * Usage (from a React component):
 * ```ts
 * container.registerDecorator(createPageTypeRemovalDecorator("static"));
 * ```
 */
/**
 * Creates a decorator that removes a page type by name from the provider.
 *
 * Usage (from a React component):
 * ```ts
 * container.registerDecorator(createPageTypeRemovalDecorator("static"));
 * ```
 */
export function createPageTypeRemovalDecorator(nameToRemove: string) {
    class RemovePageTypeDecorator implements Abstraction.Interface {
        decoratee: Abstraction.Interface;

        constructor(decoratee: Abstraction.Interface) {
            this.decoratee = decoratee;
        }

        getPageTypes(): PageType.Interface[] {
            return this.decoratee.getPageTypes().filter(pt => pt.name !== nameToRemove);
        }
    }

    return Abstraction.createDecorator({
        decorator: RemovePageTypeDecorator,
        dependencies: []
    });
}
