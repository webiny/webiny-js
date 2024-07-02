import { WebsocketsTransport } from "~/transport/WebsocketsTransport";
import { GenericRecord } from "@webiny/api/types";

jest.mock("@webiny/aws-sdk/client-apigatewaymanagementapi", () => {
    return {
        ApiGatewayManagementApiClient: class ApiGatewayManagementApiClient {
            async send(cmd: any) {
                const name = cmd.constructor.name;

                if (name === "PostToConnectionCommand") {
                    throw new Error("Some error occurred while sending message.");
                } else if (name === "DeleteConnectionCommand") {
                    throw new Error("Some error occurred while disconnecting.");
                }

                throw new Error("This error should not happen.");
            }
        },
        PostToConnectionCommand: class PostToConnectionCommand {
            public readonly input: any;

            constructor(input: any) {
                this.input = input;
            }
        },
        DeleteConnectionCommand: class DeleteConnectionCommand {
            public readonly input: any;

            constructor(input: any) {
                this.input = input;
            }
        }
    };
});

interface ConsoleLogs {
    error: string[];
    log: GenericRecord[];
}

describe("WebsocketsTransport", () => {
    it("should log an error when trying to send a message", async () => {
        const consoleLogs: ConsoleLogs = {
            error: [],
            log: []
        };

        const transport = new WebsocketsTransport();

        jest.spyOn(console, "error").mockImplementation((error: string) => {
            consoleLogs.error.push(error);
        });
        jest.spyOn(console, "log").mockImplementation((log: GenericRecord) => {
            consoleLogs.log.push(log);
        });

        await transport.send(
            [
                {
                    connectionId: "123",
                    domainName: "domain",
                    stage: "stage"
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
        const consoleLogs: ConsoleLogs = {
            error: [],
            log: []
        };

        const transport = new WebsocketsTransport();

        jest.spyOn(console, "error").mockImplementation((error: string) => {
            consoleLogs.error.push(error);
        });
        jest.spyOn(console, "log").mockImplementation((log: GenericRecord) => {
            consoleLogs.log.push(log);
        });

        await transport.disconnect([
            {
                connectionId: "123",
                domainName: "domain",
                stage: "stage"
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
