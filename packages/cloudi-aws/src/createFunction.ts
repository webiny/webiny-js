import { Container } from "@webiny/di";
import type { FunctionSetup, CreateFunctionOptions } from "./types.js";

/**
 * Base class for all cloud function abstractions
 */
export abstract class CloudFunction<TEvent = any, TResult = any, TContext = any> {
    protected container: Container;
    protected context?: TContext;

    constructor(container: Container) {
        this.container = container;
    }

    /**
     * Initialize the function context (called once per cold start)
     */
    protected async initialize(): Promise<void> {
        // Override in subclasses if needed
    }

    /**
     * Execute the function logic
     */
    abstract execute(event: TEvent): Promise<TResult>;

    /**
     * Handle the incoming event
     */
    async handle(event: TEvent): Promise<TResult> {
        if (!this.context) {
            await this.initialize();
        }
        return this.execute(event);
    }
}

/**
 * Create a DI-enabled cloud function
 */
export function createFunction<TEvent = any, TResult = any>(
    FunctionClass: new (container: Container) => CloudFunction<TEvent, TResult>,
    setup?: FunctionSetup,
    options?: CreateFunctionOptions
) {
    let functionInstance: CloudFunction<TEvent, TResult> | null = null;

    return async (event: TEvent, lambdaContext: any): Promise<TResult> => {
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

