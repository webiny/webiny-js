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
 * @param setup - Composition root where you register services and implementations
 * @param options - Optional configuration
 *
 * @example
 * ```ts
 * // Create a function implementation
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
 * // Register in the composition root
 * export const handler = createFunction(
 *   ApiGatewayFunction,
 *   async (container) => {
 *     // Register services
 *     container.bind(LoggerService).toSelf();
 *     container.bind(UserService).toSelf();
 *
 *     // Register the function implementation
 *     container.bind(ApiGatewayFunction).to(ListUsersFunction);
 *   }
 * );
 * ```
 */
export function createFunction<TEvent = any, TResult = any>(
    abstraction: Abstraction<ICloudFunction<TEvent, TResult>>,
    setup: FunctionSetup,
    _options?: CreateFunctionOptions
) {
    let container: Container | null = null;

    return async (event: TEvent, _lambdaContext: any): Promise<TResult> => {
        // Initialize on cold start
        if (!container) {
            container = new Container();

            // Run user setup - this is the composition root
            await setup(container);
        }

        // Resolve function instance from container
        const functionInstance = container.get(abstraction);

        // Execute the function
        return functionInstance.execute(event);
    };
}

