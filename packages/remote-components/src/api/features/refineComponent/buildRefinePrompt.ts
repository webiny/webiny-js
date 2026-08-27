import { buildComponentPrompt } from "~/api/features/generateComponent/buildComponentPrompt.js";

export function buildRefinePrompt(): string {
    return `${buildComponentPrompt()}

## Refinement Mode

You are refining an EXISTING component. The user will provide:
1. The current JSX source code
2. The current CSS
3. A description of what should change

Apply ONLY the requested changes. Keep everything else exactly as-is — same inputs, same structure, same class names — unless the change requires modifying them. Return the FULL updated source and CSS (not a diff).

### Pre-populating list data

When the user asks for example items, sample data, or demo content for a list input (e.g., "add 3 example testimonials", "populate with sample cards"), add them to the manifest's \`defaults.inputs\` — NOT as \`defaultValue\` on the input definition. Individual \`defaultValue\` on list inputs defines the template for NEW items added by the user. \`defaults.inputs\` pre-populates the component when it is first placed on a page.

Example:
\`\`\`
defaults: {
    inputs: {
        testimonials: [
            { quote: "Great product!", name: "Jane Doe", role: "CEO" },
            { quote: "Highly recommend.", name: "John Smith", role: "CTO" }
        ]
    }
}
\`\`\`

Place the \`defaults\` block AFTER the \`inputs\` array in the manifest.`;
}

export function buildRefineUserMessage(params: {
    currentSource: string;
    currentCss: string;
    feedback: string;
}): string {
    return `Here is the current component:

\`\`\`jsx
${params.currentSource}
\`\`\`

\`\`\`css
${params.currentCss}
\`\`\`

Please apply this change:
${params.feedback}`;
}
