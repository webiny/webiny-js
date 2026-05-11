import type { ResolvedProject } from "./abstractions.js";

export class ProjectSection {
    static format(project: ResolvedProject): string {
        const hasInstructions = !!project.instructions;
        const hasFiles = project.files.length > 0;

        if (!hasInstructions && !hasFiles) {
            return "";
        }

        const parts: string[] = [`## Project: ${project.name}`];

        if (hasInstructions) {
            parts.push(project.instructions!);
        }

        if (hasFiles) {
            parts.push("### Reference files");
            for (const file of project.files) {
                parts.push(`--- ${file.name} ---\n${file.content}`);
            }
        }

        return parts.join("\n\n");
    }
}
