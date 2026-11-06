import type { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { ListFilesUseCase } from "@webiny/api-file-manager/features/file/ListFiles/index.js";
import { FileNotAuthorizedError } from "@webiny/api-file-manager/domain/file/errors.js";
import type { ListFilesInput } from "@webiny/api-file-manager/features/file/ListFiles/abstractions.js";

export interface FakeListFilesOptions {
    /** The ids the caller can read; `null` makes `ListFiles` fail as not authorized. */
    readableIds?: string[] | null;
}

export interface FakeListFilesState {
    /** Every `ListFiles` input, in order. */
    calls: ListFilesInput[];
}

/**
 * Registers a `ListFilesUseCase` that answers the files of `readableIds` matching an `entryId_in`
 * filter, in storage order (not the requested one). Every file is readable unless told otherwise.
 */
export const registerFakeListFiles = (
    container: Container,
    options: FakeListFilesOptions = {}
): FakeListFilesState => {
    const state: FakeListFilesState = { calls: [] };
    const readableIds = options.readableIds;

    container.registerInstance(ListFilesUseCase, {
        execute: async (input: ListFilesInput) => {
            state.calls.push(input);
            if (readableIds === null) {
                return Result.fail(new FileNotAuthorizedError());
            }
            const requested: string[] = input.where?.entryId_in ?? [];
            const ids = readableIds ? readableIds.filter(id => requested.includes(id)) : requested;
            const items = [...ids].reverse().map(id => ({ id }));
            return Result.ok({
                items,
                meta: { totalCount: items.length, hasMoreItems: false, cursor: null }
            });
        }
    } as unknown as ListFilesUseCase.Interface);

    return state;
};
