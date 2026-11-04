import { parseIdentifier } from "@webiny/utils/parseIdentifier.js";
import type { CmsEntry } from "@webiny/api-headless-cms/types/index.js";
import {
    NotificationMapper as MapperAbstraction,
    NotificationType,
    type INotification,
    type INotificationValues
} from "./abstractions.js";

class NotificationMapperImpl implements MapperAbstraction.Interface {
    fromCmsEntry(entry: CmsEntry<INotificationValues>): INotification {
        const { id } = parseIdentifier(entry.id);
        const values = entry.values;

        return {
            id,
            recipientId: values.recipientId,
            type: values.type ?? NotificationType.mention,
            actor: values.actor,
            title: values.title,
            snippet: values.snippet ?? null,
            link: values.link ?? null,
            read: values.read ?? false,
            readOn: values.readOn ?? null,
            archived: values.archived ?? false,
            archivedOn: values.archivedOn ?? null,
            createdOn: entry.createdOn
        };
    }
}

export const NotificationMapper = MapperAbstraction.createImplementation({
    implementation: NotificationMapperImpl,
    dependencies: []
});
