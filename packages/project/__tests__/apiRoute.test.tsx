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

function createProject() {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "wby-api-route-"));
    tempDirs.push(root);

    const apiSrc = path.join(root, "workspace", "apps", "api", "graphql", "src");
    fs.mkdirSync(apiSrc, { recursive: true });
    fs.writeFileSync(path.join(apiSrc, "extensions.ts"), EXTENSIONS_TS);

    const folder = (base: string) => ({
        join: (...parts: string[]) => folder(path.join(base, ...parts)),
        toString: () => base
    });
    const project = {
        paths: {
            rootFolder: folder(root),
            workspaceFolder: folder(path.join(root, "workspace"))
        }
    };
    const extensions = () => fs.readFileSync(path.join(apiSrc, "extensions.ts"), "utf8");
    return { project, extensions };
}

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

        expect(() =>
            callComponent(ApiRoute, { method: "GET", path: "/test-route", src: "/x.ts" })
        ).not.toThrow();
    });

    it("registers the handler and an HttpRouteDefinition in extensions.ts, once", async () => {
        const { project, extensions } = createProject();
        const build = ApiRoute.def.build!;
        const ctx = { project } as unknown as Parameters<typeof build>[1];
        const params = { method: "GET", path: "/orders/{orderId}", src: "/extensions/Orders.ts" };

        await build(params as Parameters<typeof build>[0], ctx);
        await build(params as Parameters<typeof build>[0], ctx);

        const source = extensions();
        expect(source).toContain(`from "../../../../../extensions/Orders.js"`);
        expect(source).toContain(`name: "orders-get"`);
        expect(source).toContain(`method: "GET"`);
        expect(source).toContain(`path: "/orders/:orderId"`);
        expect(source.match(/createHttpRouteDefinition\(\{/g)).toHaveLength(1);
    });
});
