import mockConsole from "jest-mock-console";
import { createHandler } from "@webiny/handler";
import apolloGatewayPlugins from "../src/index";
import { startService, startServiceWithError } from "./federatedService";
import event from "./event.mock";
const context = {};
const methods = ["log", "info", "warn"];

// TODO: this test is skipped due to problems with stubbing Lambda.invoke.
// Need to come up with an acceptable way of testing this. Existing libraries for mocking AWS are of no help :(
describe.skip("Apollo Gateway Handler", () => {
    process.env.AWS_REGION = "us-east-1";

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
            type: "handler-apollo-gateway-service",
            name: "handler-apollo-gateway-service-users",
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
        const { handler, event } = startService();

        const gatewayHandler = createHandler(apolloGatewayPlugins({ debug: true }), {
            type: "handler-apollo-gateway-service",
            name: "handler-apollo-gateway-service-users",
            service: {
                name: "users",
                function: "mockedFunction"
            }
        });

        const res = await gatewayHandler(event, context);

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

        restoreConsole();
    });
});
