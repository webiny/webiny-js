#!/usr/bin/env node
import "tsx/esm";

(async () => {
    const { Cli } = await import("./Cli.js");

    const cli = await Cli.init();

    await cli.run();
})();
