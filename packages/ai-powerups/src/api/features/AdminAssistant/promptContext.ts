import type { AiPromptContextBuilder } from "~/api/features/AiPromptContext/index.js";
import type { ProjectFileContent } from "~/api/features/AiPromptContext/index.js";
import { isRecord } from "./clientTools/isRecord.js";

/**
 * The composer control the page editor adds: which project, reader persona and writer persona the
 * assistant writes for, and files attached for it to read.
 */
export const PROMPT_CONTEXT_CONTROL = "promptContext";

/** Attached files are listed in every request's instructions, so keep the list short. */
const MAX_ATTACHED_FILES = 10;

const MAX_ID_LENGTH = 100;

const idOf = (value: unknown): string | undefined => {
    if (typeof value !== "string" || !value || value.length > MAX_ID_LENGTH) {
        return undefined;
    }
    return value;
};

/**
 * Reads the control's value from the request's `controls`. Anything malformed is dropped rather
 * than refused: the question is still worth answering, only without the chosen voice.
 */
export const parsePromptContext = (
    controls: Record<string, unknown> | undefined
): AiPromptContextBuilder.Params | undefined => {
    const value = controls?.[PROMPT_CONTEXT_CONTROL];
    if (!isRecord(value)) {
        return undefined;
    }

    const files = Array.isArray(value["additionalFileIds"]) ? value["additionalFileIds"] : [];
    const additionalFileIds = files
        .map(idOf)
        .filter((id): id is string => !!id)
        .slice(0, MAX_ATTACHED_FILES);

    const params: AiPromptContextBuilder.Params = {
        projectId: idOf(value["projectId"]) ?? null,
        readerPersonaId: idOf(value["readerPersonaId"]) ?? null,
        writerPersonaId: idOf(value["writerPersonaId"]) ?? null,
        additionalFileIds
    };

    const empty =
        !params.projectId &&
        !params.readerPersonaId &&
        !params.writerPersonaId &&
        additionalFileIds.length === 0;
    return empty ? undefined : params;
};

/**
 * The files the user attached, listed for the model like a project's reference files: by id, read
 * with `read_project_file` when relevant. Their contents are not inlined, since the list is sent
 * again with every question in the chat.
 */
export const describeAttachedFiles = (files: ProjectFileContent[]): string => {
    if (files.length === 0) {
        return "";
    }

    const lines = files.map(file => `- id: "${file.id}", name: "${file.name}"`);
    return [
        "## Files the user attached",
        "",
        "The user attached these files for you to work from. Read one with the `read_project_file` tool when it is relevant to the request.",
        "",
        ...lines
    ].join("\n");
};
