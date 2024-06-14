import { PluginsContainer } from "@webiny/plugins";
import { CmsEntry, CmsModelFieldToGraphQLPlugin } from "@webiny/api-headless-cms/types";
import { GenericRecord } from "@webiny/api/types";
import { ContentEntryTraverser } from "@webiny/api-headless-cms/utils/contentEntryTraverser/ContentEntryTraverser";

interface IAsset {
    id?: string;
    key?: string;
    src: string;
}

interface IEntryAssets {
    findAssets(entry: CmsEntry): IAsset[];
}

interface IEntryAssetsParams {
    traverser: ContentEntryTraverser;
    plugins: PluginsContainer;
}

const erroredPlugins = new Set<string>();

export class EntryAssets implements IEntryAssets {
    private readonly traverser: ContentEntryTraverser;
    private readonly plugins: GenericRecord<string, CmsModelFieldToGraphQLPlugin>;

    public constructor(params: IEntryAssetsParams) {
        this.traverser = params.traverser;
        this.plugins = params.plugins
            .byType<CmsModelFieldToGraphQLPlugin>("cms-model-field-to-graphql")
            .reduce<GenericRecord<string, CmsModelFieldToGraphQLPlugin>>((collection, plugin) => {
                collection[plugin.fieldType] = plugin;
                return collection;
            }, {});
    }

    public findAssets(entry: Pick<CmsEntry, "values">): IAsset[] {
        const assets: IAsset[] = [];

        this.traverser.traverse(entry.values, ({ field, value }) => {
            if (field.type !== "file" || !value) {
                return;
            } else if (field.multipleValues && Array.isArray(value)) {
                assets.push(
                    ...value.filter(Boolean).map(src => {
                        return {
                            src
                        };
                    })
                );
                return;
            } else if (typeof value !== "string") {
                return;
            }
            assets.push({
                src: value
            });
        });
        return assets;
    }

    private getPlugin(fieldType: string): CmsModelFieldToGraphQLPlugin | null {
        const plugin = this.plugins[fieldType];
        if (plugin) {
            return plugin;
        } else if (erroredPlugins.has(fieldType)) {
            return null;
        }
        console.error(
            `Missing plugin for field type "${fieldType}". Continuing with asset extraction without this field.`
        );
        erroredPlugins.add(fieldType);
        return null;
    }
}
