import { describe, expect, it, vi } from "vitest";
import { Abstraction, Container } from "@webiny/di";
import { createRegisterExtensionPlugin, registerExtensions } from "@webiny/handler";
import { HttpAllowedRequestHeaders } from "@webiny/api-kernel-core";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { ApiRequestRegistration } from "~/requestRegistration/index.js";
import {
    AllowedRequestHeadersError,
    registerRootAllowedRequestHeaders
} from "~/http/registerRootAllowedRequestHeaders.js";

const allowing = (...headers: string[]) => {
    return createRegisterExtensionPlugin(({ container }) => {
        container.registerInstance(HttpAllowedRequestHeaders, { headers });
    });
};

/** A root whose request registration has a request-level service and applies the extensions. */
const setup = (extensions: unknown[]) => {
    const root = new Container();
    const warn = vi.fn();
    root.registerInstance(Logger, { warn } as unknown as Logger.Interface);
    const FeatureFlags = new Abstraction<{ enabled: boolean }>("FeatureFlags");
    const registeredIn: Container[] = [];
    root.registerInstance(ApiRequestRegistration, {
        async register(container) {
            registeredIn.push(container);
            container.registerInstance(FeatureFlags, { enabled: true });
            await registerExtensions(container, extensions);
        }
    });
    return { root, FeatureFlags, registeredIn, warn };
};

describe("registerRootAllowedRequestHeaders", () => {
    it("registers the headers every extension allows in the root, as one list", async () => {
        const { root } = setup([allowing("X-One"), [allowing("X-Two", "X-Three")]]);

        await registerRootAllowedRequestHeaders(root);

        const registered = root.resolveAll(HttpAllowedRequestHeaders);
        expect(registered).toEqual([{ headers: ["X-One", "X-Two", "X-Three"] }]);
    });

    it("registers what a request has in a child of the root, so extensions can use it while they register", async () => {
        const Probe = new Abstraction<object>("Probe");
        let flagsWhileRegistering: boolean | undefined;
        const { root, FeatureFlags, registeredIn } = setup([
            createRegisterExtensionPlugin(({ container }) => {
                flagsWhileRegistering = container.resolve(FeatureFlags).enabled;
                container.registerInstance(Probe, {});
            })
        ]);

        await registerRootAllowedRequestHeaders(root);

        expect(flagsWhileRegistering).toBe(true);
        expect(registeredIn).toHaveLength(1);
        expect(registeredIn[0]).not.toBe(root);
        // Nothing the request registration registered stays in the root.
        expect(root.resolveAll(Probe)).toEqual([]);
        expect(root.resolveAll(FeatureFlags)).toEqual([]);
    });

    it("warns when registering fails there, and allows the headers registered before", async () => {
        const Missing = new Abstraction<object>("NotARequestService");
        const { root, warn } = setup([
            allowing("X-One"),
            createRegisterExtensionPlugin(({ container }) => {
                container.resolve(Missing);
            }),
            allowing("X-Never")
        ]);

        await registerRootAllowedRequestHeaders(root);

        expect(root.resolve(HttpAllowedRequestHeaders).headers).toEqual(["X-One"]);
        expect(warn).toHaveBeenCalledTimes(1);
        expect(warn.mock.calls[0][0]).toEqual({
            error: "No registration found for NotARequestService"
        });
    });

    it("fails at start for an allowed-headers implementation that can't be built there", async () => {
        const Missing = new Abstraction<object>("NotARequestService");
        class Headers implements HttpAllowedRequestHeaders.Interface {
            public readonly headers = ["X-One"];
            public constructor(_service: object) {}
        }
        const { root } = setup([
            createRegisterExtensionPlugin(({ container }) => {
                container.register(
                    HttpAllowedRequestHeaders.createImplementation({
                        implementation: Headers,
                        dependencies: [Missing]
                    })
                );
            })
        ]);

        await expect(registerRootAllowedRequestHeaders(root)).rejects.toThrow(
            AllowedRequestHeadersError
        );
    });
});
