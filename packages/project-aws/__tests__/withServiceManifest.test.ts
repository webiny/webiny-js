import { describe, expect, it } from "vitest";
import * as pulumi from "@pulumi/pulumi";
import type { PulumiApp } from "@webiny/pulumi";
import {
    withServiceManifest,
    type WithServiceManifest
} from "~/pulumi/utils/withServiceManifest.js";
import type { ServiceManifest } from "~/pulumi/utils/addServiceManifestTableItem.js";

type ProgramApp = PulumiApp & WithServiceManifest;

/*
 * A stand-in for a Pulumi app with the parts `withServiceManifest` uses. `run` works as the real
 * one does: the decorated program first, then every handler in the order it was added, also those
 * added while handlers run.
 */
const createFakeApp = () => {
    const handlers: Array<() => unknown> = [];
    let decorator: ((program: (app: unknown) => unknown, app: unknown) => unknown) | undefined;

    const app = {
        handlers,
        decorateProgram(cb: typeof decorator) {
            decorator = cb;
        },
        addHandler(handler: () => unknown) {
            handlers.push(handler);
            return pulumi.output(undefined);
        }
    };

    const run = async (program: (app: ProgramApp) => unknown) => {
        await decorator!(program as (app: unknown) => unknown, app);
        for (const handler of app.handlers) {
            await handler();
        }
    };

    return { app: app as unknown as PulumiApp, run };
};

const resolve = <T>(output: pulumi.Output<T>): Promise<T> => {
    return new Promise(done => output.apply(done as (value: unknown) => void));
};

describe("withServiceManifest", () => {
    it("gives the program every manifest, also those added by later handlers, and the same set it publishes", async () => {
        const fake = createFakeApp();
        const published: ServiceManifest[][] = [];
        const app = withServiceManifest(fake.app, manifests => {
            published.push(manifests);
        });

        // As `createApiPulumiApp` adds the `api` manifest: in a handler added before the run.
        app.addHandler(() => {
            app.addServiceManifest({ name: "api", manifest: { url: "https://api" } });
        });

        let received: pulumi.Output<ServiceManifest[]> | undefined;
        await fake.run(programApp => {
            // Read while the program runs, before any manifest is added.
            received = programApp.getServiceManifests();
            // An extension's manifest, added by a handler the program adds.
            programApp.addHandler(() => {
                programApp.addServiceManifest({ name: "custom", manifest: { key: "value" } });
            });
        });

        const manifests = await resolve(received!);
        expect(manifests).toEqual([
            { name: "api", manifest: { url: "https://api" } },
            { name: "custom", manifest: { key: "value" } }
        ]);
        expect(published).toEqual([manifests]);
    });

    it("also collects manifests that handlers added by other handlers add", async () => {
        const fake = createFakeApp();
        const published: ServiceManifest[][] = [];
        const app = withServiceManifest(fake.app, manifests => {
            published.push(manifests);
        });

        await fake.run(programApp => {
            // As `ApiPulumi` runs: in a handler, adding its own handlers, one of them two deep.
            programApp.addHandler(() => {
                programApp.addHandler(() => {
                    programApp.addServiceManifest({ name: "first", manifest: { level: 2 } });
                    programApp.addHandler(() => {
                        programApp.addServiceManifest({ name: "second", manifest: { level: 3 } });
                    });
                });
            });
        });

        const manifests = await resolve(app.getServiceManifests());
        expect(manifests).toEqual([
            { name: "first", manifest: { level: 2 } },
            { name: "second", manifest: { level: 3 } }
        ]);
        expect(published).toEqual([manifests]);
    });

    it("gives the same output to the program and to the app", async () => {
        const fake = createFakeApp();
        const app = withServiceManifest(fake.app, () => undefined);

        let fromProgram: pulumi.Output<ServiceManifest[]> | undefined;
        await fake.run(programApp => {
            fromProgram = programApp.getServiceManifests();
        });

        expect(fromProgram).toBe(app.getServiceManifests());
        expect(await resolve(app.getServiceManifests())).toEqual([]);
    });
});
