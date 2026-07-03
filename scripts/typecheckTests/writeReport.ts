import fs from "fs";
import path from "path";

const PROJECT_ROOT = path.join(import.meta.dirname, "..", "..");
export const REPORT_DIR = path.join(PROJECT_ROOT, "docs", ".reports");

export const writeReport = (packageName: string, errors: string[]): number => {
    const reportPath = path.join(REPORT_DIR, `${packageName}.md`);
    const errorLines = errors.filter(line => line.includes("error TS"));
    const count = errorLines.length;

    const content = [
        `# Type errors: ${packageName}`,
        "",
        `Total: ${count} errors`,
        "",
        "```",
        errorLines.join("\n"),
        "```",
        ""
    ].join("\n");

    fs.writeFileSync(reportPath, content);

    return count;
};
