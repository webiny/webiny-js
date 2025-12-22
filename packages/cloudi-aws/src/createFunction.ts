import { Container } from "@webiny/di";
import type { FunctionSetup } from "./types.js";
import {
    ApiGatewayEventQualifier,
    SnsEventQualifier,
    SqsEventQualifier,
    S3EventQualifier,
    EventBridgeEventQualifier,
    DynamoDBEventQualifier
} from "./abstractions/index.js";
import {
    ApiGatewayEventHandler,
    SnsEventHandler,
    SqsEventHandler,
    S3EventHandler,
    EventBridgeEventHandler,
    DynamoDBEventHandler
} from "./abstractions/index.js";
import {
    apiGatewayEventQualifier,
    snsEventQualifier,
    sqsEventQualifier,
    s3EventQualifier,
    eventBridgeEventQualifier,
    dynamoDBEventQualifier
} from "./features/index.js";

/**
 * Event type to handler abstraction mapping
 */
const EVENT_TYPE_MAPPINGS = [
    {
        qualifier: ApiGatewayEventQualifier,
        handler: ApiGatewayEventHandler
    },
    {
        qualifier: SnsEventQualifier,
        handler: SnsEventHandler
    },
    {
        qualifier: SqsEventQualifier,
        handler: SqsEventHandler
    },
    {
        qualifier: S3EventQualifier,
        handler: S3EventHandler
    },
    {
        qualifier: EventBridgeEventQualifier,
        handler: EventBridgeEventHandler
    },
    {
        qualifier: DynamoDBEventQualifier,
        handler: DynamoDBEventHandler
    }
];

export function createFunction(setup: FunctionSetup) {
    let container: Container | null = null;

    return async (event: any): Promise<any> => {
        // Initialize on cold start
        if (!container) {
            container = new Container();

            // Register all built-in qualifiers
            container.register(apiGatewayEventQualifier).inSingletonScope();
            container.register(snsEventQualifier).inSingletonScope();
            container.register(sqsEventQualifier).inSingletonScope();
            container.register(s3EventQualifier).inSingletonScope();
            container.register(eventBridgeEventQualifier).inSingletonScope();
            container.register(dynamoDBEventQualifier).inSingletonScope();

            // Run user setup - this is the composition root
            await setup(container);
        }

        // Run event through qualifiers to determine event type
        for (const mapping of EVENT_TYPE_MAPPINGS) {
            const qualifier = container.resolve(mapping.qualifier);

            if (qualifier.execute(event)) {
                // Get all handlers for this event type
                const handlers = container.resolveAll(mapping.handler);

                if (handlers.length === 0) {
                    throw new Error(
                        `Event qualified as ${mapping.handler.name} but no handlers registered`
                    );
                }

                // Execute all handlers for this event type
                const results = await Promise.all(
                    handlers.map(handler => handler.execute(event))
                );

                // Return the first result (or combine them if multiple handlers)
                return results[0];
            }
        }

        // No qualifier matched
        throw new Error(
            `No event qualifier matched this event. Event keys: ${JSON.stringify(Object.keys(event).slice(0, 5))}`
        );
    };
}

