import { Table } from "dynamodb-toolbox";
import { DataMigrationContext, PrimaryDynamoTableSymbol } from "@webiny/data-migration";
import { queryOne, queryAll } from "~/utils";
import { createTenantEntity } from "./createTenantEntity";
import { createLegacyUserEntity, createUserEntity, getUserData } from "./createUserEntity";
import { makeInjectable, inject } from "@webiny/ioc";

export class AdminUsers_5_35_0_003 {
    private readonly newUserEntity: ReturnType<typeof createUserEntity>;
    private readonly legacyUserEntity: ReturnType<typeof createLegacyUserEntity>;
    private readonly tenantEntity: ReturnType<typeof createTenantEntity>;

    constructor(table: Table) {
        this.newUserEntity = createUserEntity(table);
        this.legacyUserEntity = createLegacyUserEntity(table);
        this.tenantEntity = createTenantEntity(table);
    }

    getId() {
        return "5.35.0-003";
    }

    getDescription() {
        return "Move admin users attributes to a `data` envelope.";
    }

    async shouldExecute({ logger }: DataMigrationContext): Promise<boolean> {
        const user = await queryOne<{ data: any }>({
            entity: this.newUserEntity,
            partitionKey: `T#root#ADMIN_USERS`,
            options: {
                index: "GSI1",
                gt: " "
            }
        });

        if (!user) {
            logger.info(`No users were found; skipping migration.`);
            return false;
        }

        if (user.data) {
            logger.info(`User records seems to be in order; skipping migration.`);
            return false;
        }

        return true;
    }

    async execute({ logger }: DataMigrationContext): Promise<void> {
        const tenants = await queryAll<{ id: string; name: string }>({
            entity: this.tenantEntity,
            partitionKey: "TENANTS",
            options: {
                index: "GSI1",
                gt: " "
            }
        });

        for (const tenant of tenants) {
            const users = await queryAll<{ id: string; email: string; data?: any }>({
                entity: this.legacyUserEntity,
                partitionKey: `T#${tenant.id}#ADMIN_USERS`,
                options: {
                    index: "GSI1",
                    gt: " "
                }
            });

            for (const user of users) {
                if (user.data) {
                    logger.info(
                        `Skipping user ${user.id} on tenant ${tenant.name} (${tenant.id}).`
                    );
                    continue;
                }

                logger.info(`Updating user ${user.id} on tenant ${tenant.name} (${tenant.id}).`);
                await this.newUserEntity.put({
                    PK: `T#${tenant.id}#ADMIN_USER#${user.id}`,
                    SK: "A",
                    GSI1_PK: `T#${tenant.id}#ADMIN_USERS`,
                    GSI1_SK: user.email,
                    TYPE: "adminUsers.user",
                    ...getUserData(user),
                    // Move all data to a `data` envelope
                    data: getUserData(user)
                });
            }
        }
    }
}

makeInjectable(AdminUsers_5_35_0_003, [inject(PrimaryDynamoTableSymbol)]);
