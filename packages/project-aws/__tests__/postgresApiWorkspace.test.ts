import path from "path";
import fs from "fs";
import os from "os";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Container } from "@webiny/di";
import {
    BuildAppWorkspaceService,
    GetApp,
    LoggerService
} from "@webiny/project/abstractions/index.js";
import { ReplaceApiLambdaFnHandlers } from "~/extensions/Postgres/ReplaceApiLambdaFnHandlers.js";

const DDB_ENTRY = `export const handler = createAwsDdbApiHandler({ extensions });`;

describe("the api workspace with <Infra.Postgres />", () => {
    let tmp: string;
    let container: Container;

    const workspaceOf = (appName: string) => path.join(tmp, appName);
    const entryOf = (appName: string) => path.join(workspaceOf(appName), "graphql/src/index.ts");

    beforeEach(() => {
        tmp = fs.mkdtempSync(path.join(os.tmpdir(), "pg-workspace-"));
        container = new Container();

        // The workspace the base service (and project-aws's own decorator) leaves: the DynamoDB entry.
        container.registerInstance(BuildAppWorkspaceService, {
            async execute(appName) {
                fs.mkdirSync(path.dirname(entryOf(appName)), { recursive: true });
                fs.writeFileSync(entryOf(appName), DDB_ENTRY);
            }
        });
        container.registerInstance(GetApp, {
            execute: (appName: string) =>
                ({
                    paths: { workspaceFolder: { toString: () => workspaceOf(appName) } }
                }) as unknown as ReturnType<GetApp.Interface["execute"]>
        } as GetApp.Interface);
        container.registerInstance(LoggerService, {
            debug: () => {}
        } as unknown as LoggerService.Interface);
        container.registerDecorator(ReplaceApiLambdaFnHandlers);
    });

    afterEach(() => {
        fs.rmSync(tmp, { recursive: true, force: true });
    });

    it("exports both handlers from @webiny/api-event-handler-aws-pg in the api entry", async () => {
        await container.resolve(BuildAppWorkspaceService).execute("api");

        const entry = fs.readFileSync(entryOf("api"), "utf8");
        expect(entry).toContain(`from "@webiny/api-event-handler-aws-pg"`);
        expect(entry).toContain("export const handler = createAwsPgApiHandler({ extensions });");
        expect(entry).toContain(
            "export const streamHandler = createAwsPgStreamApiHandler({ extensions });"
        );
    });

    it("leaves every other app's workspace alone", async () => {
        await container.resolve(BuildAppWorkspaceService).execute("core");
        await container.resolve(BuildAppWorkspaceService).execute("admin");

        expect(fs.readFileSync(entryOf("core"), "utf8")).toBe(DDB_ENTRY);
        expect(fs.readFileSync(entryOf("admin"), "utf8")).toBe(DDB_ENTRY);
    });
});
