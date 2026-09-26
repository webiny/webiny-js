# @webiny/project-template-base

> Level 10 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
`@webiny/project-template-base` is a tiny (2-file) package holding the one piece of composition genuinely shared by both hosting-type project templates: `DefaultExtensions`, a component that renders `<Languages />`, `<TenantManager />`, `<AiPowerups />` and `<BugReporter />`. It does exactly what its description says ("Shared base config extensions for Webiny project templates (aws + standalone flavours)") and is healthy — but it is under-used relative to its stated purpose: a second, larger block of logic that really is identical between the two hosting types (the `FeatureFlags`/`<FeatureFlagsGate>` wrapper in each template's `webiny.config.base.tsx`) is duplicated instead of living here. See Duplication.

## Public API
- `DefaultExtensions` (`src/DefaultExtensions.tsx`) — consumed by exactly the two hosting-type base configs: `project-aws-template/template/webiny.config.base.tsx` and `project-standalone-template/template/webiny.config.base.tsx`. This 1:1 match with the package's stated purpose is a good sign — it isn't over- or under-reaching.

## Bugs
None found. The package is two small, straightforward files with no logic beyond composing four other components.

## Duplication
`jscpd` reports zero clones within this package. The notable duplication is cross-package, not internal: `project-aws-template/template/webiny.config.base.tsx` and `project-standalone-template/template/webiny.config.base.tsx` both contain an identical ~10-line block —
```
const FeatureFlags = "FeatureFlags" in WebinyConfig ? WebinyConfig.FeatureFlags : null;
const WebinyConfigTsx = WebinyConfig.Extensions;
export const Extensions = () => {
    return (
        <>
            {FeatureFlags ? <FeatureFlags /> : null}
            <FeatureFlagsGate skip={!FeatureFlags}>
                ...hosting-specific extension...
                <DefaultExtensions />
                ...
            </FeatureFlagsGate>
        </>
    );
};
```
— differing only in which hosting-specific component (`<ProjectAws />` vs `<ProjectStandalone />`) and extra extensions (`<RemoteComponents />`, `<Infra.ProductionEnvironments />`) are rendered inside the wrapper. Since this package exists specifically to hold logic shared across the two hosting flavours, this wrapper is a natural fit for it rather than the two template packages. Confidence: high (both files read in full and compared directly).

## Dead code
None found; both exports are used exactly where expected.

## Convention issues
None found — one component per file, no inline types, minimal barrel (`index.ts` is a single `export *`).

## Test gaps
No `__tests__` directory exists for this package. `DefaultExtensions` has no automated render test, though the risk is low since it is pure composition with no conditional logic.

## Recommendations
1. Extract the duplicated `FeatureFlags`/`<FeatureFlagsGate>` resolution wrapper (currently copy-pasted in both `project-aws-template` and `project-standalone-template`'s `webiny.config.base.tsx`) into this package, e.g. as a `HostingExtensionsGate` component taking the hosting-specific children as `props.children` — this is exactly the kind of duplication `project-template-base` was created to prevent.
2. Add a minimal render test for `DefaultExtensions` to lock in its four-component composition.
3. No further action needed otherwise; the package is small, correctly scoped, and has no bugs.
