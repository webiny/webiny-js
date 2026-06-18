import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import type { IElasticsearchCreateIndexesTaskInput } from "~/tasks/createIndexes/types.js";
import { CreateIndexesTaskRunner } from "~/tasks/createIndexes/CreateIndexesTaskRunner.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { ListTenantsUseCase } from "@webiny/api-core/features/tenancy/ListTenants/index.js";
import { OpensearchTenantIndexFactory } from "~/abstractions/OpensearchTenantIndexFactory.js";
import { OpenSearchClient } from "@webiny/api-opensearch/exports/api/opensearch.js";
import { DynamoDBClient } from "@webiny/db-dynamodb/exports/api/db.js";
import { Manager } from "../Manager.js";
import { IndexManager } from "~/settings/index.js";
import { OnBeforeTrigger } from "./OnBeforeTrigger.js";

class CreateIndexesTaskImpl implements TaskDefinition.Interface<IElasticsearchCreateIndexesTaskInput> {
    public readonly id = "elasticsearchCreateIndexes";
    public readonly title = "Create Missing Elasticsearch Indexes";
    public readonly maxIterations = 2;

    constructor(
        private readonly openSearchClient: OpenSearchClient.Interface,
        private readonly dynamoDBClient: DynamoDBClient.Interface,
        private readonly tenantContext: TenantContext.Interface,
        private readonly listTenantsUseCase: ListTenantsUseCase.Interface,
        private readonly indexFactories: OpensearchTenantIndexFactory.Interface[]
    ) {}

    async run({
        input,
        controller
    }: TaskDefinition.RunParams<IElasticsearchCreateIndexesTaskInput>) {
        if (controller.runtime.isAborted()) {
            return controller.response.aborted();
        }

        const manager = new Manager<IElasticsearchCreateIndexesTaskInput>({
            elasticsearchClient: this.openSearchClient.use(),
            documentClient: this.dynamoDBClient.client,
            controller
        });

        const indexManager = new IndexManager(manager.elasticsearch, {});

        const createIndexesTaskRunner = new CreateIndexesTaskRunner(
            this.tenantContext,
            this.listTenantsUseCase,
            this.indexFactories,
            manager,
            indexManager
        );

        return createIndexesTaskRunner.execute(input.matching, Array.from(input.done || []));
    }

    async onBeforeTrigger() {
        const indexManager = new IndexManager(this.openSearchClient.use(), {});

        const onBeforeTrigger = new OnBeforeTrigger(
            indexManager,
            this.tenantContext,
            this.indexFactories
        );
        await onBeforeTrigger.run(["wbytask"]);
    }
}

export const CreateIndexesTask = TaskDefinition.createImplementation({
    implementation: CreateIndexesTaskImpl,
    dependencies: [
        OpenSearchClient,
        DynamoDBClient,
        TenantContext,
        ListTenantsUseCase,
        [OpensearchTenantIndexFactory, { multiple: true }]
    ]
});
