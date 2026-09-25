import { describe, it, expectTypeOf } from "vitest";
import type { RemoteComponentGateway } from "~/admin/features/shared/abstractions.js";
import type { IUpdateRemoteComponentInput } from "~/api/features/updateComponent/abstractions.js";

/**
 * The editor must be structurally incapable of writing a bundle.
 *
 * Not "does not currently write one" — incapable, so that no future edit to the presenter can
 * reintroduce it without this failing first. A bundle stored from the browser could have been built
 * from a different source revision than the one saved beside it, and the manifest persisted with it
 * has to come from the same derivation the server ran. The only writer is the bundler, reached
 * through `bundleRemoteComponent`.
 *
 * These are type assertions rather than runtime ones because that is the level the guarantee lives
 * at: if it compiles, the door is open.
 */
type GatewayUpdateInput = Parameters<RemoteComponentGateway.Interface["update"]>[1];

describe("the editor cannot write bundles", () => {
    it("gives the admin gateway no field for a bundle", () => {
        // The exact set, not an absence check: a new derived field added here has to be a deliberate
        // edit to this list rather than something that slips in unnoticed.
        expectTypeOf<keyof GatewayUpdateInput>().toEqualTypeOf<
            "name" | "label" | "description" | "aiContext" | "source" | "css" | "aiPrompt"
        >();
    });

    it("rejects a bundle write at the call site", () => {
        // Never invoked — the assertion is that this body does not compile without the expected
        // errors. The suite also runs as a normal test file, so nothing here may actually execute.
        const attempts = (update: RemoteComponentGateway.Interface["update"]) => {
            // @ts-expect-error A bundle is not something a caller may supply.
            void update("id", { bundledJs: "(() => {})()" });
            // @ts-expect-error Nor its hash.
            void update("id", { bundledJsSha256: "abc" });
            // @ts-expect-error Nor the manifest, which must come from the bundle it is stored beside.
            void update("id", { manifest: "{}" });
            // @ts-expect-error Nor the status: it is a transition the bundler makes, not a property.
            void update("id", { status: "bundled" });
        };

        expectTypeOf(attempts).toBeFunction();
    });

    it("keeps the same door shut on the API's own update input", () => {
        // Closing it only in the admin gateway would leave the mutation open to anything else.
        // `bundle` is here because Promote's Replace path supplies a bundle it already built, so the
        // source and its bundle are written together. It is absent from the GraphQL input, so the
        // editor still cannot reach it.
        expectTypeOf<keyof IUpdateRemoteComponentInput>().toEqualTypeOf<
            "name" | "label" | "description" | "source" | "css" | "aiPrompt" | "bundle"
        >();
    });

    it("still lets a caller change what a component actually is", () => {
        // The constraint is on derived fields only — the editor saves source and metadata as before.
        const save = (update: RemoteComponentGateway.Interface["update"]) =>
            update("id", {
                name: "Hero",
                source: "export default function Hero() {}",
                css: ".a{}"
            });

        expectTypeOf(save).toBeFunction();
    });

    it("offers exactly one way to produce a bundle", () => {
        expectTypeOf<RemoteComponentGateway.Interface["bundle"]>().toBeFunction();
        expectTypeOf<RemoteComponentGateway.Interface["bundle"]>()
            .parameter(0)
            .toEqualTypeOf<string>();
    });
});
