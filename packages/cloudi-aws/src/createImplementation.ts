import type { Abstraction } from "@webiny/di";
import type { ICloudFunction } from "./createFunction.js";

/**
 * Configuration for creating a function implementation
 */
export interface CreateImplementationConfig<TEvent = any, TResult = any> {
    /**
     * The abstraction this implementation satisfies
     */
    abstraction: Abstraction<ICloudFunction<TEvent, TResult>>;

    /**
     * The implementation class
     */
    implementation: new (...args: any[]) => ICloudFunction<TEvent, TResult>;

    /**
     * Dependencies required by the implementation
     */
    dependencies: Array<Abstraction<any>>;
}

/**
 * Create a function implementation that can be registered in the DI container
 *
 * @example
 * ```ts
 * export const listUsersFunction = createImplementation({
 *     abstraction: ApiGatewayFunction,
 *     implementation: ListUsersFunction,
 *     dependencies: [UserService, LoggerService]
 * });
 * ```
 */
export function createImplementation<TEvent = any, TResult = any>(
    config: CreateImplementationConfig<TEvent, TResult>
) {
    return {
        abstraction: config.abstraction,
        implementation: config.implementation,
        dependencies: config.dependencies
    };
}

