import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockClient } from "aws-sdk-client-mock";
import {
    ApiGatewayManagementApiClient,
    PostToConnectionCommand,
    DeleteConnectionCommand
} from "@webiny/aws-sdk/client-apigatewaymanagementapi/index.js";
import type { GenericRecord } from "@webiny/api/types";
import { AwsWebsocketsTransport } from "~/transport/AwsWebsocketsTransport.js";

const apiGwMock = mockClient(ApiGatewayManagementApiClient);

interface ConsoleLogs {
    error: string[];
    log: GenericRecord[];
}

describe("AwsWebsocketsTransport", () => {
    beforeEach(() => {
        apiGwMock.reset();
    });

    it("should log an error when trying to send a message", async () => {
        apiGwMock
            .on(PostToConnectionCommand)
            .rejects(new Error("Some error occurred while sending message."));

        const consoleLogs: ConsoleLogs = {
            error: [],
            log: []
        };

        const transport = new AwsWebsocketsTransport();

        vi.spyOn(console, "error").mockImplementation((error: string) => {
            consoleLogs.error.push(error);
        });
        vi.spyOn(console, "log").mockImplementation((log: GenericRecord) => {
            consoleLogs.log.push(log);
        });

        await transport.send(
            [
                {
                    connectionId: "123",
                    endpoint: "https://domain/stage"
                }
            ],
            {}
        );

        expect(consoleLogs.error).toHaveLength(1);
        expect(consoleLogs.log).toHaveLength(1);
        expect(consoleLogs.error).toEqual([
            `Failed to send message to connection "123". Check logs for more information.`
        ]);
        expect(consoleLogs.log[0].message).toEqual("Some error occurred while sending message.");
        expect(consoleLogs.log[0].stack).toBeDefined();
    });

    it("should log an error when trying to disconnect a connection", async () => {
        apiGwMock
            .on(DeleteConnectionCommand)
            .rejects(new Error("Some error occurred while disconnecting."));

        const consoleLogs: ConsoleLogs = {
            error: [],
            log: []
        };

        const transport = new AwsWebsocketsTransport();

        vi.spyOn(console, "error").mockImplementation((error: string) => {
            consoleLogs.error.push(error);
        });
        vi.spyOn(console, "log").mockImplementation((log: GenericRecord) => {
            consoleLogs.log.push(log);
        });

        await transport.disconnect([
            {
                connectionId: "123",
                endpoint: "https://domain/stage"
            }
        ]);

        expect(consoleLogs.error).toHaveLength(1);
        expect(consoleLogs.log).toHaveLength(1);
        expect(consoleLogs.error).toEqual([
            `Failed to disconnect connection "123". Check logs for more information.`
        ]);
        expect(consoleLogs.log[0].message).toEqual("Some error occurred while disconnecting.");
        expect(consoleLogs.log[0].stack).toBeDefined();
    });
});
