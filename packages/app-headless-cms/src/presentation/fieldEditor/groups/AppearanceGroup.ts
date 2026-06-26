import { CmsFieldEditorGroup } from "../abstractions.js";
import type { ICmsFieldEditorFormBuilder, ICmsFieldEditorContext } from "../abstractions.js";
import type { CmsModelField } from "~/types.js";
import { CmsFieldRenderer } from "~/presentation/fieldRenderers/abstractions.js";
import type {
    ICmsFieldRenderer,
    ICmsFieldRendererFormBuilder
} from "~/presentation/fieldRenderers/abstractions.js";
import type { FormModelFactory, FormModel } from "@webiny/app-admin";

declare module "@webiny/app-admin/features/formModel/abstractions.js" {
    interface IFieldRendererRegistry {
        cmsAppearance: { fieldType: "object"; settings: undefined };
    }
}

interface RendererSettingsBuild {
    rendererName: string;
    fieldsFns: Array<
        (f: FormModelFactory.FieldBuilderRegistry) => Record<string, FormModelFactory.FieldBuilder>
    >;
    layoutFns: Array<(l: FormModelFactory.LayoutBuilder) => FormModel.LayoutNodeBuilder[]>;
}

class AppearanceGroupImpl implements CmsFieldEditorGroup.Interface {
    name = "appearance";
    label = "Appearance";

    constructor(private allRenderers: ICmsFieldRenderer[]) {}

    buildForm(form: ICmsFieldEditorFormBuilder, context: ICmsFieldEditorContext) {
        const settingsBuilds = this.collectRendererSettings(this.allRenderers);

        form.fields(fields => {
            const rendererChildren: Record<string, FormModelFactory.FieldBuilder> = {
                name: fields.text().options(f => {
                    const list = Boolean(f.field("general.list").getValue());
                    const predefined = Boolean(
                        f.field("general.predefinedValuesEnabled").getValue()
                    );
                    const liveField = {
                        ...context.field,
                        list,
                        predefinedValues: {
                            values: context.field.predefinedValues?.values ?? [],
                            enabled: predefined
                        }
                    };

                    return this.allRenderers
                        .filter(r => r.canUse({ field: liveField, model: context.model }))
                        .map(r => ({ label: r.name, value: r.rendererName }));
                })
            };

            for (const build of settingsBuilds) {
                const notSelected = (f: FormModel.Interface) =>
                    f.field("$.name").getValue() !== build.rendererName;

                rendererChildren[`settings__${build.rendererName}`] = fields
                    .object()
                    .renderer("passthrough")
                    .hiddenWhen(notSelected)
                    .fields((f: FormModelFactory.FieldBuilderRegistry) => {
                        const merged: Record<string, FormModelFactory.FieldBuilder> = {};
                        for (const fn of build.fieldsFns) {
                            Object.assign(merged, fn(f));
                        }
                        return merged;
                    });
            }

            return {
                renderer: fields
                    .object()
                    .renderer("cmsAppearance")
                    .fields(() => rendererChildren)
            };
        });

        form.layout(layout => {
            const innerLayout = (inner: FormModelFactory.LayoutBuilder) => {
                const nodes: FormModel.LayoutNodeBuilder[] = [inner.row("name")];
                for (const build of settingsBuilds) {
                    nodes.push(
                        inner.object(`settings__${build.rendererName}`, settingsInner =>
                            build.layoutFns.flatMap(fn => fn(settingsInner))
                        )
                    );
                }
                return nodes;
            };

            return [layout.object("renderer", innerLayout)];
        });
    }

    mapToForm(field: CmsModelField) {
        const renderer = typeof field.renderer === "object" ? field.renderer : null;
        const rendererName = renderer ? renderer.name : "";
        const settings = renderer ? (renderer.settings ?? {}) : {};

        const result: Record<string, unknown> = {
            name: rendererName
        };

        for (const r of this.allRenderers) {
            if (r.buildSettingsForm) {
                result[`settings__${r.rendererName}`] =
                    r.rendererName === rendererName ? settings : {};
            }
        }

        return { renderer: result };
    }

    mapFromForm(formData: Record<string, any>, field: CmsModelField) {
        const rendererName = formData.renderer?.name || "";
        const settingsKey = `settings__${rendererName}`;
        const settings = formData.renderer?.[settingsKey] ?? {};

        field.renderer = {
            name: rendererName,
            settings
        };
    }

    private collectRendererSettings(renderers: ICmsFieldRenderer[]): RendererSettingsBuild[] {
        const builds: RendererSettingsBuild[] = [];

        for (const renderer of renderers) {
            if (!renderer.buildSettingsForm) {
                continue;
            }

            const fieldsFns: RendererSettingsBuild["fieldsFns"] = [];
            const layoutFns: RendererSettingsBuild["layoutFns"] = [];

            const builder: ICmsFieldRendererFormBuilder = {
                fields: fn => {
                    fieldsFns.push(fn);
                },
                layout: fn => {
                    layoutFns.push(fn);
                }
            };

            renderer.buildSettingsForm(builder);

            if (fieldsFns.length > 0) {
                builds.push({ rendererName: renderer.rendererName, fieldsFns, layoutFns });
            }
        }

        return builds;
    }
}

export const AppearanceGroup = CmsFieldEditorGroup.createImplementation({
    implementation: AppearanceGroupImpl,
    dependencies: [[CmsFieldRenderer, { multiple: true }]]
});
