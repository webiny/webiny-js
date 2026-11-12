import React from "react";
import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { ApiRoute as SharedApiRoute } from "@webiny/project/extensions/api/index.js";
import { ApiRoute } from "~/extensions/ApiRoute.js";
import "~/extensions/registerExtensionImplementations.js";

const originalHostingType = process.env.WEBINY_HOSTING_TYPE;

afterEach(() => {
    if (originalHostingType === undefined) {
        delete process.env.WEBINY_HOSTING_TYPE;
    } else {
        process.env.WEBINY_HOSTING_TYPE = originalHostingType;
    }
});

/*
 * Calls the component as a function: the implementation lookup runs before anything is rendered,
 * so the returned element shows which component would render.
 */
const callComponent = (Component: React.ComponentType<any>, props: Record<string, unknown>) => {
    const render = Component as unknown as (props: Record<string, unknown>) => React.ReactElement;
    return render(props);
};

describe("Api.Route on AWS", () => {
    const props = { method: "GET", path: "/test-route", src: "/extensions/TestRoute.ts" };

    it("renders the AWS implementation, which adds the API Gateway route", () => {
        process.env.WEBINY_HOSTING_TYPE = "aws";

        expect(callComponent(SharedApiRoute, props).type).toBe(ApiRoute);
    });

    it("writes extensions.ts with the same build as every other hosting type", () => {
        expect(ApiRoute.def.type).toBe(SharedApiRoute.def.type);
        expect(ApiRoute.def.build).toBe(SharedApiRoute.def.build);
        expect(ApiRoute.def.paramsSchema).toBe(SharedApiRoute.def.paramsSchema);
    });
});
