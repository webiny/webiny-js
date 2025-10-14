import * as fs from "fs";
import * as path from "path";
import { promisify } from "util";

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const readdir = promisify(fs.readdir);

const ALLOWED_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".json", ".css", ".html", ".md"]);

const EXTENSION_TO_LANG: Record<string, string> = {
    ".ts": "ts",
    ".tsx": "tsx",
    ".js": "js",
    ".jsx": "jsx",
    ".json": "json",
    ".css": "css",
    ".html": "html",
    ".md": "md"
};

async function collectFiles(dir: string, rootDir: string): Promise<string[]> {
    const entries = await readdir(dir, { withFileTypes: true });
    const files: string[] = [];

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            const subFiles = await collectFiles(fullPath, rootDir);
            files.push(...subFiles);
        } else {
            const ext = path.extname(entry.name);
            if (ALLOWED_EXTENSIONS.has(ext)) {
                const relativePath = path.relative(rootDir, fullPath);
                files.push(relativePath);
            }
        }
    }

    return files;
}

async function generateMDX(rootDir: string, outputFilePath: string): Promise<void> {
    const absoluteRoot = path.resolve(rootDir);
    const files = await collectFiles(absoluteRoot, absoluteRoot);

    const parts: string[] = [];

    for (const relPath of files) {
        const absPath = path.join(absoluteRoot, relPath);
        const ext = path.extname(relPath);
        const lang = EXTENSION_TO_LANG[ext] ?? "";

        const content = await readFile(absPath, "utf8");

        const comment = getCommentSyntax(ext, relPath);

        parts.push([`\`\`\`${lang}`, `${comment}`, `${content.trim()}`, `\`\`\``, ""].join("\n"));
    }

    const output = parts.join("\n");

    await writeFile(outputFilePath, output, "utf8");

    console.log(`✅ MDX file written to ${outputFilePath}`);
}

function getCommentSyntax(ext: string, filePath: string): string {
    if ([".js", ".ts", ".tsx", ".jsx", ".css"].includes(ext)) {
        return `// ${filePath}`;
    }

    if ([".html"].includes(ext)) {
        return `<!-- ${filePath} -->`;
    }

    if ([".json", ".md"].includes(ext)) {
        return `<!-- ${filePath} -->`; // fallback to HTML-style comments
    }

    return `// ${filePath}`;
}

// --- CLI runner ---
const inputDir = process.argv[2];
const outputFile = process.argv[3] ?? "output.mdx";

if (!inputDir) {
    console.error("❌ Please provide a directory path as the first argument.");
    process.exit(1);
}

generateMDX(inputDir, outputFile).catch(err => {
    console.error("❌ Error generating MDX:", err);
    process.exit(1);
});
