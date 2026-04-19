# AI Powerups Settings

- location: `packages/ai-powerups/src/admin`

## Tasks

- define a named dialog `ai-powerups-settings` without params (no schema)
- `packages/ai-powerups/src/admin/Extension.tsx:17` should open the dialog
- dialog layout reference:
  `packages/app-website-builder/src/modules/pages/PageEditor/TopBar/Settings/PageSettingsDrawer.tsx`
- use `webiny-admin-architect` skill to learn about admin architecture
- create a headless feature in `admin/features/getSettings/*` which usecase/repository/gateway to load settings
- create a headless feature in `admin/features/updateSettings/*` which usecase/repository/gateway to save settings
- gql query to get settings is `{ aiPowerups { getSettings { data error { message code data } } }`
- settings TS type is `Record<string, any>` (`aiPowerups.getSettings.data`), as various plugins will register their own forms and store different settings
- the dialog needs a presenter, which loads settings using the `GetSettingsUseCase` feature
- a full example of presenter and dialog can be found here `packages/app-website-builder/src/presentation/pages/CreatePage/CreatePageDialog.tsx`
- create an abstraction `AiPowerupsSettingsGroup` with an interface

```ts
export interface IAiPowerupsSettingsGroup {
  name: string;
  label: string;
  description?: string;
  icon?: JSX.Element;
  buildForm(formBuilder: AiPowerupsSettingsGroup.FormBuilder): void;
}
```

Example implementation of a group:

```ts
class TranslationsGroup implements AiPowerupsSettingsGroup.Interface {
  name = "seo";
  label = "SEO";

  buildForm(form: AiPowerupsSettingsGroup.FormBuilder) {
    form.fields(fields => ({
      title: fields.text().label("Title"),
      description: fields.text().label("Description").renderer("textarea"),
      noIndex: fields.boolean().label("No Index")
    }));

    form.layout(layout => [layout.row("title"), layout.row("description"), layout.row("noIndex")]);
  }
}
```

- the main dialog presenter builds the entire form using the `AiPowerupsSettingsGroup` injected via `{ multiple: true }` and constructs the form like this

```ts
class AiPowerupsSettingsPresenter {
  private buildForm(): IFormModel {
    const groups = this.groups.map(group => {
      const collected = { fields: null, layout: null };

      const builder: GroupFormBuilder = {
        fields(fn) {
          collected.fields = fn;
        },
        layout(fn) {
          collected.layout = fn;
        }
      };

      group.buildForm(builder);

      return { group, collected };
    });

    return this.factory.create({
      fields: fields => {
        const result: Record<string, FieldBuilder> = {};
        for (const { group, collected } of groups) {
          result[group.name] = fields.object().label(group.label).fields(collected.fields);
        }
        return result;
      },
      layout: layout => [
        layout.tabs(
          groups.map(({ group, collected }) => ({
            id: group.name,
            label: group.label,
            description: group.description,
            icon: group.icon,
            layout: collected.layout?.(layout) ?? []
          }))
        )
      ]
    });
  }
}
```

- create the "General" settings group in the presentation folder. This group needs a local feature to load available models for the dropdown (keep the usecase/repo/gateway logic in the presentation feature itself, it's not reusable). The form of this General group needs to provide a way to define multiple presets, with name, model, apiKey. With this, a user will define multiple presets for AI SDK provider. this needs to be all done using the FormModel, so we'll need to implement an object field with support for .list(). The FormModel is built following this @ai-context/plans/form-builder-implementation-plan.md:307 document. Check Phase 6, see if it's implemented or not. If not, we'll need to implement it, but leave this entire General group task for the very end.

- model field needs to be a dropdown with a list of models, (similar to `packages/app-website-builder/src/presentation/pages/CreatePage/AddLanguageModifier.ts`)
- validation errors from the form need to be rendered at the top of the dialog (above the form)
- on succesfull submit, use the `UpdateSettingsUseCase` headless feature
- both Get and Update use cases repositories must update the settings in a shared, injectable, cache object
