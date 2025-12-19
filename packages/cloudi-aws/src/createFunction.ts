import { Container } from "@webiny/di";
import type { FunctionSetup } from "./types.js";

/**
 * Generic function interface that all implementations should follow
 */
export interface ICloudFunction<TEvent = any, TResult = any> {
    execute(event: TEvent): Promise<TResult>;
}

/**
 * Function implementation with canUse detection
 */
export interface FunctionImplementation {
    abstraction: any;
    implementation: new (...args: any[]) => ICloudFunction;
    dependencies: Array<any>;
    canUse: (event: any) => boolean;
}

export function createFunction(setup: FunctionSetup) {
    let container: Container | null = null;
    let registeredImplementations: FunctionImplementation[] = [];

    return async (event: any): Promise<any> => {
        // Initialize on cold start
        if (!container) {
            container = new Container();

            // Intercept register calls to collect implementations
            const originalRegister = container.register.bind(container);
            container.register = function (implementation: any) {
                // If it's a function implementation with canUse, store it
                if (implementation && implementation.canUse && implementation.abstraction) {
                    registeredImplementations.push(implementation as FunctionImplementation);
                }
                return originalRegister(implementation);
            } as any;

            // Run user setup - this is the composition root
            await setup(container);

            // Restore original register (though it won't be called again after setup)
            container.register = originalRegister;
        }

        // Find the matching handler based on the event
        const matchingImplementation = registeredImplementations.find(impl =>
            impl.canUse(event)
        );

        if (!matchingImplementation) {
            throw new Error(
                `No registered function implementation can handle this event. ` +
                    `Registered ${registeredImplementations.length} implementations. ` +
                    `Event type: ${JSON.stringify(Object.keys(event).slice(0, 5))}`
            );
        }

        // Resolve the function instance from container
        const functionInstance = container.resolve(matchingImplementation.abstraction);

        // Execute the function
        return functionInstance.execute(event);
    };
}

