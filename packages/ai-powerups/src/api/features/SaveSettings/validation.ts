import { z } from "zod";

const provider = z.object({
    name: z.string().min(1).describe("Provider name"),
    description: z.string().optional().describe("Provider description"),
    model: z.string().min(1).describe("Model ID"),
    apiKey: z.string().min(1).describe("API key")
});

const persona = z.object({
    name: z.string().min(1).describe("Persona name"),
    description: z.string().min(1).describe("Persona description, used as the AI system prompt")
});

export const saveValidation = z.object({
    providers: z.array(provider),
    personas: z.array(persona)
});
