import React from "react";
import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { definitions as projectDefinitions } from "@webiny/project/extensions/index.js";
import { ApiRoute as SharedApiRoute } from "@webiny/project/extensions/api/index.js";
import awsDefinitions from "~/extensions/definitions.js";
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

        const element = callComponent(SharedApiRoute, props);
        expect(element.type).toBe(ApiRoute);
    });

    /*
     * The project config resolves an extension type to the first registered definition with that
     * type. With one `Api/Route` definition, AWS validates and builds routes exactly like standalone.
     */
    it("resolves Api/Route to the shared definition, the only one registered", () => {
        const allDefinitions = [...projectDefinitions, ...awsDefinitions];
        const routeDefinitions = allDefinitions.filter(def => def.type === "Api/Route");

        expect(routeDefinitions).toEqual([SharedApiRoute.def]);
    });
});
