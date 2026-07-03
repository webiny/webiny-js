#!/usr/bin/env node

import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "node:crypto";
import { execSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const projectName = process.argv[2];
if (!projectName) {
    console.error("Usage: create-webiny-server-project <project-name>");
    process.exit(1);
}

const projectDir = path.resolve(process.cwd(), projectName);

if (fs.existsSync(projectDir)) {
    console.error(`Directory "${projectName}" already exists.`);
    process.exit(1);
}

console.log(`\nCreating a new Webiny server project in ${projectDir}...\n`);

const templatesDir = path.join(__dirname, "_templates");
fs.copySync(templatesDir, projectDir);

// Rename template files to their real names.
const renames = [
    ["example.gitignore", ".gitignore"],
    ["example.gitattributes", ".gitattributes"],
    ["template.package.json", "package.json"]
];

for (const [from, to] of renames) {
    const src = path.join(projectDir, from);
    if (fs.existsSync(src)) {
        fs.moveSync(src, path.join(projectDir, to), { overwrite: true });
    }
}

// Stamp an anonymous per-project installation ID.
const pkgPath = path.join(projectDir, "package.json");
const pkg = fs.readJsonSync(pkgPath);
pkg.name = projectName;
pkg.webiny = { ...pkg.webiny, installationId: randomUUID() };
fs.writeJsonSync(pkgPath, pkg, { spaces: 2 });

console.log("Installing dependencies (this may take a minute)...\n");

try {
    execSync("yarn", { cwd: projectDir, stdio: "inherit" });
} catch {
    console.error(
        "\nFailed to install dependencies. Try running `yarn` inside the project directory."
    );
}

console.log(`
✅  Your Webiny server project is ready!

   cd ${projectName}
   yarn webiny build api
   yarn webiny build admin

   Docs: https://webiny.com/docs
`);
