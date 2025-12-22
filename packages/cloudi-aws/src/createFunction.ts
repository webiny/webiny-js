import { Container } from "@webiny/di";
import type { FunctionSetup, NextFunction } from "./types.js";

/**
 * Generic function interface that all implementations should follow
 */
export interface ICloudFunction<TEvent = any, TResult = any> {
    execute(event: TEvent, next: NextFunction): Promise<TResult>;
}

/**
 * Function implementation metadata
 */
export interface FunctionImplementation {
    abstraction: any;
    implementation: new (...args: any[]) => ICloudFunction;
    dependencies: Array<any>;
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
                // If it's a function implementation, store it
                if (implementation && implementation.abstraction) {
                    registeredImplementations.push(implementation as FunctionImplementation);
                }
                return originalRegister(implementation);
            } as any;

            // Run user setup - this is the composition root
            await setup(container);

            // Restore original register (though it won't be called again after setup)
            container.register = originalRegister;
        }

        // Build middleware chain
        let currentIndex = 0;

        const next: NextFunction = async () => {
            if (currentIndex >= registeredImplementations.length) {
                throw new Error(
                    `No registered function implementation handled this event. ` +
                    `Registered ${registeredImplementations.length} implementations. ` +
                    `Event type: ${JSON.stringify(Object.keys(event).slice(0, 5))}`
                );
            }

            const implementation = registeredImplementations[currentIndex++];
            const functionInstance = container!.resolve(implementation.abstraction);

            return functionInstance.execute(event, next);
        };

        // Start the middleware chain
        return next();
    };
}

