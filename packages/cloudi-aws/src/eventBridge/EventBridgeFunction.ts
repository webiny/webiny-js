import type {
    EventBridgeEvent,
    Context as LambdaContext
} from "@webiny/aws-sdk/types/index.js";
import { CloudFunction } from "../createFunction.js";
import type { Container } from "@webiny/di";
import type { CreateFunctionOptions, FunctionSetup } from "../types.js";

export interface EventBridgeResult {
    success: boolean;
    message?: string;
}

/**
 * Abstract class for EventBridge Lambda functions with DI support
 */
export abstract class EventBridgeFunction<
    TDetailType extends string = string,
    TDetail = any
> extends CloudFunction<EventBridgeEvent<TDetailType, TDetail>, EventBridgeResult> {
    /**
     * Handle the EventBridge event
     */
    abstract execute(event: EventBridgeEvent<TDetailType, TDetail>): Promise<EventBridgeResult>;

    /**
     * Helper method to access event detail
     */
    protected getDetail(event: EventBridgeEvent<TDetailType, TDetail>): TDetail {
        return event.detail;
    }

    /**
     * Helper method to access event detail type
     */
    protected getDetailType(event: EventBridgeEvent<TDetailType, TDetail>): TDetailType {
        return event["detail-type"];
    }

    /**
     * Helper method to create a successful result
     */
    protected success(message?: string): EventBridgeResult {
        return { success: true, message };
    }

    /**
     * Helper method to create a failure result
     */
    protected failure(message: string): EventBridgeResult {
        return { success: false, message };
    }
}

/**
 * Factory function to create EventBridge handlers with DI
 */
export function createEventBridgeFunction<
    TDetailType extends string = string,
    TDetail = any,
    T extends EventBridgeFunction<TDetailType, TDetail> = EventBridgeFunction<
        TDetailType,
        TDetail
    >
>(
    FunctionClass: new (container: Container) => T,
    setup?: FunctionSetup,
    options?: CreateFunctionOptions
) {
    let functionInstance: T | null = null;

    return async (
        event: EventBridgeEvent<TDetailType, TDetail>,
        context: LambdaContext
    ): Promise<EventBridgeResult> => {
        // Initialize on cold start
        if (!functionInstance) {
            const container = new Container();

            // Run user setup
            if (setup) {
                await setup(container);
            }

            // Create function instance
            functionInstance = new FunctionClass(container);
        }

        // Handle the event
        return functionInstance.handle(event);
    };
}

export type { EventBridgeEvent };

