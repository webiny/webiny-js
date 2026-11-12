import path from "path";
import { describe, it, expect } from "vitest";
import { Container } from "@webiny/di";
import { AdminAfterBuild } from "~/abstractions/index.js";
import type { IProjectConfigModel, IProjectModel } from "~/abstractions/models/index.js";
import { adminAfterBuild } from "~/features/hooks/index.js";
import { AdminAfterBuild as AdminAfterBuildExt } from "~/extensions/hooks/index.js";
import { registerHooks } from "~/services/InitProjectSdkService/registerHooks.js";
import { calls } from "./registerHooks/countingHook.js";

const root = path.resolve(import.meta.dirname, "..");
const toPath = (value: string) => ({ toString: () => value });

const project = {
    paths: {
        rootFolder: {
            ...toPath(root),
            join: (...parts: string[]) => toPath(path.join(root, ...parts))
        },
        tsConfigFile: toPath(path.join(root, "tsconfig.json"))
    }
} as unknown as IProjectModel;

describe("registerHooks", () => {
    // The container keeps one entry per registration, so a hook type listed twice runs twice.
    it("runs a configured hook once", async () => {
        const src = path.join(import.meta.dirname, "registerHooks", "countingHook.ts");
        const projectExtensions = {
            extensionsByType: (type: unknown) => {
                return type === AdminAfterBuildExt ? [{ params: { src } }] : [];
            }
        } as unknown as IProjectConfigModel;

        const container = new Container();
        container.registerComposite(adminAfterBuild);
        await registerHooks(container, projectExtensions, project);

        await container
            .resolve(AdminAfterBuild)
            .execute({ app: "admin" } as AdminAfterBuild.Params);

        expect(calls.count).toBe(1);
    });
});
