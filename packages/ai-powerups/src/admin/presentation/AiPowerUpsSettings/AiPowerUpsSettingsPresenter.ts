import { makeAutoObservable, computed, runInAction } from "mobx";
import { FormModelFactory, FormModel } from "@webiny/app-admin";
import type { LayoutNode } from "@webiny/app-admin/features/formModel/abstractions.js";
import { GetSettingsUseCase } from "../../features/settings/getSettings/abstractions.js";
import { UpdateSettingsUseCase } from "../../features/settings/updateSettings/abstractions.js";
import { AiPowerUpsSettingsPresenter as PresenterAbstraction } from "./abstractions.js";
import { AiPowerUpsSettingsGroup } from "./settingsGroup.js";
import type { ISettings } from "~/admin/features/settings/shared/abstractions.js";

type FieldsFactory = (
  fields: FormModelFactory.FieldBuilderRegistry,
) => Record<string, FormModelFactory.FieldBuilder>;

type LayoutFactory = (layout: FormModelFactory.LayoutBuilder) => LayoutNode[];

interface CollectedGroup {
  group: AiPowerUpsSettingsGroup.Interface;
  fieldsFn: FieldsFactory | null;
  layoutFn: LayoutFactory | null;
}

class AiPowerUpsSettingsPresenterImpl
  implements PresenterAbstraction.Interface
{
  private loading = false;
  private saving = false;
  private form: FormModel.Interface<ISettings> | null = null;
  private error: string | null = null;

  constructor(
    private factory: FormModelFactory.Interface,
    private groups: AiPowerUpsSettingsGroup.Interface[],
    private getSettings: GetSettingsUseCase.Interface,
    private updateSettings: UpdateSettingsUseCase.Interface,
  ) {
    makeAutoObservable(this, { vm: computed }, { autoBind: true });
  }

  get vm(): PresenterAbstraction.ViewModel {
    return {
      loading: this.loading,
      saving: this.saving,
      form: this.form ? this.form.vm : null,
      error: this.error,
    };
  }

  async init(): Promise<void> {
    this.loading = true;
    this.error = null;

    try {
      const data = await this.getSettings.execute();
      runInAction(() => {
        this.form = this.buildForm();
        this.form.setData(data);
      });
    } catch (err) {
      runInAction(() => {
        this.error =
          err instanceof Error ? err.message : "Failed to load settings.";
      });
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  }

  async save(): Promise<boolean> {
    if (!this.form) {
      return false;
    }

    const data = await this.form.submit<ISettings>();
    if (!data) {
      return false;
    }

    runInAction(() => {
      this.saving = true;
      this.error = null;
    });

    try {
      await this.updateSettings.execute(data);
      return true;
    } catch (err) {
      console.log(err);
      runInAction(() => {
        this.error =
          err instanceof Error ? err.message : "Failed to save settings.";
      });
      return false;
    } finally {
      runInAction(() => {
        this.saving = false;
      });
    }
  }

  private collectGroups(): CollectedGroup[] {
    return this.groups.map((group) => {
      const collected: CollectedGroup = {
        group,
        fieldsFn: null,
        layoutFn: null,
      };

      const builder: AiPowerUpsSettingsGroup.FormBuilder = {
        fields(fn: FieldsFactory) {
          collected.fieldsFn = fn;
        },
        layout(fn: LayoutFactory) {
          collected.layoutFn = fn;
        },
      };

      group.buildForm(builder);

      return collected;
    });
  }

  private buildForm() {
    const collected = this.collectGroups();

    return this.factory.create<ISettings>({
      fields: (fields) => {
        const result: Record<string, FormModelFactory.FieldBuilder> = {};
        for (const { group, fieldsFn } of collected) {
          if (!fieldsFn) {
            continue;
          }
          result[group.name] = fields
            .object()
            .label(group.label)
            .renderer("passthrough")
            .fields(fieldsFn);
        }
        return result;
      },
      layout: (layout) => {
        if (collected.length === 0) {
          return [];
        }

        return [
          layout.tabs({
            id: "settings-tabs",
            renderer: "tabs-vertical",
            tabs: collected.map(({ group }) => ({
              id: group.name,
              label: group.label,
              description: group.description,
              icon: group.icon,
              layout: [layout.row(group.name)],
            })),
          }),
        ];
      },
    });
  }
}

export const AiPowerUpsSettingsPresenter =
  PresenterAbstraction.createImplementation({
    implementation: AiPowerUpsSettingsPresenterImpl,
    dependencies: [
      FormModelFactory,
      [AiPowerUpsSettingsGroup, { multiple: true }],
      GetSettingsUseCase,
      UpdateSettingsUseCase,
    ],
  });
