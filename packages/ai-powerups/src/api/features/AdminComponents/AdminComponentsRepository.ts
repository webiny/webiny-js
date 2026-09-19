import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry";
import { ListLatestEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries";
import {
    AdminComponentModelProvider,
    AdminComponentsRepository as Abstraction,
    type AdminComponent
} from "./abstractions.js";

interface AdminComponentValues {
    kind: string;
    name: string;
    description: string;
    source: string;
    enabled: boolean;
}

const toComponent = (id: string, values: Partial<AdminComponentValues>): AdminComponent => ({
    id,
    kind: values.kind ?? "",
    name: values.name ?? "",
    description: values.description ?? "",
    source: values.source ?? "",
    enabled: values.enabled !== false
});

class AdminComponentsRepositoryImpl implements Abstraction.Interface {
    constructor(
        private modelProvider: AdminComponentModelProvider.Interface,
        private createEntry: CreateEntryUseCase.Interface,
        private listEntries: ListLatestEntriesUseCase.Interface
    ) {}

    async create(params: Abstraction.CreateParams): Promise<AdminComponent> {
        const model = await this.modelProvider.get();

        const result = await this.createEntry.execute(model, {
            values: { ...params, enabled: true }
        });

        if (result.isFail()) {
            throw result.error;
        }

        return toComponent(result.value.id, result.value.values as AdminComponentValues);
    }

    async listEnabled(kind: string): Promise<AdminComponent[]> {
        const model = await this.modelProvider.get();

        const result = await this.listEntries.execute<AdminComponentValues>(model, {
            where: { values: { kind, enabled: true } },
            sort: ["createdOn_DESC"],
            limit: 100
        });

        if (result.isFail()) {
            throw result.error;
        }

        /*
         * Newest wins, one per name.
         *
         * Asking the assistant to fix a renderer writes a NEW entry rather than editing the old one,
         * which is what makes the previous version recoverable. But the admin registers renderers
         * into a map keyed by name, so without this the stale version would quietly take the name
         * back and the fix would look like it did nothing. Sorted newest-first, so the first
         * occurrence of a name is the one to keep.
         */
        const byName = new Map<string, AdminComponent>();
        for (const entry of result.value.entries) {
            const component = toComponent(entry.id, entry.values);
            if (!byName.has(component.name)) {
                byName.set(component.name, component);
            }
        }

        return Array.from(byName.values());
    }
}

export const AdminComponentsRepository = Abstraction.createImplementation({
    implementation: AdminComponentsRepositoryImpl,
    dependencies: [AdminComponentModelProvider, CreateEntryUseCase, ListLatestEntriesUseCase]
});
