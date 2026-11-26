import { describe, it, expect } from "vitest";
import { Container } from "@webiny/di";
import { InputType } from "@webiny/api-kernel-core";
import {
    ApiGatewayInputType,
    S3InputType,
    SqsInputType,
    SnsInputType,
    EventBridgeInputType,
    DynamoDBInputType
} from "~/inputTypes/index.js";

function resolveInputTypes(...impls: any[]) {
    const container = new Container();
    for (const impl of impls) {
        container.register(impl);
    }
    return container.resolveAll(InputType);
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

describe("InputType detection", () => {
    it("ApiGatewayInputType detects API GW events", () => {
        const [et] = resolveInputTypes(ApiGatewayInputType);
        expect(et.matches(apiGwEvent)).toBe(true);
        expect(et.matches(fnUrlEvent)).toBe(false);
        expect(et.matches(s3Event)).toBe(false);
    });

    it("S3InputType detects S3 events", () => {
        const [et] = resolveInputTypes(S3InputType);
        expect(et.matches(s3Event)).toBe(true);
        expect(et.matches(sqsEvent)).toBe(false);
        expect(et.matches(apiGwEvent)).toBe(false);
    });

    it("SqsInputType detects SQS events", () => {
        const [et] = resolveInputTypes(SqsInputType);
        expect(et.matches(sqsEvent)).toBe(true);
        expect(et.matches(s3Event)).toBe(false);
    });

    it("SnsInputType detects SNS events", () => {
        const [et] = resolveInputTypes(SnsInputType);
        expect(et.matches(snsEvent)).toBe(true);
        expect(et.matches(sqsEvent)).toBe(false);
    });

    it("EventBridgeInputType detects EventBridge events", () => {
        const [et] = resolveInputTypes(EventBridgeInputType);
        expect(et.matches(ebEvent)).toBe(true);
        expect(et.matches(s3Event)).toBe(false);
    });

    it("DynamoDBInputType detects DynamoDB stream events", () => {
        const [et] = resolveInputTypes(DynamoDBInputType);
        expect(et.matches(dynamoEvent)).toBe(true);
        expect(et.matches(s3Event)).toBe(false);
    });

    it("each event type returns the correct handler abstraction", async () => {
        const { ApiGatewayInputHandler } =
            await import("~/abstractions/handlers/ApiGatewayInputHandler.js");
        const { S3InputHandler } = await import("~/abstractions/handlers/S3InputHandler.js");
        const { SqsInputHandler } = await import("~/abstractions/handlers/SqsInputHandler.js");

        const [agw] = resolveInputTypes(ApiGatewayInputType);
        const [s3] = resolveInputTypes(S3InputType);
        const [sqs] = resolveInputTypes(SqsInputType);

        expect(agw.getHandlerAbstraction()).toBe(ApiGatewayInputHandler);
        expect(s3.getHandlerAbstraction()).toBe(S3InputHandler);
        expect(sqs.getHandlerAbstraction()).toBe(SqsInputHandler);
    });
});
