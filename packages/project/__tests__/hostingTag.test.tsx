import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { z } from "zod";
import { defineExtension } from "~/defineExtension/index.js";
import { type HostingType, registerExtensionImplementation } from "~/extensions/hosting/index.js";
import { EnvIsProd } from "~/extensions/infra/Env.js";

const createExtension = (type: string, hosting?: HostingType) => {
    return defineExtension({
        type,
        tags: { runtimeContext: "project", hosting },
        paramsSchema: z.object({ enabled: z.boolean() })
    });
};

// Calls the component as a function: the hosting check and the implementation lookup both run
// before anything is rendered, so the returned element shows which component would render.
const callComponent = (Component: React.ComponentType<any>, props: Record<string, unknown>) => {
    return (Component as unknown as (props: Record<string, unknown>) => React.ReactElement)(props);
};

describe("hosting tag", () => {
    const originalHostingType = process.env.WEBINY_HOSTING_TYPE;

    afterEach(() => {
        if (originalHostingType === undefined) {
            delete process.env.WEBINY_HOSTING_TYPE;
        } else {
            process.env.WEBINY_HOSTING_TYPE = originalHostingType;
        }
    });

    it("throws when rendered in a project of another hosting type", () => {
        process.env.WEBINY_HOSTING_TYPE = "standalone";
        const Vpc = createExtension("Test/Vpc", "aws");

        expect(() => callComponent(Vpc, { enabled: true })).toThrow(
            `"Test/Vpc" is only available in AWS projects. This project's hosting type is "standalone".`
        );
    });

    it("renders in a project of the tagged hosting type", () => {
        process.env.WEBINY_HOSTING_TYPE = "aws";
        const Extension = createExtension("Test/Supported", "aws");

        expect(() => callComponent(Extension, { enabled: true })).not.toThrow();
    });

    it("renders in every hosting type when untagged", () => {
        const Extension = createExtension("Test/Untagged");

        for (const hostingType of ["aws", "standalone"]) {
            process.env.WEBINY_HOSTING_TYPE = hostingType;
            expect(() => callComponent(Extension, { enabled: true })).not.toThrow();
        }
    });

    it("skips the check when the hosting type is not set", () => {
        delete process.env.WEBINY_HOSTING_TYPE;
        const Extension = createExtension("Test/Unset", "standalone");

        expect(() => callComponent(Extension, { enabled: false })).not.toThrow();
    });

    it("renders the implementation registered for the current hosting type", () => {
        const Spec = createExtension("Test/WithImplementation");
        const Implementation = createExtension("Test/WithImplementation");
        registerExtensionImplementation("standalone", Spec, Implementation);

        process.env.WEBINY_HOSTING_TYPE = "standalone";
        expect(callComponent(Spec, { enabled: true }).type).toBe(Implementation);

        process.env.WEBINY_HOSTING_TYPE = "aws";
        expect(callComponent(Spec, { enabled: true }).type).not.toBe(Implementation);
    });

    it("renders the registered implementation itself, not the implementation again", () => {
        process.env.WEBINY_HOSTING_TYPE = "aws";
        const Spec = createExtension("Test/NoLoop");
        const Implementation = createExtension("Test/NoLoop");
        registerExtensionImplementation("aws", Spec, Implementation);

        expect(callComponent(Implementation, { enabled: true }).type).not.toBe(Implementation);
    });

    it("checks the hosting type in the Infra.Env components", () => {
        process.env.WEBINY_HOSTING_TYPE = "standalone";

        expect(() => callComponent(EnvIsProd, { children: null })).toThrow(
            `"Infra.Env.IsProd" is only available in AWS projects.`
        );
    });
});
