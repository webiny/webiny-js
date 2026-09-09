import { NotFoundError } from "@webiny/api-graphql";
import type { IGraphQLSchemaBuilder } from "@webiny/api-graphql/features/GraphQLSchemaBuilder/abstractions.js";
import { ensureAuthentication } from "~/utils/ensureAuthentication.js";
import { resolve } from "~/utils/resolve.js";
import { experimentsTypeDefs } from "~/graphql/experiments/experiments.typeDefs.js";
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
import { DeleteExperimentUseCase } from "~/features/experiments/DeleteExperiment/index.js";
import { GraduateVariantUseCase } from "~/features/experiments/GraduateVariant/index.js";
import { GetActiveExperimentForPathUseCase } from "~/features/experiments/GetActiveExperimentForPath/index.js";
import {
    PauseExperimentUseCase,
    ResumeExperimentUseCase,
    IsExperimentPausedUseCase
} from "~/features/experiments/ExperimentPause/index.js";
import { GetPublishedRevisionByEntryIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetPublishedRevisionByEntryId/index.js";
import { VariantModelProvider } from "~/domain/variant/abstractions.js";
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

export const addExperimentsSchema = (builder: IGraphQLSchemaBuilder): void => {
    builder.addTypeDefs(experimentsTypeDefs);

    // --- Queries ---

    builder.addResolver({
        path: "WbQuery.getExperiment",
        dependencies: [GetExperimentByIdUseCase],
        resolver(getExperimentById) {
            return ({ args, context }) =>
                resolve(async () => {
                    ensureAuthentication(context);
                    const result = await getExperimentById.execute(args.id);
                    if (result.isFail()) {
                        throw new NotFoundError(`Experiment "${args.id}" was not found!`);
                    }
                    return mapExperiment(result.value);
                });
        }
    });

    builder.addResolver({
        path: "WbQuery.getActiveExperiment",
        dependencies: [GetActiveExperimentForRevisionUseCase],
        resolver(getActiveForRevision) {
            return ({ args, context }) =>
                resolve(async () => {
                    ensureAuthentication(context);
                    const result = await getActiveForRevision.execute(args.revisionId);
                    if (result.isFail()) {
                        if (result.error.code === "WebsiteBuilder/Experiment/NoActiveExperiment") {
                            return null;
                        }
                        throw new Error(result.error.message);
                    }
                    return mapExperiment(result.value);
                });
        }
    });

    builder.addResolver({
        path: "WbQuery.listExperiments",
        dependencies: [ListExperimentsUseCase],
        resolver(listExperiments) {
            return ({ args, context }) =>
                resolve(async () => {
                    ensureAuthentication(context);
                    const result = await listExperiments.execute({
                        pageEntryId: args.pageEntryId
                    });
                    if (result.isFail()) {
                        throw new Error(result.error.message);
                    }
                    return result.value.map(mapExperiment);
                });
        }
    });

    builder.addResolver({
        path: "WbQuery.getVariant",
        dependencies: [GetVariantByIdUseCase],
        resolver(getVariantById) {
            return ({ args, context }) =>
                resolve(async () => {
                    ensureAuthentication(context);
                    const result = await getVariantById.execute(args.id);
                    if (result.isFail()) {
                        throw new NotFoundError(`Variant "${args.id}" was not found!`);
                    }
                    return mapVariant(result.value);
                });
        }
    });

    builder.addResolver({
        path: "WbQuery.listVariants",
        dependencies: [ListVariantsUseCase],
        resolver(listVariants) {
            return ({ args, context }) =>
                resolve(async () => {
                    ensureAuthentication(context);
                    const result = await listVariants.execute({
                        experimentId: args.experimentId
                    });
                    if (result.isFail()) {
                        throw new Error(result.error.message);
                    }
                    return result.value.map(mapVariant);
                });
        }
    });

    builder.addResolver({
        path: "WbQuery.getPageExperiment",
        dependencies: [GetActiveExperimentForPathUseCase],
        resolver(getActiveForPath) {
            return ({ args, context }) =>
                resolve(async () => {
                    ensureAuthentication(context);
                    const result = await getActiveForPath.execute(args.path);
                    if (result.isFail()) {
                        const code = result.error.code;
                        if (
                            code === "WebsiteBuilder/Experiment/NoActiveExperiment" ||
                            code === "WebsiteBuilder/Experiment/Paused" ||
                            code === "WebsiteBuilder/Page/NotFound"
                        ) {
                            return null;
                        }
                        throw new Error(result.error.message);
                    }
                    const active = result.value;
                    const trafficSplit = active.experiment.trafficSplit ?? {
                        control: 100,
                        variants: {}
                    };
                    return {
                        experimentId: active.experiment.entryId,
                        revisionId: active.revisionId,
                        pageEntryId: active.pageEntryId,
                        path: active.path,
                        status: active.experiment.status,
                        tenantId: active.experiment.tenant,
                        controlVariantId: CONTROL_VARIANT_ID,
                        trafficSplit,
                        targeting: active.experiment.targeting,
                        analytics: active.experiment.analytics,
                        variants: Object.keys(trafficSplit.variants ?? {}).map(variantId => ({
                            variantId,
                            name: ""
                        }))
                    };
                });
        }
    });

    builder.addResolver({
        path: "WbQuery.getVariantContent",
        dependencies: [GetPublishedRevisionByEntryIdUseCase, VariantModelProvider],
        resolver(getPublished, variantModelProvider) {
            return ({ args, context }) =>
                resolve(async () => {
                    ensureAuthentication(context);
                    const variantModel = await variantModelProvider.get();
                    const result = await getPublished.execute(variantModel, args.id);
                    if (result.isFail() || !result.value) {
                        throw new NotFoundError(`Published variant "${args.id}" was not found!`);
                    }
                    const values = result.value.values;
                    return {
                        id: result.value.entryId,
                        properties: values.properties,
                        bindings: values.bindings,
                        elements: values.elements,
                        extensions: values.extensions,
                        metadata: values.metadata
                    };
                });
        }
    });

    builder.addResolver({
        path: "WbQuery.getExperimentPaused",
        dependencies: [IsExperimentPausedUseCase],
        resolver(isExperimentPaused) {
            return ({ args, context }) =>
                resolve(async () => {
                    ensureAuthentication(context);
                    const result = await isExperimentPaused.execute(args.experimentId);
                    if (result.isFail()) {
                        throw new Error(result.error.message);
                    }
                    return result.value;
                });
        }
    });

    // --- Mutations ---

    builder.addResolver({
        path: "WbMutation.createExperiment",
        dependencies: [CreateExperimentUseCase],
        resolver(createExperiment) {
            return ({ args, context }) =>
                resolve(async () => {
                    ensureAuthentication(context);
                    const result = await createExperiment.execute(args.data);
                    if (result.isFail()) {
                        throw new Error(result.error.message);
                    }
                    return mapExperiment(result.value);
                });
        }
    });

    builder.addResolver({
        path: "WbMutation.updateExperiment",
        dependencies: [UpdateExperimentUseCase],
        resolver(updateExperiment) {
            return ({ args, context }) =>
                resolve(async () => {
                    ensureAuthentication(context);
                    const result = await updateExperiment.execute({ id: args.id, data: args.data });
                    if (result.isFail()) {
                        throw new Error(result.error.message);
                    }
                    return mapExperiment(result.value);
                });
        }
    });

    builder.addResolver({
        path: "WbMutation.startExperiment",
        dependencies: [StartExperimentUseCase],
        resolver(startExperiment) {
            return ({ args, context }) =>
                resolve(async () => {
                    ensureAuthentication(context);
                    const result = await startExperiment.execute({ id: args.id });
                    if (result.isFail()) {
                        throw new Error(result.error.message);
                    }
                    return mapExperiment(result.value);
                });
        }
    });

    builder.addResolver({
        path: "WbMutation.stopExperiment",
        dependencies: [StopExperimentUseCase],
        resolver(stopExperiment) {
            return ({ args, context }) =>
                resolve(async () => {
                    ensureAuthentication(context);
                    const result = await stopExperiment.execute({ id: args.id });
                    if (result.isFail()) {
                        throw new Error(result.error.message);
                    }
                    return mapExperiment(result.value);
                });
        }
    });

    builder.addResolver({
        path: "WbMutation.pauseExperiment",
        dependencies: [PauseExperimentUseCase],
        resolver(pauseExperiment) {
            return ({ args, context }) =>
                resolve(async () => {
                    ensureAuthentication(context);
                    const result = await pauseExperiment.execute(args.experimentId);
                    if (result.isFail()) {
                        throw new Error(result.error.message);
                    }
                    return result.value;
                });
        }
    });

    builder.addResolver({
        path: "WbMutation.resumeExperiment",
        dependencies: [ResumeExperimentUseCase],
        resolver(resumeExperiment) {
            return ({ args, context }) =>
                resolve(async () => {
                    ensureAuthentication(context);
                    const result = await resumeExperiment.execute(args.experimentId);
                    if (result.isFail()) {
                        throw new Error(result.error.message);
                    }
                    return result.value;
                });
        }
    });

    builder.addResolver({
        path: "WbMutation.deleteExperiment",
        dependencies: [DeleteExperimentUseCase],
        resolver(deleteExperiment) {
            return ({ args, context }) =>
                resolve(async () => {
                    ensureAuthentication(context);
                    const result = await deleteExperiment.execute({ id: args.id });
                    if (result.isFail()) {
                        throw new Error(result.error.message);
                    }
                    return true;
                });
        }
    });

    builder.addResolver({
        path: "WbMutation.graduateVariant",
        dependencies: [GraduateVariantUseCase],
        resolver(graduateVariant) {
            return ({ args, context }) =>
                resolve(async () => {
                    ensureAuthentication(context);
                    const result = await graduateVariant.execute({
                        experimentId: args.experimentId,
                        variantId: args.variantId
                    });
                    if (result.isFail()) {
                        throw new Error(result.error.message);
                    }
                    return result.value;
                });
        }
    });

    builder.addResolver({
        path: "WbMutation.createVariant",
        dependencies: [CreateVariantUseCase],
        resolver(createVariant) {
            return ({ args, context }) =>
                resolve(async () => {
                    ensureAuthentication(context);
                    const result = await createVariant.execute(args.data);
                    if (result.isFail()) {
                        throw new Error(result.error.message);
                    }
                    return mapVariant(result.value);
                });
        }
    });

    builder.addResolver({
        path: "WbMutation.updateVariant",
        dependencies: [UpdateVariantUseCase],
        resolver(updateVariant) {
            return ({ args, context }) =>
                resolve(async () => {
                    ensureAuthentication(context);
                    const result = await updateVariant.execute({ id: args.id, data: args.data });
                    if (result.isFail()) {
                        throw new Error(result.error.message);
                    }
                    return mapVariant(result.value);
                });
        }
    });

    builder.addResolver({
        path: "WbMutation.deleteVariant",
        dependencies: [DeleteVariantUseCase],
        resolver(deleteVariant) {
            return ({ args, context }) =>
                resolve(async () => {
                    ensureAuthentication(context);
                    const result = await deleteVariant.execute({ id: args.id });
                    if (result.isFail()) {
                        throw new Error(result.error.message);
                    }
                    return true;
                });
        }
    });
};
