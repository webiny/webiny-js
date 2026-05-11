import type { ResolvedPersona } from "./abstractions.js";

export class WriterPersonaSection {
    static format(persona: ResolvedPersona): string {
        let section = `### Writer Persona\n\nYou are writing as "${persona.name}": ${persona.description}`;

        if (persona.style) {
            section += `\nStyle: ${persona.style}`;
        }

        return section;
    }
}
