import { join } from "path";

export const watchPackages = async () => {
    const { watch } = await import("chokidar");

    const watchPaths = [join(process.cwd(), "packages-v6", "core", "src")];

    const watcher = watch(watchPaths, {
        ignored: /(^|[\/\\])\../, // ignore dotfiles
        persistent: true
    });

    // Something to use when events are received.
    const log = console.log.bind(console);

    // Add event listeners.
    return new Promise(resolve => {
        watcher
            .on("add", path => log(`File ${path} has been added`))
            .on("change", path => log(`File ${path} has been changed`))
            .on("unlink", path => log(`File ${path} has been removed`))
            .on("ready", resolve);
    });
};
