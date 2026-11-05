import { describe, it, expect, vi, beforeAll } from "vitest";
import { createHash } from "node:crypto";
import { Container, Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { RemoteComponentPermissionsFeature } from "~/api/features/permissions/feature.js";
import { GetRemoteComponentRepository } from "~/api/features/getComponent/abstractions.js";
import { CreateRemoteComponentUseCase } from "~/api/features/createComponent/abstractions.js";
import { CreateRemoteComponentRepository } from "~/api/features/createComponent/abstractions.js";
import { CreateRemoteComponentUseCase as CreateRemoteComponentUseCaseImplementation } from "~/api/features/createComponent/CreateRemoteComponentUseCase.js";
import { UpdateRemoteComponentUseCase } from "~/api/features/updateComponent/abstractions.js";
import { UpdateRemoteComponentRepository } from "~/api/features/updateComponent/abstractions.js";
import { UpdateRemoteComponentUseCase as UpdateRemoteComponentUseCaseImplementation } from "~/api/features/updateComponent/UpdateRemoteComponentUseCase.js";
import { bundleComponent } from "~/api/bundler/bundleComponent.js";
import type { ComponentBundle } from "~/api/bundler/types.js";
import type { RemoteComponentDto } from "~/shared/types.js";

const esbuildLoads = vi.hoisted(() => ({ count: 0 }));

vi.mock("~/api/bundler/esbuildWasm.js", async importOriginal => {
    const original = await importOriginal<typeof import("~/api/bundler/esbuildWasm.js")>();
    return {
        loadEsbuild: () => {
            esbuildLoads.count++;
            return original.loadEsbuild();
        }
    };
});

const SOURCE = `
export default function Card({ inputs: { title } }) {
    return <div className="card"><h3>{title}</h3></div>;
}

export const manifest = {
    name: "Test/Card",
    label: "Card",
    inputs: [
        { name: "title", factory: "createTextInput", params: { label: "Title" } }
    ]
};
`;

const OTHER_SOURCE = SOURCE.replace(/title/g, "heading");

const CSS = ".card { padding: 16px; }";

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

const stored: RemoteComponentDto = {
    id: "c1",
    name: "Test/Card",
    label: "Card",
    description: "",
    aiContext: "",
    source: SOURCE,
    css: CSS,
    bundledJs: "",
    bundledJsSha256: "",
    bundledCss: "",
    bundledCssSha256: "",
    aiPrompt: "",
    status: "draft",
    sdkVersion: "1",
    createdOn: "2026-11-02T00:00:00.000Z",
    savedOn: "2026-11-02T00:00:00.000Z"
};

const setup = () => {
    const calls = {
        get: [] as string[],
        create: [] as unknown[],
        update: [] as { id: string; values: Record<string, any> }[]
    };

    const container = new Container();
    container.registerInstance(IdentityContext, {
        getIdentity: () => ({ id: "identity-1", type: "admin", displayName: "Test" }),
        hasFullAccess: async () => true,
        getPermission: async () => null,
        getPermissions: async () => []
    } as unknown as IdentityContext.Interface);
    RemoteComponentPermissionsFeature.register(container);

    container.registerInstance(GetRemoteComponentRepository, {
        execute: async (id: string) => {
            calls.get.push(id);
            return Result.ok(stored);
        }
    });
    container.registerInstance(CreateRemoteComponentRepository, {
        execute: async (input: unknown) => {
            calls.create.push(input);
            return Result.ok(stored);
        }
    } as unknown as CreateRemoteComponentRepository.Interface);
    container.registerInstance(UpdateRemoteComponentRepository, {
        execute: async (id: string, values: Record<string, any>) => {
            calls.update.push({ id, values });
            return Result.ok(stored);
        }
    } as unknown as UpdateRemoteComponentRepository.Interface);

    container.register(CreateRemoteComponentUseCaseImplementation);
    container.register(UpdateRemoteComponentUseCaseImplementation);

    return {
        calls,
        create: container.resolve(CreateRemoteComponentUseCase),
        update: container.resolve(UpdateRemoteComponentUseCase)
    };
};

const errorCode = (result: Result<unknown, { code?: string }>) => {
    return result.isFail() ? result.error.code : null;
};

let bundle: ComponentBundle;
let otherBundle: ComponentBundle;

beforeAll(async () => {
    const built = await bundleComponent({ name: "Test/Card", source: SOURCE, css: CSS });
    bundle = { bundledJs: built.bundled, bundledCss: built.css, manifest: built.manifest };

    const other = await bundleComponent({ name: "Test/Card", source: OTHER_SOURCE, css: CSS });
    otherBundle = { bundledJs: other.bundled, bundledCss: other.css, manifest: other.manifest };

    // The counter sees bundling, so an unchanged count below means nothing bundled.
    expect(esbuildLoads.count).toBe(2);
});

describe("createRemoteComponent with a bundle", () => {
    it("stores the bundle with hashes it computes, without bundling", async () => {
        const { create, calls } = setup();
        const loadsBefore = esbuildLoads.count;

        const result = await create.execute({
            name: "Test/Card",
            label: "Card",
            source: SOURCE,
            css: CSS,
            bundle
        });

        expect(result.isOk()).toBe(true);
        expect(esbuildLoads.count).toBe(loadsBefore);
        expect(calls.create).toEqual([
            {
                name: "Test/Card",
                label: "Card",
                source: SOURCE,
                css: CSS,
                bundledJs: bundle.bundledJs,
                bundledJsSha256: sha256(bundle.bundledJs),
                bundledCss: bundle.bundledCss,
                bundledCssSha256: sha256(bundle.bundledCss!)
            }
        ]);
    });

    it("rejects a bundle whose manifest doesn't match the source", async () => {
        const { create, calls } = setup();

        const result = await create.execute({
            name: "Test/Card",
            label: "Card",
            source: SOURCE,
            css: CSS,
            bundle: otherBundle
        });

        expect(errorCode(result)).toBe("RemoteComponent/InvalidBundle");
        expect(result.isFail() && result.error.data).toEqual({
            errors: ["The bundle's manifest does not declare the inputs the source declares."]
        });
        expect(calls.create).toEqual([]);
    });

    it("rejects a manifest that wasn't produced by the bundle", async () => {
        const { create, calls } = setup();
        const manifest = JSON.stringify({ ...JSON.parse(bundle.manifest), label: "Other" });

        const result = await create.execute({
            name: "Test/Card",
            label: "Card",
            source: SOURCE,
            css: CSS,
            bundle: { ...bundle, manifest }
        });

        expect(errorCode(result)).toBe("RemoteComponent/InvalidBundle");
        expect(calls.create).toEqual([]);
    });

    it("creates without a bundle exactly as before", async () => {
        const { create, calls } = setup();
        const input = { name: "Test/Card", label: "Card", source: SOURCE, css: CSS };

        const result = await create.execute(input);

        expect(result.isOk()).toBe(true);
        expect(calls.create).toEqual([input]);
    });

    it("treats a null bundle as no bundle", async () => {
        const { create, calls } = setup();

        await create.execute({ name: "Test/Card", label: "Card", source: SOURCE, bundle: null });

        expect(calls.create).toEqual([{ name: "Test/Card", label: "Card", source: SOURCE }]);
    });
});

describe("updateRemoteComponent", () => {
    it("stores the flat bundle fields as given, unchecked, as before", async () => {
        const { update, calls } = setup();

        const result = await update.execute("c1", {
            bundledJs: "anything",
            bundledJsSha256: "not-a-hash",
            bundledCss: ".x{}",
            bundledCssSha256: "also-not-a-hash"
        });

        expect(result.isOk()).toBe(true);
        expect(calls.get).toEqual([]);
        expect(calls.update).toEqual([
            {
                id: "c1",
                values: {
                    bundledJs: "anything",
                    bundledJsSha256: "not-a-hash",
                    bundledCss: ".x{}",
                    bundledCssSha256: "also-not-a-hash"
                }
            }
        ]);
    });

    it("validates a bundle against the stored component and stores it", async () => {
        const { update, calls } = setup();

        const result = await update.execute("c1", { bundle });

        expect(result.isOk()).toBe(true);
        expect(calls.get).toEqual(["c1"]);
        expect(calls.update).toEqual([
            {
                id: "c1",
                values: {
                    bundledJs: bundle.bundledJs,
                    bundledJsSha256: sha256(bundle.bundledJs),
                    bundledCss: bundle.bundledCss,
                    bundledCssSha256: sha256(bundle.bundledCss!)
                }
            }
        ]);
    });

    it("validates a bundle against the source the update sets", async () => {
        const { update, calls } = setup();

        const accepted = await update.execute("c1", { source: OTHER_SOURCE, bundle: otherBundle });
        const rejected = await update.execute("c1", { source: OTHER_SOURCE, bundle });

        expect(accepted.isOk()).toBe(true);
        expect(errorCode(rejected)).toBe("RemoteComponent/InvalidBundle");
        expect(calls.update).toHaveLength(1);
    });

    it("rejects a bundle combined with the flat bundle fields", async () => {
        const { update, calls } = setup();

        const result = await update.execute("c1", { bundle, bundledJs: "x" });

        expect(errorCode(result)).toBe("RemoteComponent/InvalidBundle");
        expect(calls.update).toEqual([]);
    });
});
