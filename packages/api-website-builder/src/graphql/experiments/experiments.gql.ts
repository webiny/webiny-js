import { GraphQLSchemaPlugin, NotFoundError } from "@webiny/handler-graphql";
import { ensureAuthentication } from "~/utils/ensureAuthentication.js";
import { resolve } from "~/utils/resolve.js";
import { experimentsTypeDefs } from "~/graphql/experiments/experiments.typeDefs.js";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";
import { CONTROL_VARIANT_ID } from "~/domain/experiment/abstractions.js";
import type { WbExperiment } from "~/domain/experiment/abstractions.js";
import type { WbVariant } from "~/domain/variant/abstractions.js";
import { CreateExperimentUseCase } from "~/features/experiments/CreateExperiment/index.js";
import { UpdateExperimentUseCase } from "~/features/experiments/UpdateExperiment/index.js";
import { GetExperimentByIdUseCase } from "~/features/experiments/GetExperimentById/index.js";
import { ListExperimentsUseCase } from "~/features/experiments/ListExperiments/index.js";
import { GetActiveExperimentForRevisionUseCase } from "~/features/experiments/GetActiveExperimentForRevision/index.js";
import { StartExperimentUseCase } from "~/features/experiments/StartExperiment/index.js";
import { StopExperimentUseCase } from "~/features/experiments/StopExperiment/index.js";
import { GraduateVariantUseCase } from "~/features/experiments/GraduateVariant/index.js";
import { GetActiveExperimentForPathUseCase } from "~/features/experiments/GetActiveExperimentForPath/index.js";
import { CreateVariantUseCase } from "~/features/variants/CreateVariant/index.js";
import { UpdateVariantUseCase } from "~/features/variants/UpdateVariant/index.js";
import { DeleteVariantUseCase } from "~/features/variants/DeleteVariant/index.js";
import { GetVariantByIdUseCase } from "~/features/variants/GetVariantById/index.js";
import { ListVariantsUseCase } from "~/features/variants/ListVariants/index.js";

const mapExperiment = (experiment: WbExperiment) => ({
    id: experiment.id,
    entryId: experiment.entryId,
    pageEntryId: experiment.pageEntryId,
    baselineRevisionId: experiment.baselineRevisionId,
    status: experiment.status,
    name: experiment.name,
    trafficSplit: experiment.trafficSplit,
    targeting: experiment.targeting,
    goals: experiment.goals,
    analytics: experiment.analytics,
    startedOn: experiment.startedOn,
    stoppedOn: experiment.stoppedOn,
    winningVariantId: experiment.winningVariantId,
    createdOn: experiment.createdOn,
    savedOn: experiment.savedOn,
    createdBy: experiment.createdBy
});

const mapVariant = (variant: WbVariant) => ({
    id: variant.id,
    entryId: variant.entryId,
    experimentId: variant.experimentId,
    name: variant.name,
    status: variant.status,
    properties: variant.properties,
    metadata: variant.metadata,
    bindings: variant.bindings,
    elements: variant.elements,
    extensions: variant.extensions,
    createdOn: variant.createdOn,
    savedOn: variant.savedOn
});

export const createExperimentsSchema = () => {
    const schema = new GraphQLSchemaPlugin<ApiCoreContext>({
        typeDefs: experimentsTypeDefs,
        resolvers: {
            WbQuery: {
                getExperiment: async (_, { id }, context) => {
                    return resolve(async () => {
                        ensureAuthentication(context);
                        const useCase = context.container.resolve(GetExperimentByIdUseCase);
                        const result = await useCase.execute(id);
                        if (result.isFail()) {
                            throw new NotFoundError(`Experiment "${id}" was not found!`);
                        }
                        return mapExperiment(result.value);
                    });
                },
                getActiveExperiment: async (_, { revisionId }, context) => {
                    return resolve(async () => {
                        ensureAuthentication(context);
                        const useCase = context.container.resolve(
                            GetActiveExperimentForRevisionUseCase
                        );
                        const result = await useCase.execute(revisionId);
                        if (result.isFail()) {
                            throw new Error(result.error.message);
                        }
                        return result.value ? mapExperiment(result.value) : null;
                    });
                },
                listExperiments: async (_, { pageEntryId }, context) => {
                    return resolve(async () => {
                        ensureAuthentication(context);
                        const useCase = context.container.resolve(ListExperimentsUseCase);
                        const result = await useCase.execute({ pageEntryId });
                        if (result.isFail()) {
                            throw new Error(result.error.message);
                        }
                        return result.value.map(mapExperiment);
                    });
                },
                getVariant: async (_, { id }, context) => {
                    return resolve(async () => {
                        ensureAuthentication(context);
                        const useCase = context.container.resolve(GetVariantByIdUseCase);
                        const result = await useCase.execute(id);
                        if (result.isFail()) {
                            throw new NotFoundError(`Variant "${id}" was not found!`);
                        }
                        return mapVariant(result.value);
                    });
                },
                listVariants: async (_, { experimentId }, context) => {
                    return resolve(async () => {
                        ensureAuthentication(context);
                        const useCase = context.container.resolve(ListVariantsUseCase);
                        const result = await useCase.execute({ experimentId });
                        if (result.isFail()) {
                            throw new Error(result.error.message);
                        }
                        return result.value.map(mapVariant);
                    });
                },
                getPageExperiment: async (_, { path }, context) => {
                    return resolve(async () => {
                        ensureAuthentication(context);
                        const useCase = context.container.resolve(
                            GetActiveExperimentForPathUseCase
                        );
                        const result = await useCase.execute(path);
                        if (result.isFail()) {
                            throw new Error(result.error.message);
                        }
                        const active = result.value;
                        if (!active) {
                            return null;
                        }
                        return {
                            experimentId: active.experiment.id,
                            revisionId: active.revisionId,
                            pageEntryId: active.pageEntryId,
                            path: active.path,
                            status: active.experiment.status,
                            tenantId: active.experiment.tenant,
                            controlVariantId: CONTROL_VARIANT_ID,
                            trafficSplit: active.experiment.trafficSplit,
                            targeting: active.experiment.targeting,
                            analytics: active.experiment.analytics,
                            variants: active.variants.map(variant => ({
                                variantId: variant.id,
                                name: variant.name
                            }))
                        };
                    });
                },
                getVariantContent: async (_, { id }, context) => {
                    return resolve(async () => {
                        ensureAuthentication(context);
                        const useCase = context.container.resolve(GetVariantByIdUseCase);
                        const result = await useCase.execute(id);
                        if (result.isFail()) {
                            throw new NotFoundError(`Variant "${id}" was not found!`);
                        }
                        const variant = result.value;
                        return {
                            id: variant.entryId,
                            properties: variant.properties,
                            bindings: variant.bindings,
                            elements: variant.elements,
                            extensions: variant.extensions,
                            metadata: variant.metadata
                        };
                    });
                }
            },
            WbMutation: {
                createExperiment: async (_, { data }, context) => {
                    return resolve(async () => {
                        ensureAuthentication(context);
                        const useCase = context.container.resolve(CreateExperimentUseCase);
                        const result = await useCase.execute(data);
                        if (result.isFail()) {
                            throw new Error(result.error.message);
                        }
                        return mapExperiment(result.value);
                    });
                },
                updateExperiment: async (_, { id, data }, context) => {
                    return resolve(async () => {
                        ensureAuthentication(context);
                        const useCase = context.container.resolve(UpdateExperimentUseCase);
                        const result = await useCase.execute({ id, data });
                        if (result.isFail()) {
                            throw new Error(result.error.message);
                        }
                        return mapExperiment(result.value);
                    });
                },
                startExperiment: async (_, { id }, context) => {
                    return resolve(async () => {
                        ensureAuthentication(context);
                        const useCase = context.container.resolve(StartExperimentUseCase);
                        const result = await useCase.execute({ id });
                        if (result.isFail()) {
                            throw new Error(result.error.message);
                        }
                        return mapExperiment(result.value);
                    });
                },
                stopExperiment: async (_, { id }, context) => {
                    return resolve(async () => {
                        ensureAuthentication(context);
                        const useCase = context.container.resolve(StopExperimentUseCase);
                        const result = await useCase.execute({ id });
                        if (result.isFail()) {
                            throw new Error(result.error.message);
                        }
                        return mapExperiment(result.value);
                    });
                },
                graduateVariant: async (_, { experimentId, variantId }, context) => {
                    return resolve(async () => {
                        ensureAuthentication(context);
                        const useCase = context.container.resolve(GraduateVariantUseCase);
                        const result = await useCase.execute({ experimentId, variantId });
                        if (result.isFail()) {
                            throw new Error(result.error.message);
                        }
                        return result.value;
                    });
                },
                createVariant: async (_, { data }, context) => {
                    return resolve(async () => {
                        ensureAuthentication(context);
                        const useCase = context.container.resolve(CreateVariantUseCase);
                        const result = await useCase.execute(data);
                        if (result.isFail()) {
                            throw new Error(result.error.message);
                        }
                        return mapVariant(result.value);
                    });
                },
                updateVariant: async (_, { id, data }, context) => {
                    return resolve(async () => {
                        ensureAuthentication(context);
                        const useCase = context.container.resolve(UpdateVariantUseCase);
                        const result = await useCase.execute({ id, data });
                        if (result.isFail()) {
                            throw new Error(result.error.message);
                        }
                        return mapVariant(result.value);
                    });
                },
                deleteVariant: async (_, { id }, context) => {
                    return resolve(async () => {
                        ensureAuthentication(context);
                        const useCase = context.container.resolve(DeleteVariantUseCase);
                        const result = await useCase.execute({ id });
                        if (result.isFail()) {
                            throw new Error(result.error.message);
                        }
                        return true;
                    });
                }
            }
        }
    });

    schema.name = "wb.graphql.experiments";

    return schema;
};
