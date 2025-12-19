import { Container, type Abstraction } from "@webiny/di";
import type { FunctionSetup, CreateFunctionOptions } from "./types.js";

/**
 * Generic function interface that all implementations should follow
 */
export interface ICloudFunction<TEvent = any, TResult = any> {
    execute(event: TEvent): Promise<TResult>;
}

/**
 * Create a DI-enabled cloud function
 *
 * @param abstraction - The abstraction to resolve from the container
 * @param setup - Composition root where you register implementations using container.register()
 *
 * @example
 * ```ts
 * // 1. Create implementation
 * class ListUsersFunction implements ApiGatewayFunction.Interface {
 *   constructor(
 *     private userService: UserService.Interface,
 *     private logger: LoggerService.Interface
 *   ) {}
 *
 *   async execute(event: APIGatewayEvent): Promise<APIGatewayProxyResult> {
 *     this.logger.info("Listing users");
 *     const users = await this.userService.listUsers();
 *     return {
 *       statusCode: 200,
 *       body: JSON.stringify(users)
 *     };
 *   }
 * }
 *
 * // 2. Export implementation
 * export const listUsersFunction = createImplementation({
 *   abstraction: ApiGatewayFunction,
 *   implementation: ListUsersFunction,
 *   dependencies: [UserService, LoggerService]
 * });
 *
 * // 3. Register in composition root
 * export const handler = createFunction(
 *   ApiGatewayFunction,
 *   async (container) => {
 *     // Register services
 *     container.register(consoleLogger).inSingletonScope();
 *     container.register(dynamoDbUserService).inSingletonScope();
 *
 *     // Register the function implementation
 *     container.register(listUsersFunction).inSingletonScope();
 *   }
 * );
 * ```
 */
export function createFunction<TEvent = any, TResult = any>(
    abstraction: Abstraction<ICloudFunction<TEvent, TResult>>,
    setup: FunctionSetup
) {
    let container: Container | null = null;

    return async (event: TEvent): Promise<TResult> => {
        // Initialize on cold start
        if (!container) {
            container = new Container();

            // Run user setup - this is the composition root
            await setup(container);
        }

        // Resolve function instance from container
        const functionInstance = container.resolve(abstraction);

        // Execute the function
        return functionInstance.execute(event);
    };
}

