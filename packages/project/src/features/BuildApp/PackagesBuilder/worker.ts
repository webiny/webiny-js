import "tsx/esm";
import { requireConfigWithExecute } from "./utils/requireConfig.js";
import { serializeError } from "serialize-error";

try {
    const workerData = JSON.parse(process.argv[2]);

    const { package: pkg, env, variant, region, debug } = workerData;
    const options = {
        cwd: pkg.paths.packageFolder,
        env,
        variant,
        region,
        debug
    };

    const config = await requireConfigWithExecute(pkg.paths.webinyConfigFile, {
        options
    });

    const hasBuild = config.commands && typeof config.commands.build === "function";
    if (!hasBuild) {
        throw new Error("Build command not found.");
    }

    await config.commands.build(options);
} catch (e) {
    if (process.send) {
        process.send({ error: serializeError(e) });
    }
}
