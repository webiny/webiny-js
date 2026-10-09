import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "~/features/eventPublisher/index.js";
import type { IEventHandler } from "~/features/eventPublisher/index.js";
import type { AiGenerateTextParams, AiStreamTextParams } from "./abstractions.js";
import type { generateText } from "ai";

// ============================================================================
// BeforeGenerateText
// ============================================================================

export interface AiBeforeGenerateTextPayload {
    requestId: string;
    params: AiGenerateTextParams;
}

export class AiBeforeGenerateTextEvent extends DomainEvent<AiBeforeGenerateTextPayload> {
    eventType = "ai.beforeGenerateText" as const;

    getHandlerAbstraction() {
        return AiBeforeGenerateTextEventHandler;
    }
}

export const AiBeforeGenerateTextEventHandler = createAbstraction<
    IEventHandler<AiBeforeGenerateTextEvent>
>("AiBeforeGenerateTextEventHandler");

export namespace AiBeforeGenerateTextEventHandler {
    export type Interface = IEventHandler<AiBeforeGenerateTextEvent>;
    export type Event = AiBeforeGenerateTextEvent;
}

// ============================================================================
// AfterGenerateText
// ============================================================================

export interface AiAfterGenerateTextPayload {
    requestId: string;
    params: AiGenerateTextParams;
    result: Awaited<ReturnType<typeof generateText>>;
    duration: number;
}

export class AiAfterGenerateTextEvent extends DomainEvent<AiAfterGenerateTextPayload> {
    eventType = "ai.afterGenerateText" as const;

    getHandlerAbstraction() {
        return AiAfterGenerateTextEventHandler;
    }
}

export const AiAfterGenerateTextEventHandler = createAbstraction<
    IEventHandler<AiAfterGenerateTextEvent>
>("AiAfterGenerateTextEventHandler");

export namespace AiAfterGenerateTextEventHandler {
    export type Interface = IEventHandler<AiAfterGenerateTextEvent>;
    export type Event = AiAfterGenerateTextEvent;
}

// ============================================================================
// GenerateTextError
// ============================================================================

export interface AiGenerateTextErrorPayload {
    requestId: string;
    params: AiGenerateTextParams;
    error: Error;
    duration: number;
}

export class AiGenerateTextErrorEvent extends DomainEvent<AiGenerateTextErrorPayload> {
    eventType = "ai.generateTextError" as const;

    getHandlerAbstraction() {
        return AiGenerateTextErrorEventHandler;
    }
}

export const AiGenerateTextErrorEventHandler = createAbstraction<
    IEventHandler<AiGenerateTextErrorEvent>
>("AiGenerateTextErrorEventHandler");

export namespace AiGenerateTextErrorEventHandler {
    export type Interface = IEventHandler<AiGenerateTextErrorEvent>;
    export type Event = AiGenerateTextErrorEvent;
}

// ============================================================================
// BeforeStreamText
// ============================================================================

export interface AiBeforeStreamTextPayload {
    params: AiStreamTextParams;
}

export class AiBeforeStreamTextEvent extends DomainEvent<AiBeforeStreamTextPayload> {
    eventType = "ai.beforeStreamText" as const;

    getHandlerAbstraction() {
        return AiBeforeStreamTextEventHandler;
    }
}

export const AiBeforeStreamTextEventHandler = createAbstraction<
    IEventHandler<AiBeforeStreamTextEvent>
>("AiBeforeStreamTextEventHandler");

export namespace AiBeforeStreamTextEventHandler {
    export type Interface = IEventHandler<AiBeforeStreamTextEvent>;
    export type Event = AiBeforeStreamTextEvent;
}

// ============================================================================
// AfterStreamText
// ============================================================================

/**
 * A stream that finished. Published once its last chunk has arrived, with the whole call's usage —
 * the counterpart of `AiAfterGenerateTextEvent`, so a consumer recording usage sees streamed calls too.
 */
export interface AiAfterStreamTextPayload {
    requestId: string;
    params: AiStreamTextParams;
    usage: unknown;
    finishReason: string;
    duration: number;
}

export class AiAfterStreamTextEvent extends DomainEvent<AiAfterStreamTextPayload> {
    eventType = "ai.afterStreamText" as const;

    getHandlerAbstraction() {
        return AiAfterStreamTextEventHandler;
    }
}

export const AiAfterStreamTextEventHandler = createAbstraction<
    IEventHandler<AiAfterStreamTextEvent>
>("AiAfterStreamTextEventHandler");

export namespace AiAfterStreamTextEventHandler {
    export type Interface = IEventHandler<AiAfterStreamTextEvent>;
    export type Event = AiAfterStreamTextEvent;
}

// ============================================================================
// StreamTextError
// ============================================================================

/** A stream that failed or was aborted. The provider reports no usage for either. */
export interface AiStreamTextErrorPayload {
    requestId: string;
    params: AiStreamTextParams;
    error: Error;
    duration: number;
}

export class AiStreamTextErrorEvent extends DomainEvent<AiStreamTextErrorPayload> {
    eventType = "ai.streamTextError" as const;

    getHandlerAbstraction() {
        return AiStreamTextErrorEventHandler;
    }
}

export const AiStreamTextErrorEventHandler = createAbstraction<
    IEventHandler<AiStreamTextErrorEvent>
>("AiStreamTextErrorEventHandler");

export namespace AiStreamTextErrorEventHandler {
    export type Interface = IEventHandler<AiStreamTextErrorEvent>;
    export type Event = AiStreamTextErrorEvent;
}
