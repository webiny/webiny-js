import { queryAll, queryOne } from "@webiny/db-dynamodb/utils/query";
import { batchWriteAll } from "@webiny/db-dynamodb/utils/batchWrite";
import { PrerenderingSettings } from "@webiny/api-prerendering-service/types";
import { Entity } from "dynamodb-toolbox";
import { PageBuilderStorageOperations, Settings } from "~/types";
import { createSettingsEntity } from "./entities/settings";
import { createTenantEntity } from "./entities/tenant";
import { createRenderEntity } from "./entities/render";
import { createRenderLegacyEntity } from "./entities/renderLegacy";
import { createTagPathLinkEntity } from "./entities/tagPathLink";
import { createTagPathLinkLegacyEntity } from "./entities/tagPathLinkLegacy";
import { createTable } from "./table";

interface PsSettingsItem {
    data: PrerenderingSettings;
}

interface PsOldRender {
    files: unknown;
    args: {
        path: string;
        configuration: {
            meta: {
                tenant: string;
                locale: string;
                notFoundPage?: boolean;
            };
        };
    };
}

interface PsOldTagLink {
    PK: string;
    SK: string;
    TYPE: string;
    key: string;
    value: string;
    url: string;
}

export async function migrate(
    storageOperations: PageBuilderStorageOperations,
    settings: Settings["prerendering"]
) {
    // @ts-ignore
    const pbTable = storageOperations.getTable();

    const table = createTable({ documentClient: pbTable.DocumentClient });

    const settingsEntity = createSettingsEntity({
        entityName: "PrerenderingServiceSettings",
        table
    });

    const settingsItem = await queryOne<PsSettingsItem>({
        entity: settingsEntity,
        partitionKey: "PS#SETTINGS",
        options: {
            eq: "default"
        }
    });

    // If PS#SETTINGS exist, it means we already executed the migration.
    if (settingsItem) {
        return;
    }

    await settingsEntity.put({
        PK: "PS#SETTINGS",
        SK: "default",
        TYPE: "ps.settings",
        data: {
            appUrl: settings.app.url,
            bucket: settings.storage.name,
            cloudfrontId: settings.meta.cloudfront.distributionId
        }
    });

    // Load all tenants (the system might have more than 1 tenant).
    const tenantEntity = createTenantEntity({ entityName: "TenancyTenant", table });
    const childTenants = await queryAll<{ id: string }>({
        entity: tenantEntity,
        partitionKey: `T#root`,
        options: {
            index: "GSI1",
            beginsWith: "T#"
        }
    });

    // Create an array of tenant IDs, and include the `root` tenant,
    const tenants = ["root", ...childTenants.map(t => t.id)];

    for (const tenant of tenants) {
        /**
         * Migrate "ps.render" records
         */
        const renderLegacyEntity = createRenderLegacyEntity({
            entityName: "PrerenderingServiceRender",
            table
        });

        const renderEntity = createRenderEntity({ entityName: "PrerenderingServiceRender", table });

        const oldRenders = await queryAll<PsOldRender>({
            entity: renderLegacyEntity,
            partitionKey: `T#${tenant}#PS#RENDER`,
            options: {
                gt: " "
            }
        });

        const newRenders = oldRenders.map(render => {
            const { tenant, locale, notFoundPage } = render.args.configuration.meta;

            return renderEntity.putBatch({
                PK: `${render.PK}#${render.args.path}`,
                SK: "A",
                TYPE: render.TYPE,
                GSI1_PK: render.PK,
                GSI1_SK: render.args.path,
                data: {
                    files: render.files,
                    locale,
                    path: render.args.path,
                    tenant,
                    tags: notFoundPage === true ? [{ key: "notFoundPage", value: true }] : []
                }
            });
        });

        await batchWriteAll({ table, items: newRenders });

        /**
         * Migrate "ps.tagPathLink" records
         */
        const tagPathLinkEntity = createTagPathLinkEntity({
            entityName: "PrerenderingServiceTagPathLink",
            table
        });

        const tagPathLinkLegacyEntity = createTagPathLinkLegacyEntity({
            entityName: "PrerenderingServiceTagPathLink",
            table
        });

        // Create new menu tag links
        const oldMenuTagLinks = await queryAll<PsOldTagLink>({
            entity: tagPathLinkLegacyEntity,
            partitionKey: `T#${tenant}#PS#TAG#pb-menu`,
            options: {
                gt: " "
            }
        });

        const newMenuTagLinks = oldMenuTagLinks.map(link => {
            return createNewTagLink(tagPathLinkEntity, link);
        });

        await batchWriteAll({ table, items: newMenuTagLinks });

        // Create new page tag links
        const oldPageTagLinks = await queryAll<PsOldTagLink>({
            entity: tagPathLinkLegacyEntity,
            partitionKey: `T#${tenant}#PS#TAG#pb-page`,
            options: {
                gt: " "
            }
        });

        const newPageTagLinks = oldPageTagLinks.map(link => {
            return createNewTagLink(tagPathLinkEntity, link);
        });

        await batchWriteAll({ table, items: newPageTagLinks });

        // Delete old records from the database
        // await batchWriteAll({
        //     table,
        //     items: oldRenders.map(getBatchMapper(renderLegacyEntity))
        // });
        //
        // await batchWriteAll({
        //     table,
        //     items: oldMenuTagLinks.map(getBatchMapper(tagPathLinkLegacyEntity))
        // });
        //
        // await batchWriteAll({
        //     table,
        //     items: oldPageTagLinks.map(getBatchMapper(tagPathLinkLegacyEntity))
        // });
        //
        // function getBatchMapper(entity) {
        //     return item => entity.deleteBatch({ PK: item.PK, SK: item.SK });
        // }
    }

    function createNewTagLink(entity: Entity<any>, tagLink: PsOldTagLink) {
        const url = new URL(tagLink.url);
        const [, tenant] = tagLink.PK.split("#");

        return entity.putBatch({
            PK: `T#${tenant}#PS#TAG#${tagLink.key}#${tagLink.value}#${url.pathname}`,
            SK: `${tagLink.value}#${url.pathname}`,
            TYPE: "ps.tagPathLink",
            GSI1_PK: `T#${tenant}#PS#TAG`,
            GSI1_SK: `${tagLink.key}#${tagLink.value}#${url.pathname}`,
            data: {
                path: url.pathname,
                key: tagLink.key,
                value: tagLink.value,
                tenant
            }
        });
    }
}
