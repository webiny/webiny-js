import { Manager } from "~/tasks/Manager";
import { IndexManager } from "~/settings";
import { ITaskResponseResult } from "@webiny/tasks";
import {
    CreateElasticsearchIndexTaskPlugin,
    CreateElasticsearchIndexTaskPluginIndex
} from "./CreateElasticsearchIndexTaskPlugin";
import { Context } from "~/types";
import { IElasticsearchCreateIndexesTaskInput } from "~/tasks/createIndexes/types";

export class CreateIndexesTaskRunner {
    private readonly manager: Manager<IElasticsearchCreateIndexesTaskInput>;
    private readonly indexManager: IndexManager;

    public constructor(
        manager: Manager<IElasticsearchCreateIndexesTaskInput>,
        indexManager: IndexManager
    ) {
        this.manager = manager;

        this.indexManager = indexManager;
    }

    public async execute(
        matching: string | undefined,
        done: string[]
    ): Promise<ITaskResponseResult> {
        const plugins = this.manager.context.plugins.byType<
            CreateElasticsearchIndexTaskPlugin<Context>
        >(CreateElasticsearchIndexTaskPlugin.type);
        if (plugins.length === 0) {
            return this.manager.response.done("No index plugins found.");
        }
        const indexes: CreateElasticsearchIndexTaskPluginIndex[] = [];

        const tenants = await this.manager.context.tenancy.listTenants();

        for (const tenant of tenants) {
            const locales = await this.manager.context.i18n.getLocales();
            for (const locale of locales) {
                for (const plugin of plugins) {
                    const results = await plugin.getIndexList({
                        context: this.manager.context,
                        tenant: tenant.id,
                        locale: locale.code
                    });
                    for (const result of results) {
                        if (indexes.some(i => i.index === result.index)) {
                            continue;
                        }
                        indexes.push(result);
                    }
                }
            }
        }
        if (indexes.length === 0) {
            return this.manager.response.done("No indexes found.");
        }

        const isIndexAllowed = (index: string): boolean => {
            if (typeof matching !== "string" || !matching) {
                return true;
            }
            return index.includes(matching);
        };

        for (const { index, settings } of indexes) {
            if (this.manager.isAborted()) {
                return this.manager.response.aborted();
            } else if (this.manager.isCloseToTimeout()) {
                return this.manager.response.continue({
                    done
                });
            }
            try {
                if (done.includes(index)) {
                    continue;
                } else if (isIndexAllowed(index) === false) {
                    continue;
                }
                const exists = await this.indexManager.indexExists(index);
                if (exists) {
                    continue;
                }
                done.push(index);
                await this.indexManager.createIndex(index, settings);
                await this.manager.store.addInfoLog({
                    message: `Index "${index}" created.`,
                    data: {
                        index
                    }
                });
            } catch (ex) {
                await this.manager.store.addErrorLog({
                    message: `Failed to create index "${index}".`,
                    error: ex
                });
            }
        }

        return this.manager.response.done("Indexes created.", {
            done
        });
    }
}
