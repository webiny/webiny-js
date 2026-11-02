import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { z } from "zod";
import { defineExtension } from "~/defineExtension/index.js";
import {
    anyHosting,
    hostingOnly,
    registerExtensionImplementation
} from "~/extensions/hosting/index.js";

const createExtension = (type: string) => {
    return defineExtension({
        type,
        tags: { runtimeContext: "project" },
        paramsSchema: z.object({ enabled: z.boolean() })
    });
};

// Calls the wrapper as a function: the hosting check and the implementation lookup both run
// before anything is rendered, so the returned element shows which component would render.
const callWrapper = (Component: React.ComponentType<any>, props: Record<string, unknown>) => {
    return (Component as unknown as (props: Record<string, unknown>) => React.ReactElement)(props);
};

describe("hostingOnly", () => {
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
        const Vpc = hostingOnly("Infra.Vpc", ["aws"], createExtension("Test/Vpc"));

        expect(() => callWrapper(Vpc, { enabled: true })).toThrow(
            `"Infra.Vpc" is only available in AWS projects. This project's hosting type is "standalone".`
        );
    });

    it("renders the extension in a project of a supported hosting type", () => {
        process.env.WEBINY_HOSTING_TYPE = "aws";
        const Extension = createExtension("Test/Supported");
        const Wrapped = hostingOnly("Infra.Supported", ["aws"], Extension);

        const element = callWrapper(Wrapped, { enabled: true });
        expect(element.type).toBe(Extension);
        expect(element.props).toEqual({ enabled: true });
    });

    it("skips the check when the hosting type is not set", () => {
        delete process.env.WEBINY_HOSTING_TYPE;
        const Extension = createExtension("Test/Unset");
        const Wrapped = hostingOnly("Infra.Unset", ["standalone"], Extension);

        expect(callWrapper(Wrapped, { enabled: false }).type).toBe(Extension);
    });

    it("renders the registered implementation in place of the spec", () => {
        process.env.WEBINY_HOSTING_TYPE = "aws";
        const Spec = createExtension("Test/WithImplementation");
        const Implementation = createExtension("Test/WithImplementation");
        registerExtensionImplementation("aws", Spec, Implementation);

        const Wrapped = hostingOnly("Infra.WithImplementation", ["aws"], Spec);
        expect(callWrapper(Wrapped, { enabled: true }).type).toBe(Implementation);
    });

    it("uses only the implementation registered for the current hosting type", () => {
        const Spec = createExtension("Test/PerHostingType");
        const Implementation = createExtension("Test/PerHostingType");
        registerExtensionImplementation("standalone", Spec, Implementation);

        const Wrapped = anyHosting("Infra.PerHostingType", Spec);

        process.env.WEBINY_HOSTING_TYPE = "standalone";
        expect(callWrapper(Wrapped, { enabled: true }).type).toBe(Implementation);

        process.env.WEBINY_HOSTING_TYPE = "aws";
        expect(callWrapper(Wrapped, { enabled: true }).type).toBe(Spec);
    });

    it("keeps the definition of the wrapped extension", () => {
        const Extension = createExtension("Test/Definition");
        const Wrapped = hostingOnly("Infra.Definition", ["aws"], Extension);

        expect(Wrapped.def).toBe(Extension.def);
        expect(Wrapped.getDefinition()).toBe(Extension.def);
    });
});
