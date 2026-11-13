import path from "path";
import fs from "fs";
import { createRequire } from "module";

/** The package whose handlers the Postgres api bundle exports; knex and pg are resolved from it. */
export const PG_HANDLER_PACKAGE = "@webiny/api-event-handler-aws-pg";

/**
 * What the Postgres bundle loads from `node_modules` at runtime. The bundler keeps knex external
 * (it statically requires a driver for every SQL dialect), and knex loads `pg` by name.
 */
export const PG_RUNTIME_PACKAGES = ["knex", "pg"] as const;

export interface CopyPgRuntimeModulesParams {
    /** Where module resolution starts: the api app's source folder, as the bundler resolves it. */
    resolveFrom: string;
    /** The api bundle's output folder. The modules go into its `node_modules`. */
    buildDir: string;
}

export interface CopyPgRuntimeModulesResult {
    /** Every package copied, as `name@version`, sorted. */
    packages: string[];
    /** How many files were copied. */
    files: number;
}

interface PackageJson {
    name: string;
    version: string;
    dependencies?: Record<string, string>;
    optionalDependencies?: Record<string, string>;
}

interface PlacedPackage {
    name: string;
    version: string;
    /** The package's real folder on disk (symlinks resolved). */
    realDir: string;
    /** Where it goes in the build. */
    destDir: string;
}

const readPackageJson = (dir: string): PackageJson => {
    return JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf8"));
};

/** Finds a package the way Node does from `fromDir`: in each ancestor's `node_modules`. */
const findPackageDir = (name: string, fromDir: string): string | null => {
    let dir = path.resolve(fromDir);
    while (true) {
        if (path.basename(dir) !== "node_modules") {
            const candidate = path.join(dir, "node_modules", name);
            if (fs.existsSync(path.join(candidate, "package.json"))) {
                return fs.realpathSync(candidate);
            }
        }
        const parent = path.dirname(dir);
        if (parent === dir) {
            return null;
        }
        dir = parent;
    }
};

/**
 * Lays out knex, pg and their dependency closure (`dependencies` and installed
 * `optionalDependencies`, never peers) the way an install would: each package at the top of
 * `build/node_modules`, unless a different version of it is already there, in which case it nests
 * under the package that needs it. So `sharp`, `@aws-sdk/*` and the drivers knex can load but the
 * project doesn't use (better-sqlite3, mysql, ...) never get in.
 */
const placePackages = (handlerDir: string, nodeModulesDir: string): PlacedPackage[] => {
    // destDir -> placed package
    const placed = new Map<string, PlacedPackage>();
    const queue: PlacedPackage[] = [];

    const place = (name: string, realDir: string, destDir: string) => {
        const pkg: PlacedPackage = {
            name,
            version: readPackageJson(realDir).version,
            realDir,
            destDir
        };
        placed.set(destDir, pkg);
        queue.push(pkg);
    };

    /* What Node would load for `name` from inside `fromDestDir`, given what is placed so far. */
    const resolvePlaced = (name: string, fromDestDir: string): PlacedPackage | undefined => {
        let dir = fromDestDir;
        while (true) {
            if (path.basename(dir) !== "node_modules") {
                const found = placed.get(path.join(dir, "node_modules", name));
                if (found) {
                    return found;
                }
            }
            if (dir === path.dirname(nodeModulesDir)) {
                return undefined;
            }
            dir = path.dirname(dir);
        }
    };

    for (const name of PG_RUNTIME_PACKAGES) {
        const realDir = findPackageDir(name, handlerDir);
        if (!realDir) {
            throw new Error(
                `Could not find "${name}", which ${PG_HANDLER_PACKAGE} needs. Reinstall the project's dependencies.`
            );
        }
        place(name, realDir, path.join(nodeModulesDir, name));
    }

    while (queue.length) {
        const parent = queue.shift()!;
        const pkgJson = readPackageJson(parent.realDir);
        const deps = [
            ...Object.keys(pkgJson.dependencies || {}).map(name => ({ name, optional: false })),
            ...Object.keys(pkgJson.optionalDependencies || {}).map(name => ({
                name,
                optional: true
            }))
        ];

        for (const dep of deps) {
            const realDir = findPackageDir(dep.name, parent.realDir);
            if (!realDir) {
                if (dep.optional) {
                    continue;
                }
                throw new Error(
                    `Could not find "${dep.name}", which "${parent.name}" needs. Reinstall the project's dependencies.`
                );
            }

            const resolved = resolvePlaced(dep.name, parent.destDir);
            if (resolved?.realDir === realDir) {
                continue;
            }
            // Nothing by that name is reachable: it goes to the top. Otherwise a different version
            // is, so this one nests under the package that needs it.
            const destDir = resolved
                ? path.join(parent.destDir, "node_modules", dep.name)
                : path.join(nodeModulesDir, dep.name);
            place(dep.name, realDir, destDir);
        }
    }

    return Array.from(placed.values());
};

/**
 * Copies knex, pg and the files they need into `<buildDir>/node_modules`, so the uploaded api
 * bundle can load them on Lambda. `@vercel/nft` traces the file closure from each package's entry
 * (only the files that can be loaded, no docs, types or CLI), and the closure is limited to the
 * packages `placePackages` chose. pg is plain JavaScript, so a build on any OS runs on Lambda.
 * Nothing is downloaded: the files come from the project's own install.
 */
export const copyPgRuntimeModules = async (
    params: CopyPgRuntimeModulesParams
): Promise<CopyPgRuntimeModulesResult> => {
    const { resolveFrom, buildDir } = params;

    const handlerDir = findPackageDir(PG_HANDLER_PACKAGE, resolveFrom);
    if (!handlerDir) {
        throw new Error(
            `<Infra.Postgres /> needs ${PG_HANDLER_PACKAGE} in the project. Add it to package.json and install it.`
        );
    }

    const nodeModulesDir = path.join(buildDir, "node_modules");
    const packages = placePackages(handlerDir, nodeModulesDir);

    // realDir -> every place that package goes (one, unless a version is needed in two places).
    const byRealDir = new Map<string, PlacedPackage[]>();
    for (const pkg of packages) {
        byRealDir.set(pkg.realDir, [...(byRealDir.get(pkg.realDir) || []), pkg]);
    }
    // Longest first, so a file inside a nested node_modules belongs to the inner package.
    const realDirs = Array.from(byRealDir.keys()).sort((a, b) => b.length - a.length);

    const entries = PG_RUNTIME_PACKAGES.map(name => {
        const pkg = packages.find(p => p.destDir === path.join(nodeModulesDir, name))!;
        // The CommonJS entry (by `main`), which is what knex loads `pg` through.
        return createRequire(path.join(pkg.realDir, "package.json")).resolve(pkg.realDir);
    });

    // Loaded only for a Postgres build: every CLI command registers the hook.
    const { nodeFileTrace } = await import("@vercel/nft");
    const base = path.parse(handlerDir).root;
    const { fileList } = await nodeFileTrace(entries, { base });

    // Each package.json, always: Node reads it to resolve the package.
    const files = new Set<string>(packages.map(pkg => path.join(pkg.realDir, "package.json")));
    for (const relPath of fileList) {
        files.add(path.join(base, relPath));
    }

    let copied = 0;
    for (const file of files) {
        const realDir = realDirs.find(dir => file.startsWith(dir + path.sep));
        if (!realDir || !fs.statSync(file, { throwIfNoEntry: false })?.isFile()) {
            continue;
        }
        const relPath = path.relative(realDir, file);
        for (const pkg of byRealDir.get(realDir)!) {
            const dest = path.join(pkg.destDir, relPath);
            fs.mkdirSync(path.dirname(dest), { recursive: true });
            fs.copyFileSync(file, dest);
            copied++;
        }
    }

    return {
        packages: Array.from(new Set(packages.map(pkg => `${pkg.name}@${pkg.version}`))).sort(),
        files: copied
    };
};
