# CMS Field Editor → FormModel + Presenter Refactor

## Overview

Replace the old `<Form>` + `<Bind>` field editor dialog with the FormModel + Presenter architecture. Convert `CmsModelFieldTypePlugin` → `CmsFieldType` DI abstraction. Each editor tab becomes a `CmsFieldEditorGroup`, extensible via `CmsFieldEditorGroupModifier`.

---

## Phase 1: Tracer bullet — General tab end-to-end
- [ ] Complete

Prove the architecture by wiring a single tab all the way through: abstraction → group → presenter → view. This covers the full vertical slice without touching other tabs yet.

**Abstractions**: Create `presentation/fieldEditor/abstractions.ts` with `ICmsFieldEditorGroup`, `ICmsFieldEditorGroupModifier`, `ICmsFieldEditorContext`, `ICmsFieldEditorFormBuilder`, `IFieldEditorPresenter`.

**CmsFieldType**: Create `presentation/fieldTypes/abstractions.ts` with `ICmsFieldType` (pure metadata: type, label, icon, allowList, allowPredefinedValues, validators, createField). Create `TextFieldType` as the first implementation. Register in a feature.

**GeneralGroup**: Create `presentation/fieldEditor/groups/GeneralGroup.ts` — fields (label, fieldId, list, predefinedValuesEnabled, description, note, help, tags) with `computedUntilDirty` for fieldId auto-fill. mapToForm / mapFromForm.

**TextFieldSettingsModifier**: Create as a `CmsFieldEditorGroupModifier` targeting `"general"` with `shouldApply(ctx) => ctx.fieldType.type === "text"`. Adds placeholder field.

**FieldEditorPresenter**: Create `presentation/fieldEditor/FieldEditorPresenter.ts` — `collectGroups()` applying modifiers, `buildForm()` creating a FormModel with one tab, `init()` / `submit()` with data mapping.

**View**: Modify `EditFieldDialog.tsx` — replace `<Form>` with presenter + `<FormView>`. Only the General tab works; other tabs are stubbed or use fallback rendering.

**Verify**: Build passes. Open a text field in the model editor. General tab renders with all fields. Label → fieldId auto-fill works. Placeholder setting appears. Save persists correctly.

---

## Phase 2: Remaining field type definitions
- [ ] Complete

Create all `CmsFieldType` implementations: LongText, Number, Boolean, DateTime, Ref, Object, DynamicZone, RichText, Json. Create corresponding settings modifiers for each (DateTime format/default, Ref model selector with lazy-loaded options from repository, etc.). Register all in the feature.

**Verify**: Open any field type in the editor. General tab shows the correct type-specific settings. Data round-trips correctly.

---

## Phase 3: Appearance tab
- [ ] Complete

Create `AppearanceGroup` with rendererName + rendererSettings fields. Create `CmsRendererSelectorRenderer` (radio group of `ICmsFieldRenderer` instances filtered by `canUse`). Wire up dynamic renderer settings from `ICmsFieldRenderer.buildSettingsForm()`. Register renderer via `AdminConfig.Form.FieldRenderer`.

**Verify**: Appearance tab shows renderer radio buttons. Switching renderers updates settings form. Selected renderer persists as `field.renderer = { name, settings }`.

---

## Phase 4: Predefined values tab
- [ ] Complete

Create `PredefinedValuesGroup` with `values` field as `object().list().renderer("keyValueTags")` and child fields (label, value, selected). Tab visibility controlled by `predefinedValuesEnabled && fieldType.allowPredefinedValues`.

**Verify**: Toggle predefined values on a text field. Tab appears. Add/edit/remove values. Data persists as `field.predefinedValues = { enabled, values: [...] }`.

---

## Phase 5: Validations tab
- [ ] Complete

Create `ValidationsGroup` with `validation` and `listValidation` as `object().list().renderer("cmsValidators")`. `listValidation` hidden when `list` is false. Create `CmsValidatorsRenderer` — wraps existing validator UI using `field.vm` instead of `<Bind>`.

**Verify**: Validators tab shows toggles with settings. Toggle list → list validators section appears. Data persists as `CmsModelFieldValidator[]`.

---

## Phase 6: Permissions + Rules tabs
- [ ] Complete

Create `PermissionsGroup` and `RulesGroup`. Both split `field.rules[]` by type in mapToForm and recombine in mapFromForm. Create `CmsAccessControlRulesRenderer` (user/team autocomplete + permission cards) and `CmsConditionRulesRenderer` (cascading rule builder). Create `IdentitySelectRenderer` in `packages/app-admin` for single role/team select if needed. Permissions tab visibility gated by WCP feature flag.

**Verify**: Add/edit/remove permissions and condition rules. Data persists as `field.rules[]` with correct `type` discriminator. Both rule types coexist without data loss.

---

## Phase 7: Cleanup
- [ ] Complete

Remove old tab components (GeneralTab, PredefinedValues, ValidationTab, AppearanceTab, PermissionsEditor, RulesEditor), FieldSettingsTabs, useRendererPlugins, useCmsFieldRenderers, old field type plugins from `admin/plugins/fields/`, old field renderer plugins from `admin/plugins/fieldRenderers/`, CmsRendererMap.ts. Remove imports from allPlugins.ts. Deprecate `CmsModelFieldTypePlugin` type.

**Verify**: Build passes. Full manual testing of all field types across all tabs. No regressions.

---

## Constraints

- **Data shape must remain identical** on submit — `mapFromForm()` must produce the exact `CmsModelField` shape the backend expects.
- **No FormModel API gaps** — everything needed is available: `object().list()`, custom renderers, `computedUntilDirty`, `hiddenWhen`, tab rules, `.options()` with reactive callbacks, `beforeChange`/`afterChange`.
