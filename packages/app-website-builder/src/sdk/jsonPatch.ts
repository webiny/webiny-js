import type { Operation, Validator, PatchResult } from "fast-json-patch";
// @ts-expect-error We need this hack.
import * as fjp from "fast-json-patch/index.mjs";

export type { Operation as JsonPatchOperation, PatchResult as JsonPatchResult };

export const jsonPatch = {
    compare: (tree1: object | any[], tree2: object | any[], invertible?: boolean): Operation[] => {
        return fjp.compare(tree1, tree2, invertible);
    },
    applyPatch: <T>(
        document: T,
        patch: Operation[],
        validateOperation?: boolean | Validator<T>,
        mutateDocument?: boolean,
        banPrototypeModifications?: boolean
    ): PatchResult<T> => {
        return fjp.applyPatch(
            document,
            patch,
            validateOperation,
            mutateDocument,
            banPrototypeModifications
        );
    }
};
