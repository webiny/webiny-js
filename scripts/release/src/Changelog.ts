import execa from "execa";

const DELIMITER = "---commit-delimiter---";
const HEADER_PATTERN = /^(\w+)(?:\(([^)]*)\))?:\s(.+)$/;
const PR_PATTERN = /\(#(\d+)\)$/;

const TYPES: Record<string, string> = {
    feat: "Features",
    fix: "Bug Fixes",
    refactor: "Code Refactoring"
};

const BREAKING_CHANGES = "BREAKING CHANGES";
const REPO_URL = "https://github.com/webiny/webiny-js";

export class Changelog {
    private cwd: string;

    constructor(cwd: string) {
        this.cwd = cwd;
    }

    async generate(fromRef: string, toRef: string): Promise<string> {
        const { stdout } = await execa(
            "git",
            ["log", `${fromRef}..${toRef}`, `--format=%H %s${DELIMITER}`],
            { cwd: this.cwd }
        );

        const grouped: Record<string, string[]> = {};
        const breakingChanges: string[] = [];
        const commits = stdout.split(DELIMITER).filter(s => s.trim());

        for (const raw of commits) {
            const trimmed = raw.trim();
            const spaceIndex = trimmed.indexOf(" ");
            const hash = trimmed.substring(0, spaceIndex);
            const header = trimmed.substring(spaceIndex + 1);

            const match = HEADER_PATTERN.exec(header);
            if (!match) {
                continue;
            }

            const [, type, scope, subject] = match;
            const heading = TYPES[type];

            if (heading) {
                if (!grouped[heading]) {
                    grouped[heading] = [];
                }

                grouped[heading].push(this.formatEntry(scope, subject, hash));
            }
        }

        // Separate pass for breaking changes — needs full body.
        const { stdout: fullLog } = await execa(
            "git",
            ["log", `${fromRef}..${toRef}`, `--format=%B${DELIMITER}`],
            { cwd: this.cwd }
        );

        const fullCommits = fullLog.split(DELIMITER).filter(s => s.trim());

        for (const raw of fullCommits) {
            const lines = raw.trim().split("\n");
            const header = lines[0];
            const body = lines.slice(1).join("\n");

            const breakingMatch = body.match(/BREAKING CHANGE:\s*(.+)/s);
            if (!breakingMatch) {
                continue;
            }

            const headerMatch = HEADER_PATTERN.exec(header);
            const scope = headerMatch ? headerMatch[2] : undefined;
            const description = breakingMatch[1].trim().split("\n")[0];
            const prefix = scope ? `**${scope}:** ` : "";
            breakingChanges.push(`* ${prefix}${description}`);
        }

        const version = toRef.replace(/^v/, "");
        const date = new Date().toISOString().split("T")[0];
        const compareUrl = `${REPO_URL}/compare/${fromRef}...${toRef}`;
        const title = `# [${version}](${compareUrl}) (${date})`;

        const sections: string[] = [title];

        if (breakingChanges.length > 0) {
            sections.push(`### ${BREAKING_CHANGES}\n\n${breakingChanges.join("\n")}`);
        }

        const sectionOrder = [TYPES.feat, TYPES.fix];

        for (const heading of sectionOrder) {
            if (grouped[heading]) {
                sections.push(`### ${heading}\n\n${grouped[heading].join("\n")}`);
            }
        }

        for (const [heading, lines] of Object.entries(grouped)) {
            if (!sectionOrder.includes(heading)) {
                sections.push(`### ${heading}\n\n${lines.join("\n")}`);
            }
        }

        return sections.join("\n\n");
    }

    private formatEntry(scope: string | undefined, subject: string, hash: string): string {
        let text = scope ? `**${scope}:** ` : "";
        const prMatch = PR_PATTERN.exec(subject);

        if (prMatch) {
            const prNumber = prMatch[1];
            const subjectWithoutPr = subject.replace(PR_PATTERN, "").trim();
            text += `${subjectWithoutPr} ([#${prNumber}](${REPO_URL}/pull/${prNumber}))`;
        } else {
            text += `${subject} ([${hash.substring(0, 7)}](${REPO_URL}/commit/${hash}))`;
        }

        return `* ${text}`;
    }
}
