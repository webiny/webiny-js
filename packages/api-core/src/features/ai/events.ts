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
