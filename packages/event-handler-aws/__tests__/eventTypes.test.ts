import { describe, it, expect } from "vitest";
import { Container } from "@webiny/di";
import { EventType } from "@webiny/event-handler-core";
import {
    ApiGatewayEventType,
    FunctionUrlEventType,
    S3EventType,
    SqsEventType,
    SnsEventType,
    EventBridgeEventType,
    DynamoDBEventType
} from "~/eventTypes/index.js";

function resolveEventTypes(...impls: any[]) {
    const container = new Container();
    for (const impl of impls) {
        container.register(impl);
    }
    return container.resolveAll(EventType);
}

const apiGwEvent = {
    httpMethod: "GET",
    path: "/test",
    headers: {},
    requestContext: { requestId: "req-1" },
    body: null,
    isBase64Encoded: false
};

const fnUrlEvent = {
    rawPath: "/test",
    rawQueryString: "",
    headers: {},
    requestContext: {
        http: { method: "GET", path: "/test" },
        apiId: "abc123"
    },
    isBase64Encoded: false
};

const s3Event = {
    Records: [
        {
            eventSource: "aws:s3",
            s3: { bucket: { name: "acme-uploads" }, object: { key: "img.png" } }
        }
    ]
};

const sqsEvent = {
    Records: [{ eventSource: "aws:sqs", body: "{}" }]
};

const snsEvent = {
    Records: [{ EventSource: "aws:sns", Sns: { Message: "{}" } }]
};

const ebEvent = {
    source: "my.app",
    "detail-type": "OrderPlaced",
    detail: { orderId: "123" }
};

const dynamoEvent = {
    Records: [{ eventSource: "aws:dynamodb", dynamodb: {} }]
};

describe("EventType detection", () => {
    it("ApiGatewayEventType detects API GW events", () => {
        const [et] = resolveEventTypes(ApiGatewayEventType);
        expect(et.canHandle(apiGwEvent)).toBe(true);
        expect(et.canHandle(fnUrlEvent)).toBe(false);
        expect(et.canHandle(s3Event)).toBe(false);
    });

    it("FunctionUrlEventType detects Function URL events", () => {
        const [et] = resolveEventTypes(FunctionUrlEventType);
        expect(et.canHandle(fnUrlEvent)).toBe(true);
        expect(et.canHandle(apiGwEvent)).toBe(false);
        expect(et.canHandle(s3Event)).toBe(false);
    });

    it("S3EventType detects S3 events", () => {
        const [et] = resolveEventTypes(S3EventType);
        expect(et.canHandle(s3Event)).toBe(true);
        expect(et.canHandle(sqsEvent)).toBe(false);
        expect(et.canHandle(apiGwEvent)).toBe(false);
    });

    it("SqsEventType detects SQS events", () => {
        const [et] = resolveEventTypes(SqsEventType);
        expect(et.canHandle(sqsEvent)).toBe(true);
        expect(et.canHandle(s3Event)).toBe(false);
    });

    it("SnsEventType detects SNS events", () => {
        const [et] = resolveEventTypes(SnsEventType);
        expect(et.canHandle(snsEvent)).toBe(true);
        expect(et.canHandle(sqsEvent)).toBe(false);
    });

    it("EventBridgeEventType detects EventBridge events", () => {
        const [et] = resolveEventTypes(EventBridgeEventType);
        expect(et.canHandle(ebEvent)).toBe(true);
        expect(et.canHandle(s3Event)).toBe(false);
    });

    it("DynamoDBEventType detects DynamoDB stream events", () => {
        const [et] = resolveEventTypes(DynamoDBEventType);
        expect(et.canHandle(dynamoEvent)).toBe(true);
        expect(et.canHandle(s3Event)).toBe(false);
    });

    it("each event type returns the correct handler abstraction", async () => {
        const { HttpEventHandler } = await import("@webiny/event-handler-core");
        const { S3EventHandler } = await import("~/abstractions/handlers/S3EventHandler.js");
        const { SqsEventHandler } = await import("~/abstractions/handlers/SqsEventHandler.js");

        const [agw] = resolveEventTypes(ApiGatewayEventType);
        const [fn] = resolveEventTypes(FunctionUrlEventType);
        const [s3] = resolveEventTypes(S3EventType);
        const [sqs] = resolveEventTypes(SqsEventType);

        expect(agw.getHandlerAbstraction()).toBe(HttpEventHandler);
        expect(fn.getHandlerAbstraction()).toBe(HttpEventHandler);
        expect(s3.getHandlerAbstraction()).toBe(S3EventHandler);
        expect(sqs.getHandlerAbstraction()).toBe(SqsEventHandler);
    });
});
