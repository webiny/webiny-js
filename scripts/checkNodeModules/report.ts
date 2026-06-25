import type { DuplicateGroup, WorkspaceViolation } from "./types.js";

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const MAGENTA = "\x1b[35m";

function versionTag(version: string, isRoot: boolean): string {
    if (isRoot) {
        return `${GREEN}${version}${RESET}`;
    }
    return `${YELLOW}${version}${RESET}`;
}

function sectionSeparator(): string {
    return `${DIM}${"─".repeat(70)}${RESET}`;
}

export function formatReport(groups: DuplicateGroup[]): string {
    const lines: string[] = [];

    const totalPackages = groups.length;
    const totalInstances = groups.reduce(
        (sum, group) =>
            sum + group.nested.reduce((innerSum, nested) => innerSum + nested.parents.length, 0),
        0
    );
    const noRootGroups = groups.filter(group => group.rootVersion === null);
    const mismatchGroups = groups.filter(
        group =>
            group.rootVersion !== null &&
            group.nested.some(nested => nested.version !== group.rootVersion)
    );
    const sameVersionGroups = groups.filter(
        group =>
            group.rootVersion !== null &&
            group.nested.every(nested => nested.version === group.rootVersion)
    );

    lines.push("");
    lines.push(`${BOLD}${CYAN}Nested node_modules report${RESET}`);
    lines.push(sectionSeparator());
    lines.push(
        `  ${BOLD}${totalPackages}${RESET} duplicated packages, ${BOLD}${totalInstances}${RESET} nested copies total`
    );
    lines.push(
        `  ${RED}${BOLD}${mismatchGroups.length}${RESET} version mismatches  ${DIM}│${RESET}  ${YELLOW}${BOLD}${sameVersionGroups.length}${RESET} same-version duplicates  ${DIM}│${RESET}  ${MAGENTA}${BOLD}${noRootGroups.length}${RESET} nested-only`
    );
    lines.push("");

    if (mismatchGroups.length > 0) {
        lines.push(
            `${BOLD}${RED}VERSION MISMATCHES${RESET}  ${DIM}(nested version differs from root)${RESET}`
        );
        lines.push(sectionSeparator());

        for (const group of mismatchGroups) {
            lines.push("");
            lines.push(`  ${BOLD}${group.packageName}${RESET}`);
            lines.push(`  root: ${versionTag(group.rootVersion!, true)}`);

            for (const nested of group.nested) {
                const marker = nested.version === group.rootVersion ? DIM : RED;
                lines.push(
                    `  ${marker}${nested.version}${RESET} ${DIM}←${RESET} ${nested.parents.join(`${DIM},${RESET} `)}`
                );
            }
        }
        lines.push("");
    }

    if (sameVersionGroups.length > 0) {
        lines.push(
            `${BOLD}${YELLOW}SAME-VERSION DUPLICATES${RESET}  ${DIM}(version matches root but installed again — hoisting conflict)${RESET}`
        );
        lines.push(sectionSeparator());

        for (const group of sameVersionGroups) {
            const parentCount = group.nested.reduce(
                (sum, nested) => sum + nested.parents.length,
                0
            );
            const allParents = group.nested.flatMap(nested => nested.parents);

            lines.push(
                `  ${DIM}${group.packageName}${RESET} ${GREEN}${group.rootVersion}${RESET}  ${DIM}(${parentCount}×)${RESET}  ${DIM}← ${allParents.join(", ")}${RESET}`
            );
        }
        lines.push("");
    }

    if (noRootGroups.length > 0) {
        lines.push(
            `${BOLD}${MAGENTA}NESTED-ONLY${RESET}  ${DIM}(not in root node_modules — only exists nested)${RESET}`
        );
        lines.push(sectionSeparator());

        for (const group of noRootGroups) {
            for (const nested of group.nested) {
                lines.push(
                    `  ${DIM}${group.packageName}${RESET} ${MAGENTA}${nested.version}${RESET}  ${DIM}← ${nested.parents.join(", ")}${RESET}`
                );
            }
        }
        lines.push("");
    }

    return lines.join("\n");
}

export function formatWorkspaceReport(violations: WorkspaceViolation[]): string {
    const lines: string[] = [];

    if (violations.length === 0) {
        lines.push(
            `${BOLD}${GREEN}WORKSPACES${RESET}  ${DIM}no nested packages found — all clean${RESET}`
        );
        lines.push(sectionSeparator());
        lines.push("");
        return lines.join("\n");
    }

    const byWorkspace = new Map<string, WorkspaceViolation[]>();
    for (const violation of violations) {
        if (!byWorkspace.has(violation.workspace)) {
            byWorkspace.set(violation.workspace, []);
        }
        byWorkspace.get(violation.workspace)!.push(violation);
    }

    lines.push(
        `${BOLD}${RED}WORKSPACE VIOLATIONS${RESET}  ${DIM}(packages nested inside workspace node_modules — should be hoisted to root)${RESET}`
    );
    lines.push(sectionSeparator());

    for (const [workspace, workspaceViolations] of byWorkspace) {
        lines.push("");
        lines.push(
            `  ${BOLD}${workspace}/${RESET}  ${DIM}(${workspaceViolations.length} packages)${RESET}`
        );

        for (const violation of workspaceViolations) {
            lines.push(
                `  ${RED}${violation.packageName}${RESET} ${DIM}${violation.version}${RESET}`
            );
        }
    }

    lines.push("");

    return lines.join("\n");
}
