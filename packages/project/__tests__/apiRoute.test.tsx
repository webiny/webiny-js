import fs from "fs";
import os from "os";
import path from "path";
import React from "react";
import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { ApiRoute } from "~/extensions/api/index.js";
import { definitions } from "~/extensions/index.js";

const EXTENSIONS_TS = `export const extensions = [];
`;

const tempDirs: string[] = [];
const originalHostingType = process.env.WEBINY_HOSTING_TYPE;

afterEach(() => {
    for (const dir of tempDirs.splice(0)) {
        fs.rmSync(dir, { recursive: true, force: true });
    }

    if (originalHostingType === undefined) {
        delete process.env.WEBINY_HOSTING_TYPE;
    } else {
        process.env.WEBINY_HOSTING_TYPE = originalHostingType;
    }
});

type BuildParams = Parameters<NonNullable<typeof ApiRoute.def.build>>[0];
type BuildContext = Parameters<NonNullable<typeof ApiRoute.def.build>>[1];

const folder = (base: string) => ({
    join: (...parts: string[]) => {
        const joined = path.join(base, ...parts);
        return folder(joined);
    },
    toString: () => base
});

function createProject(extensionsTs = EXTENSIONS_TS) {
    const tmpPrefix = path.join(os.tmpdir(), "wby-api-route-");
    const root = fs.mkdtempSync(tmpPrefix);
    tempDirs.push(root);

    const workspace = path.join(root, "workspace");
    const apiSrc = path.join(workspace, "apps", "api", "graphql", "src");
    const extensionsTsPath = path.join(apiSrc, "extensions.ts");
    fs.mkdirSync(apiSrc, { recursive: true });
    fs.writeFileSync(extensionsTsPath, extensionsTs);

    const project = {
        paths: {
            rootFolder: folder(root),
            workspaceFolder: folder(workspace)
        }
    };
    const ctx = { project } as unknown as BuildContext;
    const build = (params: Record<string, string>) => {
        return ApiRoute.def.build!(params as BuildParams, ctx);
    };
    const extensions = () => fs.readFileSync(extensionsTsPath, "utf8");
    return { build, extensions };
}

const countMatches = (source: string, pattern: RegExp) => {
    const matches = source.match(pattern) ?? [];
    return matches.length;
};

/*
 * Calls the component as a function: the hosting check runs before anything is rendered.
 */
const callComponent = (Component: React.ComponentType<any>, props: Record<string, unknown>) => {
    const render = Component as unknown as (props: Record<string, unknown>) => React.ReactElement;
    return render(props);
};

describe("Api.Route", () => {
    it("is a built-in definition for every hosting type, so a standalone build finds it", () => {
        const definition = definitions.find(def => def.type === "Api/Route");

        expect(definition?.tags).toMatchObject({ appName: "api", hosting: "all" });
        expect(definition?.build).toBeTypeOf("function");
    });

    it("renders in a standalone project", () => {
        process.env.WEBINY_HOSTING_TYPE = "standalone";
        const props = { method: "GET", path: "/test-route", src: "/x.ts" };

        expect(() => callComponent(ApiRoute, props)).not.toThrow();
    });

    it("registers the handler and an HttpRouteDefinition in extensions.ts, once", async () => {
        const { build, extensions } = createProject();
        const params = { method: "GET", path: "/orders/{orderId}", src: "/extensions/Orders.ts" };

        await build(params);
        await build(params);

        const source = extensions();
        expect(source).toContain(`from "../../../../../extensions/Orders.js"`);
        expect(source).toContain(`name: "orders-get"`);
        expect(source).toContain(`method: "GET"`);
        expect(source).toContain(`path: "/orders/:orderId"`);
        const definitionCount = countMatches(source, /createHttpRouteDefinition\(\{/g);
        expect(definitionCount).toBe(1);
    });

    it("registers every route that shares a handler file, importing the handler once", async () => {
        const { build, extensions } = createProject();
        const src = "/extensions/Orders.ts";

        await build({ method: "GET", path: "/orders/:orderId", src });
        await build({ method: "DELETE", path: "/orders/:orderId", src });

        const source = extensions();
        expect(source).toContain(`name: "orders-get"`);
        expect(source).toContain(`name: "orders-delete"`);
        const importCount = countMatches(source, /extensions\/Orders\.js"/g);
        expect(importCount).toBe(1);
    });

    it("stops the build when two routes resolve to the same name", async () => {
        const { build } = createProject();
        const src = "/extensions/Orders.ts";

        await build({ method: "GET", path: "/orders", src });
        const second = build({ method: "GET", path: "/orders/:orderId", src });

        await expect(second).rejects.toThrow(`resolve to the route name "orders-get"`);
    });

    it("adds createHttpRouteDefinition to an existing @webiny/event-handler-core import", async () => {
        const extensionsTs = `import { HttpRouteHandler } from "@webiny/event-handler-core";\n${EXTENSIONS_TS}`;
        const { build, extensions } = createProject(extensionsTs);

        await build({ method: "GET", path: "/orders", src: "/extensions/Orders.ts" });

        expect(extensions()).toContain(
            `import { HttpRouteHandler, createHttpRouteDefinition } from "@webiny/event-handler-core";`
        );
    });

    it("escapes values written into extensions.ts", async () => {
        const { build, extensions } = createProject();

        await build({
            method: "GET",
            path: "/orders",
            src: "/extensions/Orders.ts",
            routeName: `say "hi"`
        });

        expect(extensions()).toContain(`name: "say \\"hi\\""`);
    });
});
