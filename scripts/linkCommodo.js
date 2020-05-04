const rimraf = require("rimraf");
const fs = require("fs-extra");
const path = require("path");

async function symlink(src, dest) {
    if (process.platform !== "win32") {
        // use relative paths otherwise which will be retained if the directory is moved
        src = path.relative(path.dirname(dest), src);
        // When path.relative returns an empty string for the current directory, we should instead use
        // '.', which is a valid fs.symlink target.
        src = src || ".";
    }

    try {
        const stats = await fs.lstat(dest);
        if (stats.isSymbolicLink()) {
            const resolved = dest;
            if (resolved === src) {
                return;
            }
        }
    } catch (err) {
        if (err.code !== "ENOENT") {
            throw err;
        }
    }
    // We use rimraf for unlink which never throws an ENOENT on missing target
    rimraf.sync(dest);

    if (process.platform === "win32") {
        // use directory junctions if possible on win32, this requires absolute paths
        await fs.symlink(src, dest, "junction");
    } else {
        await fs.symlink(src, dest);
    }
}

(async () => {
    const commodoRepo = path.resolve("..", "commodo", "packages");

    if (!fs.existsSync(commodoRepo)) {
        console.log(
            `INFO: Commodo repo not found at "../commodo", using original "@commodo" packages from NPM!`
        );
        return;
    }

    console.log(`Linking @commodo packages...`);
    const directories = source =>
        fs
            .readdirSync(source, {
                withFileTypes: true
            })
            .filter(c => c.isDirectory())
            .map(c => c.name);

    const commodoRoot = path.resolve("node_modules", "@commodo");
    const commodoPackages = directories(commodoRepo);

    await new Promise(resolve => rimraf(path.join(commodoRoot, "*"), resolve));

    for (let i = 0; i < commodoPackages.length; i++) {
        const name = commodoPackages[i];
        const link = path.join(commodoRoot, name);
        const target = path.resolve("..", "commodo", "packages", name, "dist");

        console.log(`${link} => ${target}`);

        if (!fs.existsSync(target)) {
            throw Error(
                `"dist" is missing in @commodo/${name}! Run "yarn build" in your commodo repo.`
            );
        }

        try {
            await fs.mkdirp(path.dirname(link));
            await symlink(target, link);
        } catch (err) {
            console.log(`Failed ${name}: ${err.message}`);
        }
    }
})();
