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

/**
 * Create a DI-enabled cloud function that auto-detects the handler based on event type
 *
 * @param setup - Composition root where you register implementations using container.register()
 *
 * @example
 * ```ts
 * // 1. Create implementations
 * export class ListUsersFunctionImpl implements ApiGatewayFunction.Interface {
 *   constructor(private userService: UserService.Interface) {}
 *   async execute(event: APIGatewayEvent): Promise<APIGatewayProxyResult> { }
 * }
 *
 * export const ListUsersFunction = ApiGatewayFunction.createImplementation({
 *   implementation: ListUsersFunctionImpl,
 *   dependencies: [UserService]
 * });
 *
 * export class ProcessOrderFunctionImpl implements SnsFunction.Interface {
 *   constructor(private orderService: OrderService.Interface) {}
 *   async execute(event: SNSEvent): Promise<SnsResult> { }
 * }
 *
 * export const ProcessOrderFunction = SnsFunction.createImplementation({
 *   implementation: ProcessOrderFunctionImpl,
 *   dependencies: [OrderService]
 * });
 *
 * // 2. Register all handlers in one Lambda
 * export const handler = createFunction(async (container) => {
 *   // Register services
 *   container.register(UserService).inSingletonScope();
 *   container.register(OrderService).inSingletonScope();
 *
 *   // Register multiple function implementations
 *   container.register(ListUsersFunction).inSingletonScope();
 *   container.register(ProcessOrderFunction).inSingletonScope();
 * });
 *
 * // The handler will automatically execute the right implementation
 * // based on the AWS event type (API Gateway, SNS, S3, etc.)
 * ```
 */
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

