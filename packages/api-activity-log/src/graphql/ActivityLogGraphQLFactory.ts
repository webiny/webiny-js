import { GraphQLSchemaBuilder } from "@webiny/api-graphql/features/GraphQLSchemaBuilder/abstractions";
import { CoreGraphQLSchemaFactory } from "@webiny/api-graphql/graphql/abstractions.core.js";
import { ErrorResponse, ListResponse } from "@webiny/api-graphql/responses.js";
import { ListActivityUseCase } from "~/features/listActivity/index.js";
import { ActivitySummaryConfig } from "~/cms/summary/config.js";
import { isSummaryPending, type ActivityRecord } from "~/core/types.js";

interface IListActivityArgs {
    targetType: string;
    targetId: string;
    modelId: string;
    revision?: string;
    actorId?: string;
    limit?: number;
    after?: string | null;
}

/**
 * The activity timeline query, on the core admin schema.
 *
 * **Manage-side only, by construction rather than by a conditional.** The CMS read and preview
 * endpoints are separate schemas built by the CMS itself; a query registered here cannot appear on
 * them. That matters because those endpoints serve published content to consumers, frequently with
 * a public API key, and activity is internal editorial metadata about who did what. Exposing it
 * there would be a leak nobody granted deliberately.
 *
 * `targetType` and `targetId` rather than an entry id, as the brief specifies. `modelId` is
 * additional and unavoidable: authorisation runs `canAccessEntry({ model })`, and the model cannot
 * be derived from a bare target id without first reading the entry, which is the thing being
 * authorised.
 */
export class ActivityLogGraphQL implements CoreGraphQLSchemaFactory.Interface {
    public async execute(
        builder: GraphQLSchemaBuilder.Interface
    ): Promise<GraphQLSchemaBuilder.Interface> {
        builder.addTypeDefs(`
            type ActivityLogError {
                message: String!
                code: String
                data: JSON
            }

            type ActivityLogActor {
                id: String!
                type: String!
                displayName: String
            }

            type ActivityLogChange {
                """
                Fully qualified path from the target root. Never a value — this feature records
                which fields changed, never what they changed to.
                """
                path: String!
                """
                The field's label as it read when the change was recorded, so an old record stays
                legible after the model is renamed.
                """
                label: String!
                """
                Set only for structural changes: added, removed, moved or replaced.
                """
                operation: String
            }

            type ActivityLogSubject {
                id: String!
                label: String!
            }

            type ActivityLogRecord {
                id: ID!
                targetType: String!
                targetId: String!
                revision: String!
                timestamp: DateTime!
                """
                Empty when the reader lacks the activityLog.actor permission. The record is still
                returned: hiding it would imply nothing happened.
                """
                actor: ActivityLogActor!
                action: String!
                source: String!
                """
                Shared by every record one operation produced, so a bulk action groups.
                """
                correlationId: String!
                changeset: [ActivityLogChange!]!
                """
                True when more fields changed than the record lists, and the remainder were rolled
                up to a common parent.
                """
                truncated: Boolean!
                """
                The part of the target the action concerned, such as a workflow step.
                """
                subject: ActivityLogSubject
                """
                Whether a note was attached to a review decision. The note itself is never stored.
                """
                hasNote: Boolean
                """
                A sentence describing what changed in this save, when there is one. Null where a
                save had nothing to describe — a publish, a move, a purely structural edit — and a
                client must still render the description it derives from the changeset, never
                treating this as the only thing it has to say.

                Unlike the changeset, a summary may quote content: it describes what the text now
                says, so a fragment of that text can appear in it.
                """
                summary: String
                """
                How the summary was produced: "deterministic" for one rendered from the recorded
                values, "ai" for one written by a model. Null when there is no summary.

                Worth acting on rather than logging. A rendered summary is a restatement of what
                was recorded; a model's is prose that can be wrong, and a client should say so.
                """
                summaryKind: String
                """
                The run of saves this record belongs to.

                Never null: a save that joined a run carries that run's id, and a save that did not
                carries its own, so every record has exactly one run and a client needs no special
                case for the records that were never summarised — which is most of them.

                It is what a client groups by. Position is not a substitute: a row collapses on an
                hour and a run debounces on a minute, so one row routinely holds several runs.
                """
                summaryRunId: ID!
                """
                True while a summary is being generated for this record. False once it has
                settled, with or without one — and false again once it has been waiting too long,
                because a job can fail to run at all and a row that promises a sentence forever is
                worse than one that promises nothing.

                A client may poll while this is true and stop when it goes false; it goes false on
                its own either way.
                """
                summaryPending: Boolean!
            }

            type ActivityLogListMeta {
                """
                Opaque. Pass it back as "after" to fetch the next page; do not parse it. Each
                storage implementation defines its own format.
                """
                cursor: String
                hasMoreItems: Boolean!
            }

            type ActivityLogListResponse {
                data: [ActivityLogRecord!]
                meta: ActivityLogListMeta
                error: ActivityLogError
            }

            extend type Query {
                """
                The activity timeline for one target, newest first. Requires the
                activityLog.timeline permission and read access to the target.
                """
                listActivityLog(
                    targetType: String!
                    targetId: String!
                    modelId: String!
                    revision: String
                    actorId: String
                    limit: Int
                    after: String
                ): ActivityLogListResponse!
            }
        `);

        builder.addResolver<IListActivityArgs>({
            path: "Query.listActivityLog",
            dependencies: [ListActivityUseCase, ActivitySummaryConfig],
            resolver:
                (
                    listActivity: ListActivityUseCase.Interface,
                    config: ActivitySummaryConfig.Interface
                ) =>
                async ({ args }) => {
                    const result = await listActivity.execute({
                        target: {
                            type: args.targetType as "cms-entry",
                            id: args.targetId
                        },
                        modelId: args.modelId,
                        revision: args.revision,
                        actorId: args.actorId,
                        limit: args.limit,
                        cursor: args.after ?? null
                    });

                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }

                    return new ListResponse(
                        result.value.records.map(record =>
                            toGraphQL(record, config.pendingGraceMs)
                        ),
                        {
                            cursor: result.value.cursor,
                            hasMoreItems: result.value.hasMore
                        }
                    );
                }
        });

        return builder;
    }
}

const toGraphQL = (record: ActivityRecord, pendingGraceMs: number) => ({
    id: record.id,
    targetType: record.targetType,
    targetId: record.targetId,
    revision: record.revision,
    timestamp: record.timestamp,
    actor: record.actor,
    action: record.action,
    source: record.source,
    correlationId: record.correlationId,
    changeset: record.changeset,
    truncated: record.truncated,
    subject: record.subject ?? null,
    hasNote: record.hasNote ?? null,
    summary: record.summary ?? null,
    summaryKind: record.summaryKind ?? null,
    // Resolved here rather than stored: a record cannot know its own id at the moment it is
    // written, and a client that had to fall back for itself would be one client away from
    // grouping the unsummarised majority wrongly.
    summaryRunId: record.summaryRunId ?? record.id,
    summaryPending: isSummaryPending(record, { graceMs: pendingGraceMs })
});

export const ActivityLogGraphQLFactory = CoreGraphQLSchemaFactory.createImplementation({
    implementation: ActivityLogGraphQL,
    dependencies: []
});
