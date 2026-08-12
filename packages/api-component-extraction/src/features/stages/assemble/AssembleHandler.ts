import { Result } from "@webiny/feature/api";
import { StageHandler, type StageContext, type StageOutcome } from "~/domain/stage.js";
import type {
    AssembleArtifact,
    AssembledPage,
    ComponentInstance,
    GenerateArtifact,
    ValidationResult
} from "~/domain/artifacts.js";
import { ThemeManifestResolver } from "~/features/shared/themeManifest.js";
import { validateTokenBinding } from "~/features/shared/validators.js";
import { ExtractionValidationError, type ExtractionError } from "~/domain/errors.js";

/**
 * Assemble — deterministic. For each page, the ordered list of component instances (which component the
 * section maps to, in document order) with the prop values each instance received. Also re-runs the
 * token-binding validator across every generated component.
 */
class AssembleHandlerImpl implements StageHandler.Interface {
    readonly stage = "assemble" as const;

    constructor(private manifestResolver: ThemeManifestResolver.Interface) {}

    async execute(context: StageContext): Promise<Result<StageOutcome, ExtractionError>> {
        const generateRef = context.upstream.components;
        if (!generateRef) {
            return Result.fail(
                new ExtractionValidationError("no generated components to assemble")
            );
        }
        const generateResult = await context.store.getJson<GenerateArtifact>(generateRef);
        if (generateResult.isFail()) {
            return Result.fail(generateResult.error);
        }
        const generate = generateResult.value;
        if (!generate) {
            return Result.fail(new ExtractionValidationError("the generate artifact is empty"));
        }
        await context.progress({
            message: `Assembling ${generate.components.length} component(s) across the pages…`
        });

        // Valid css variables from the manifest, for the token validator.
        let validVariables = new Set<string>();
        let manifestAvailable = false;
        const manifestResult = await this.manifestResolver.resolve(
            context.job.themeEntryId,
            context.job.themeVersion
        );
        if (manifestResult.isOk()) {
            manifestAvailable = true;
            validVariables = new Set(
                manifestResult.value.slots.flatMap(slot =>
                    slot.cssVariables.map(variable => variable.toLowerCase())
                )
            );
        } else {
            await context.log.info({
                message: `Assembling without token validation: ${manifestResult.error.message}`
            });
        }

        const tokenValidation: Record<string, ValidationResult> = {};
        for (const component of generate.components) {
            tokenValidation[component.signature] = manifestAvailable
                ? validateTokenBinding(component.css, validVariables)
                : {
                      passed: true,
                      failures: ["theme manifest unavailable; token binding not checked"]
                  };
        }

        // Per-page instances, ordered by section, from each component's members.
        const byUrl = new Map<string, ComponentInstance[]>();
        for (const component of generate.components) {
            const propValues: Record<string, string> = {};
            for (const prop of component.props) {
                propValues[prop.name] = prop.observedValues[0] ?? "";
            }
            for (const member of component.members) {
                const list = byUrl.get(member.url) ?? [];
                list.push({
                    signature: component.signature,
                    componentName: component.name,
                    sectionIndex: member.sectionIndex,
                    propValues
                });
                byUrl.set(member.url, list);
            }
        }
        const pages: AssembledPage[] = [...byUrl.entries()].map(([url, instances]) => ({
            url,
            instances: instances.sort((a, b) => a.sectionIndex - b.sectionIndex)
        }));

        const artifact: AssembleArtifact = { pages, tokenValidation, componentsRef: generateRef };
        const key = context.artifactKey("assembly");
        const written = await context.store.putJson(key, artifact);
        if (written.isFail()) {
            return Result.fail(written.error);
        }

        const tokenFailures = Object.values(tokenValidation).filter(
            result => !result.passed
        ).length;
        await context.progress({
            message: `Assembled ${pages.length} page(s); ${tokenFailures} component(s) with token-binding issues.`,
            current: pages.length,
            total: pages.length
        });
        return Result.ok({ artifacts: { assembly: key } });
    }
}

export const AssembleHandler = StageHandler.createImplementation({
    implementation: AssembleHandlerImpl,
    dependencies: [ThemeManifestResolver]
});
