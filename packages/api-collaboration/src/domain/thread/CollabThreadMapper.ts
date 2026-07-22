import { parseIdentifier } from "@webiny/utils/parseIdentifier.js";
import type { CmsEntry } from "@webiny/api-headless-cms/types/index.js";
import {
    CollabThreadMapper as MapperAbstraction,
    CollabThreadType,
    type ICollabThread,
    type ICollabThreadValues
} from "./abstractions.js";

class CollabThreadMapperImpl implements MapperAbstraction.Interface {
    fromCmsEntry(entry: CmsEntry<ICollabThreadValues>): ICollabThread {
        const { id } = parseIdentifier(entry.id);
        const values = entry.values;

        return {
            id,
            contentType: values.contentType,
            contentId: values.contentId,
            locator: values.locator,
            type: values.type ?? CollabThreadType.note,
            resolved: values.resolved ?? false,
            resolvedBy: values.resolvedBy ?? null,
            resolvedOn: values.resolvedOn ?? null,
            assigneeId: values.assigneeId ?? null,
            dueDate: values.dueDate ?? null,
            messages: values.messages ?? [],
            deleted: values.deleted ?? false,
            deletedBy: values.deletedBy ?? null,
            deletedOn: values.deletedOn ?? null,
            createdBy: {
                id: entry.createdBy.id,
                displayName: entry.createdBy.displayName,
                type: entry.createdBy.type
            },
            createdOn: entry.createdOn
        };
    }
}

export const CollabThreadMapper = MapperAbstraction.createImplementation({
    implementation: CollabThreadMapperImpl,
    dependencies: []
});
