# PRD: In-Browser AI Assistant via WebLLM

## Summary

Integrate `@mlc-ai/web-llm` into the existing React app to add a privacy-preserving AI assistant that runs entirely in the user's browser via WebGPU. The assistant has access to the app's existing tool functions, defined as Zod v4 schemas, and uses OpenAI-compatible function calling to invoke them.

No backend, no API keys, no per-request cost. The model downloads once on first use and is cached in IndexedDB for subsequent sessions.

## Goals

- Add a working AI assistant UI to the app that can call into the app's existing tool functions.
- Keep all inference local to the browser. No user data should leave the device.
- Use the existing Zod v4 schemas as the single source of truth for tool definitions — no hand-written JSON Schema duplication.
- Keep inference off the main thread so the UI stays responsive during generation.
- Surface model download progress clearly so the first-load experience doesn't feel broken.

## Non-Goals

- Multi-modal inputs (images, audio). Text only for v1.
- Streaming responses. Get the non-streaming agent loop solid first; streaming can come later.
- Remote/hosted model fallback. If WebGPU is unavailable, show a clear message rather than silently degrading.
- Conversation persistence across sessions. In-memory history only for v1.
- Custom model compilation. Use a prebuilt model from WebLLM's registry.

## Model Selection

**Primary: `Hermes-2-Pro-Mistral-7B-q4f16_1-MLC`** (~4 GB)

Chosen because Hermes-2-Pro is explicitly fine-tuned for function calling and structured output, and is the model the WebLLM team validates their function-calling example against. Reliably emits proper `tool_calls` rather than hallucinating JSON in the content field.

**Fallback for low-end devices: `Llama-3.2-3B-Instruct-q4f16_1-MLC`** (~2 GB)

Offer this as a user-selectable option if first-load size is a concern. Trained for on-device tool calling, less reliable on complex/ambiguous calls but acceptable for well-defined tool sets.

## Browser Requirements

- WebGPU support required. Detect `navigator.gpu` on mount; show a friendly fallback page if absent.
- Sufficient device memory — flag a warning on devices reporting `navigator.deviceMemory < 4`.
- Modern Chrome, Edge, or Brave. Safari and Firefox WebGPU support is gated/experimental — detect and warn.

## Architecture

### Web Worker for Inference

All model inference runs in a dedicated Web Worker via `WebWorkerMLCEngine`. The main thread only sends messages and receives results. This is non-negotiable — running inference on the main thread freezes the UI during generation.

### File Layout

```
src/
  llm/
    worker.ts           # WebWorkerMLCEngineHandler
    useLLM.ts           # React hook owning the engine
    chat.ts             # Agent loop (tool-calling)
    tools.ts            # Tool registry (Zod schemas + implementations)
    config.ts           # Model IDs, system prompt, constants
  components/
    Assistant.tsx       # Chat UI component
    ModelLoader.tsx     # Progress UI during first download
    WebGPUGate.tsx      # Capability check + fallback message
```

### Tool Registry Pattern

Tools are defined as a single typed registry keyed by tool name. Each entry contains:

- `description`: string passed to the model
- `schema`: Zod v4 schema for arguments
- `impl`: async function that executes the tool

The `tools` array sent to the engine is derived from this registry via `z.toJSONSchema()` (Zod v4 built-in). The agent loop uses the same registry to validate and dispatch tool calls.

This pattern means adding a new tool is a single object literal — no duplication between the schema, the JSON Schema for the model, and the dispatch logic.

### Agent Loop

Standard OpenAI-style loop, capped at 5 iterations to prevent runaway tool chains:

1. Send `messages` + `tools` + `tool_choice: "auto"` to the engine.
2. If response has no `tool_calls`, return the assistant message as the final reply.
3. Otherwise, for each tool call:
   - Look up the tool in the registry.
   - `safeParse` the arguments against the Zod schema.
   - If invalid, append the validation errors as the tool result so the model can self-correct.
   - If valid, execute the implementation and append the result.
4. Loop.

The `safeParse` step matters — even Hermes-2-Pro occasionally produces arguments that nearly-but-don't-quite match. Returning validation errors to the model lets it retry rather than crashing the app.

## UX Requirements

### First Load

- Show a dedicated `ModelLoader` view with the progress text from `initProgressCallback`.
- Communicate clearly that this is a one-time download and the model is cached locally.
- Show estimated download size (~4 GB for the primary model).
- Don't allow the chat UI to be opened until `ready === true`.

### Steady State

- Display a "thinking" indicator while the agent loop is running.
- When a tool is invoked, surface this to the user in a subtle way (e.g., a chip showing "called `add_todo`") — helps debugging and builds trust.
- Show errors inline in the chat if the tool loop hits its iteration cap or an unrecoverable error occurs.

### WebGPU Unavailable

- Detect on mount.
- Show a clear page explaining the requirement and which browsers work.
- Do not attempt to instantiate the engine.

## Tools to Implement (v1)

> _Replace this section with the actual tools the app needs to expose. The list below is a placeholder showing the expected shape._

Each tool defined as:

```ts
toolName: {
  description: "What this tool does, written for the model.",
  schema: z.object({ /* Zod v4 schema, with .describe() on every field */ }),
  impl: async (args) => { /* call into existing app code */ },
}
```

Initial tools to wire up:

- `get_user_todos` — fetch current user's todo list
- `add_todo` — add a new todo item
- _(extend with the actual app's tools)_

## Implementation Tasks

1. Add `@mlc-ai/web-llm` dependency.
2. Create `src/llm/worker.ts` with `WebWorkerMLCEngineHandler`.
3. Create `src/llm/config.ts` with model ID and system prompt.
4. Create `src/llm/tools.ts` with the typed tool registry and `tools` derivation via `z.toJSONSchema()`.
5. Create `src/llm/chat.ts` implementing the agent loop with Zod `safeParse` validation.
6. Create `src/llm/useLLM.ts` hook that instantiates `CreateWebWorkerMLCEngine` and exposes `{ engine, progress, ready, error }`.
7. Create `src/components/WebGPUGate.tsx` for capability detection.
8. Create `src/components/ModelLoader.tsx` for first-load progress UI.
9. Create `src/components/Assistant.tsx` for the chat UI.
10. Wire the assistant into the app shell behind a feature flag.
11. Verify the worker import syntax works with the project's bundler — see Bundler Notes below.

## Bundler Notes

Worker instantiation uses `new Worker(new URL("./worker.ts", import.meta.url), { type: "module" })`. This works natively in Vite. For Next.js, ensure the worker file is in the client bundle. For CRA, this requires craco or ejection — confirm before starting.

## Acceptance Criteria

- [ ] User can open the assistant, see a clear download progress UI on first visit, and chat once the model is ready.
- [ ] On a return visit, the model loads from IndexedDB cache without re-downloading.
- [ ] The assistant can invoke at least two distinct tools and correctly chain results into a final response.
- [ ] Invalid tool arguments produced by the model trigger Zod validation, are returned to the model as a tool error, and the model self-corrects on its next turn.
- [ ] UI remains responsive (scrolling, typing into other inputs) during generation.
- [ ] On a browser without WebGPU, the user sees the fallback page rather than a crash or hang.
- [ ] Adding a new tool requires changes to exactly one file (`tools.ts`).

## Open Questions

- Which actual tools should be exposed in v1? (List in `tools.ts`.)
- What's the preferred system prompt? (Tone, persona, refusal behavior, etc.)
- Should the assistant be gated behind a setting, or always available?
- Do we want a "model picker" in v1, or hardcode Hermes-2-Pro and add a picker later?

## Future Work

- Streaming responses (`stream: true`) with incremental `delta.tool_calls` handling.
- Conversation persistence (IndexedDB).
- Multi-model support with user-selectable size/quality tradeoff.
- Telemetry on tool-call success rates to identify schemas that need tightening.
