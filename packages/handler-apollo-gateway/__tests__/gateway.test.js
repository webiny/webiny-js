import mockConsole from "jest-mock-console";
import { createHandler } from "@webiny/http-handler";
import apolloGatewayPlugins from "../src/index";
import { startService, startServiceWithError } from "./federatedService";
import event from "./event.mock";
const context = {};
const methods = ["log", "info", "warn"];

describe("Apollo Gateway Handler", () => {
    test("should throw (process.env.DEBUG=false)", async () => {
        const handler = createHandler(apolloGatewayPlugins({ debug: true }));
        expect(handler(event, context)).rejects.toThrow();
    });

    test("should return error response (process.env.DEBUG=true)", async () => {
        const debug = process.env.DEBUG;
        process.env.DEBUG = "true";
        const handler = createHandler(apolloGatewayPlugins({ debug: true }));

        const res = await handler(event, context);
        expect(res.statusCode).toBe(500);
        process.env.DEBUG = debug;
    });

    // TODO: setup proper error formatting in child service
    test("should return error from child service", async () => {
        const debug = process.env.DEBUG;
        process.env.DEBUG = "true";
        const restoreConsole = mockConsole(methods);
        const { url, stop, event } = await startServiceWithError();

        const handler = createHandler(apolloGatewayPlugins({ debug: true }), {
            type: "http-handler-apollo-gateway-service",
            name: "http-handler-apollo-gateway-service-users",
            service: { name: "users", url }
        });

        const res = await handler(event, context);
        expect(res.statusCode).toBe(500);
        process.env.DEBUG = debug;
        restoreConsole();
        await stop();
    });

    test("should setup federated schema and return response", async () => {
        const restoreConsole = mockConsole(methods);
        const { url, stop, event } = await startService();

        const handler = createHandler(apolloGatewayPlugins({ debug: true }), {
            type: "http-handler-apollo-gateway-service",
            name: "http-handler-apollo-gateway-service-users",
            service: { name: "users", url }
        });

        const res = await handler(event, context);

        expect(res.statusCode).toBe(200);
        expect(JSON.parse(res.body)).toMatchObject({
            data: {
                users: [
                    {
                        id: "1",
                        name: "Ada Lovelace"
                    },
                    {
                        id: "2",
                        name: "Alan Turing"
                    }
                ]
            }
        });

        await stop();
        restoreConsole();
    });
});
