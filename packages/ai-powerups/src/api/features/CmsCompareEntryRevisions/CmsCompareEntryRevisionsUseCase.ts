import { Ai } from "@webiny/api-core/features/ai/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { ModelToAstConverter } from "@webiny/api-headless-cms/features/contentModel/ModelToAstConverter/index.js";
import { CmsModelToJsonSchemaConverter } from "@webiny/api-headless-cms/utils/contentModelToJsonSchema/index.js";
import { GetRevisionByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetRevisionById/index.js";
import {
    ResolveAiCapabilityUseCase,
    withAdditionalInstructions
} from "~/api/features/Capabilities/index.js";
import { CMS_COMPARE_ENTRY_REVISIONS_CAPABILITY } from "./capability.js";
import { CmsCompareEntryRevisionsUseCase } from "./abstractions.js";
import type {
    ICmsCompareEntryRevisionsParams,
    ICmsCompareEntryRevisionsResult
} from "./abstractions.js";

class CmsCompareEntryRevisionsUseCaseImpl implements CmsCompareEntryRevisionsUseCase.Interface {
    constructor(
        private resolveCapability: ResolveAiCapabilityUseCase.Interface,
        private ai: Ai.Interface,
        private getModel: GetModelUseCase.Interface,
        private getRevisionById: GetRevisionByIdUseCase.Interface,
        private modelToAst: ModelToAstConverter.Interface
    ) {}

    async execute(
        params: ICmsCompareEntryRevisionsParams
    ): Promise<ICmsCompareEntryRevisionsResult> {
        const { modelId, revisionId1, revisionId2 } = params;

        const resolved = await this.resolveCapability.execute(
            CMS_COMPARE_ENTRY_REVISIONS_CAPABILITY
        );
        if (resolved.isFail()) {
            throw resolved.error;
        }

        const capability = resolved.value;

        const modelResult = await this.getModel.execute(modelId);
        if (modelResult.isFail()) {
            throw new Error(`Content model "${modelId}" not found.`);
        }
        const model = modelResult.value;

        const [rev1Result, rev2Result] = await Promise.all([
            this.getRevisionById.execute(model, revisionId1),
            this.getRevisionById.execute(model, revisionId2)
        ]);

        if (rev1Result.isFail()) {
            throw new Error(`Revision "${revisionId1}" not found.`);
        }
        if (rev2Result.isFail()) {
            throw new Error(`Revision "${revisionId2}" not found.`);
        }

        const revision1 = rev1Result.value;
        const revision2 = rev2Result.value;

        const modelAst = this.modelToAst.toAst(model);
        const jsonSchemaConverter = new CmsModelToJsonSchemaConverter();
        const entrySchema = jsonSchemaConverter.convert(modelAst, {
            name: model.name,
            description: model.description
        });

        const userPrompt = `CONTENT MODEL JSON SCHEMA:
${JSON.stringify(entrySchema, null, 2)}

VERSION A (Revision #${revision1.version}):
${JSON.stringify(revision1.values, null, 2)}

VERSION B (Revision #${revision2.version}):
${JSON.stringify(revision2.values, null, 2)}`;

        const result = await this.ai.generateText({
            model: capability.model,
            connection: capability.connection,
            system: withAdditionalInstructions(capability),
            prompt: userPrompt,
            temperature: 0.3
        });

        const text = result.text;

        const noChangesMatch = text.match(/No differences detected/);
        let summary = "Content comparison completed";
        if (noChangesMatch) {
            summary = "No differences detected between versions";
        } else {
            const headingMatch = text.match(/<h[2-3][^>]*>([^<]+)<\/h[2-3]>/);
            const trCount = (text.match(/<tr>/g) || []).length - 1;
            if (headingMatch) {
                summary = headingMatch[1].trim();
            } else if (trCount > 0) {
                summary = `${trCount} field${trCount === 1 ? "" : "s"} changed`;
            }
        }

        return { html: text, summary };
    }
}

export const CmsCompareEntryRevisionsUseCaseImplementation =
    CmsCompareEntryRevisionsUseCase.createImplementation({
        implementation: CmsCompareEntryRevisionsUseCaseImpl,
        dependencies: [
            ResolveAiCapabilityUseCase,
            Ai,
            GetModelUseCase,
            GetRevisionByIdUseCase,
            ModelToAstConverter
        ]
    });
