import { createRsbuildConfig } from "./createRsbuildConfig.js";
import { printBuildStats } from "../printBuildStats.js";

export const createBuildAdmin =
    () =>
    async ({ cwd }) => {
        process.env.NODE_ENV = "production";

        // Lazy import: @rsbuild/core transitively loads @rspack/core, which uses
        // import.meta.dirname at module top level. tsx's CJS transformer (used by
        // .babelrc.js files) can't handle that, so we defer the import until here.
        const { createRsbuild } = await import("@rsbuild/core");
        const rsbuildConfig = createRsbuildConfig({ cwd });

        const rsbuild = await createRsbuild({ rsbuildConfig });

        rsbuild.onAfterBuild(printBuildStats({ cwd, label: "admin", extensions: [".js", ".css"] }));

        await rsbuild.build();
    };
