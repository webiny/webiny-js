import React from "react";
import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { z } from "zod";
import { defineExtension } from "~/defineExtension/index.js";
import { type ExtensionHosting } from "~/extensions/hosting/index.js";
import { registerExtensionImplementation } from "~/extensions/hosting/index.js";
import { EnvIsProd } from "~/extensions/infra/Env.js";

const createExtension = (type: string, hosting: ExtensionHosting = "all") => {
    return defineExtension({
        type,
        tags: { runtimeContext: "project", hosting },
        paramsSchema: z.object({ enabled: z.boolean() })
    });
};

/*
 * Calls the component as a function: the hosting check and the implementation lookup both run
 * before anything is rendered, so the returned element shows which component would render.
 */
const callComponent = (Component: React.ComponentType<any>, props: Record<string, unknown>) => {
    const render = Component as unknown as (props: Record<string, unknown>) => React.ReactElement;
    return render(props);
};

describe("hosting tag", () => {
    const originalHostingType = process.env.WEBINY_HOSTING_TYPE;
    const unregisters: Array<() => void> = [];

    afterEach(() => {
        unregisters.splice(0).forEach(unregister => unregister());

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

    it("renders in every hosting type when tagged all", () => {
        const Extension = createExtension("Test/All", "all");

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
        const unregister = registerExtensionImplementation("standalone", Spec, Implementation);
        unregisters.push(unregister);

        process.env.WEBINY_HOSTING_TYPE = "standalone";
        const inStandalone = callComponent(Spec, { enabled: true });
        expect(inStandalone.type).toBe(Implementation);

        process.env.WEBINY_HOSTING_TYPE = "aws";
        const inAws = callComponent(Spec, { enabled: true });
        expect(inAws.type).not.toBe(Implementation);
    });

    it("renders the registered implementation itself, not the implementation again", () => {
        process.env.WEBINY_HOSTING_TYPE = "aws";
        const Spec = createExtension("Test/NoLoop");
        const Implementation = createExtension("Test/NoLoop");
        const unregister = registerExtensionImplementation("aws", Spec, Implementation);
        unregisters.push(unregister);

        const rendered = callComponent(Implementation, { enabled: true });
        expect(rendered.type).not.toBe(Implementation);
    });

    it("stops rendering an implementation once it is unregistered", () => {
        process.env.WEBINY_HOSTING_TYPE = "aws";
        const Spec = createExtension("Test/Unregister");
        const Implementation = createExtension("Test/Unregister");

        const unregister = registerExtensionImplementation("aws", Spec, Implementation);
        const beforeUnregister = callComponent(Spec, { enabled: true });
        expect(beforeUnregister.type).toBe(Implementation);

        unregister();
        const afterUnregister = callComponent(Spec, { enabled: true });
        expect(afterUnregister.type).not.toBe(Implementation);
    });

    it("requires a hosting tag on every definition", () => {
        const define = () => {
            return defineExtension({
                type: "Test/NoHosting",
                // @ts-expect-error `tags.hosting` is required: "aws", "standalone" or "all".
                tags: { runtimeContext: "project" },
                paramsSchema: z.object({ enabled: z.boolean() })
            });
        };

        expect(define).not.toThrow();
    });

    it("checks the hosting type in the Infra.Env components", () => {
        process.env.WEBINY_HOSTING_TYPE = "standalone";

        expect(() => callComponent(EnvIsProd, { children: null })).toThrow(
            `"Infra.Env.IsProd" is only available in AWS projects.`
        );
    });
});
