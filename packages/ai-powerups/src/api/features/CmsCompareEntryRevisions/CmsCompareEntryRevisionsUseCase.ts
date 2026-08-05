import { Ai } from "@webiny/api-core/features/ai/index.js";
import { Encryption } from "@webiny/api-core/features/encryption/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { ModelToAstConverter } from "@webiny/api-headless-cms/features/contentModel/ModelToAstConverter/index.js";
import { CmsModelToJsonSchemaConverter } from "@webiny/api-headless-cms/utils/contentModelToJsonSchema/index.js";
import { GetRevisionByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetRevisionById/index.js";
import { GetSettingsUseCase } from "~/api/features/GetSettings/index.js";
import { CmsCompareEntryRevisionsUseCase } from "./abstractions.js";
import type {
    ICmsCompareEntryRevisionsParams,
    ICmsCompareEntryRevisionsResult
} from "./abstractions.js";

const SYSTEM_PROMPT = `You are a content intelligence assistant specialized in version comparison for headless CMS platforms.

I will provide:

1. The content model JSON Schema that defines the structure of the entry.
2. Two versions of the content entry values in JSON format: Version A and Version B.

Your task:

- Parse both versions according to the JSON Schema.
- Identify all differences between Version A and Version B.
- For each difference, explain:
    - The field name (use the human-readable label from the schema description if available)
    - The value in Version A
    - The value in Version B
    - A brief summary of the change (e.g., "Title changed from 'Old' to 'New'")
- If nested fields or objects exist, perform a deep comparison.
- Return the comparison in clean HTML format.

Output format:

<div class="comparison-report">
    <table class="comparison-table">
        <thead>
            <tr>
                <th>Field</th>
                <th>Version A</th>
                <th>Version B</th>
                <th>Change Summary</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><strong>title</strong></td>
                <td>Launch Plan</td>
                <td>Updated Launch Plan</td>
                <td>Title changed from 'Launch Plan' to 'Updated Launch Plan'</td>
            </tr>
        </tbody>
    </table>
</div>

If no differences are found, return: <div class="no-changes"><h3>No differences detected between Version A and Version B.</h3></div>

Use semantic HTML with appropriate CSS classes for styling. Do not include <style> tags or CSS — only return the HTML structure.
For rich text or complex nested values, show a concise summary rather than raw JSON.`;

class CmsCompareEntryRevisionsUseCaseImpl implements CmsCompareEntryRevisionsUseCase.Interface {
    constructor(
        private getSettings: GetSettingsUseCase.Interface,
        private ai: Ai.Interface,
        private encryption: Encryption.Interface,
        private getModel: GetModelUseCase.Interface,
        private getRevisionById: GetRevisionByIdUseCase.Interface,
        private modelToAst: ModelToAstConverter.Interface
    ) {}

    async execute(
        params: ICmsCompareEntryRevisionsParams
    ): Promise<ICmsCompareEntryRevisionsResult> {
        const { modelId, revisionId1, revisionId2 } = params;

        const settingsResult = await this.getSettings.execute();
        if (settingsResult.isFail()) {
            throw new Error("Failed to load AI Power Ups settings.");
        }

        const settings = settingsResult.value;
        const firstProvider = settings.providers.presets[0];

        if (!firstProvider) {
            throw new Error("No AI provider configured. Add a provider in AI Power Ups settings.");
        }

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

        const apiKey = await this.encryption.decrypt(firstProvider.apiKeyEncrypted);

        const userPrompt = `CONTENT MODEL JSON SCHEMA:
${JSON.stringify(entrySchema, null, 2)}

VERSION A (Revision #${revision1.version}):
${JSON.stringify(revision1.values, null, 2)}

VERSION B (Revision #${revision2.version}):
${JSON.stringify(revision2.values, null, 2)}`;

        const result = await this.ai.generateText({
            model: firstProvider.model,
            connection: {
                sdkName: firstProvider.model.split("/")[0],
                apiKey
            },
            system: SYSTEM_PROMPT,
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
            GetSettingsUseCase,
            Ai,
            Encryption,
            GetModelUseCase,
            GetRevisionByIdUseCase,
            ModelToAstConverter
        ]
    });
