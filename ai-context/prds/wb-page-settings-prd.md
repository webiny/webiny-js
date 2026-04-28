```ts
export interface IPageSettingsGroup {
  name: string;
  label: string;
  description?: string;
  icon?: string;

  buildForm(form: IFormModel): void;

  mapToForm?(data: PageSettingsData): Record<string, unknown>;

  mapFromForm?(data: Record<string, unknown>, input: UpdatePageSettingsParams): void;
}

export interface IPageSettingsFormModifier {
  modifyForm(form: IFormModel): void;

  mapToForm?(data: PageSettingsData): Record<string, unknown>;

  mapFromForm?(data: Record<string, unknown>, input: UpdatePageSettingsParams): void;
}

class PageSettingsPresenter {
  // Loading
  async load(pageId: string) {
    const page = await this.repository.getSettings(pageId);

    // Base mapping
    const formData: Record<string, unknown> = {
      title: page.properties.title,
      path: page.properties.path
      // ...base fields
    };

    // Let each group contribute its form data
    for (const group of this.groups) {
      Object.assign(formData, group.mapToForm?.(page) ?? {});
    }

    // Let cross-cutting modifiers contribute
    for (const modifier of this.modifiers) {
      Object.assign(formData, modifier.mapToForm?.(page) ?? {});
    }

    this.form.setData(formData);
  }

  // Saving
  async save() {
    const data = await this.form.submit();
    if (!data) return false;

    const input: UpdatePageSettingsParams = {
      properties: { title: data.title, path: data.path }
    };

    for (const group of this.groups) {
      group.mapFromForm?.(data, input);
    }

    for (const modifier of this.modifiers) {
      modifier.mapFromForm?.(data, input);
    }

    await this.repository.updateSettings(this.pageId, input);
  }
}
```
