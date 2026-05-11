import type { ResolvedPersona } from "./abstractions.js";

export class ReaderPersonaSection {
    static format(persona: ResolvedPersona): string {
        let section = `### Reader Persona (Target Audience)\n\nYou are writing for "${persona.name}": ${persona.description}`;

        if (persona.style) {
            section += `\nExpected tone/style: ${persona.style}`;
        }

        return section;
    }
}
