import * as fs from "fs";
import { getProject } from "@webiny/cli/utils";
import { getTelemetryFunctionDownloadPath } from "../../../bundling/function/utils";
import { downloadTelemetryFunction } from "../../../bundling/function/telemetry";
import { sleep } from "../../../testing/helpers/sleep";

// This environment API key has been previously created via a test WCP account created at https://app.webiny.com. Consult internal documentation for more information on the used account.
const VALID_API_KEY = "8c8d2096-934e-47b0-ab02-25feace28d48";

interface TelemetryDataLogs {
    error: boolean;
    executionDuration: number;
    functionName: string;
    createdOn: number;
}
interface TelemetryData {
    apiKey: string;
    version: string;
    logs: TelemetryDataLogs[];
}

interface TelemetryDataResult {
    message?: string;
    error?: {
        message: string;
    };
}
let postTelemetryData: (data: TelemetryData) => Promise<TelemetryDataResult>;
let localData: TelemetryData;
let handler: () => Promise<any>;

const handlerPath = getProject().root + "/.webiny/_handler.js";

beforeAll(async () => {
    // Make sure the latest Telemetry code is in the local storage
    await downloadTelemetryFunction();
});

beforeEach(() => {
    // The telemetry function is being injected into the folder where the clients handler function is, so it
    // expects there to be a _hander.js file to be in the folder it is placed in, so lets mock a _handler.js
    // file in this test folder so it wont throw an error it is not important what is in the file so lets put in an
    // empty string
    fs.writeFileSync(handlerPath, "");

    // Now we can export the telemetry functions
    const telemetry = require(getTelemetryFunctionDownloadPath());
    postTelemetryData = telemetry.postTelemetryData;
    localData = telemetry.localData;
    handler = telemetry.handler;
});

afterEach(() => {
    // After the tests run we destroy the mocked _handler.js function
    fs.unlinkSync(handlerPath);
});

describe("Telemetry functions", () => {
    describe("postTelemetryData()", () => {
        test("Can post telemetry data", async () => {
            const now = Date.now();
            const mockSchema: TelemetryData = {
                apiKey: VALID_API_KEY,
                version: "5.20.0",
                logs: [
                    {
                        error: false,
                        executionDuration: 200,
                        functionName: "testtest",
                        createdOn: now
                    }
                ]
            };

            const result = await postTelemetryData(mockSchema);

            expect(result).toEqual({ message: "Success" });
        });

        test("Fails with an invalid api key", async () => {
            const now = Date.now();
            const invalidApiKey = "I AM NOT VALID AS AN API KEY";
            const mockSchema = {
                apiKey: invalidApiKey,
                version: "5.20.0",
                logs: [
                    {
                        error: false,
                        executionDuration: 200,
                        functionName: "testtest",
                        createdOn: now
                    }
                ]
            };

            const result = await postTelemetryData(mockSchema);

            const { message } = result.error || {};
            expect(message).toEqual("Internal Server Error");
        });
    });

    describe("handler()", () => {
        test("Posts telemetry if there are 1000 logs", async () => {
            const thousandHandlerFunctions = Array.from({ length: 1000 }).map(() => handler());

            await Promise.all(thousandHandlerFunctions);

            expect(localData.logs.length).toEqual(0);
        });

        test("Posts telemetry if it has been more than 5 minutes since data was sent", async () => {
            const thousandHandlerFunctions = Array.from({ length: 5 }).map(() => handler());

            // Load 5 logs into the telemetry data
            await Promise.all(thousandHandlerFunctions);

            expect(localData.logs.length).toEqual(5);

            const minutesToFireRequest = 5;
            const timeInFiveMinutes = Date.now() + minutesToFireRequest * 60000;

            // Set time forward 5 minutes
            Date.now = jest.fn(() => timeInFiveMinutes);

            // Wait a second to let the function fire if 5 minutes have passed
            await sleep(2000);

            // The timer should have fired and clears the logs
            expect(localData.logs.length).toEqual(0);

            jest.clearAllMocks();
        });
    });
});
