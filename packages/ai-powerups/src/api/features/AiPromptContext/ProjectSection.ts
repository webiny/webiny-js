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
            parts.push(
                [
                    "### Available reference files",
                    "",
                    `You have access to ${project.files.length} reference files for this project. Use the`,
                    "`read_project_file` tool to read any file when its contents are relevant",
                    "to the user's request. Read files only when needed — do not read all files",
                    "preemptively.",
                    "",
                    "Files:",
                    "",
                    ...project.files.map(file => {
                        const lines = [
                            `- id: "${file.id}"`,
                            `  name: "${file.name}"`,
                            `  description: "${file.description || "(no description)"}"`,
                            `  tokens: ~${file.tokenCount}`
                        ];
                        return lines.join("\n");
                    })
                ].join("\n")
            );
        }

        return parts.join("\n\n");
    }
}
