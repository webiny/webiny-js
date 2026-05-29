import React from "react";
import { observer } from "mobx-react-lite";
import { Skeleton } from "@webiny/admin-ui";
import type { IFormModel, IFieldVM } from "@webiny/app-admin";
import type { IPageType } from "~/presentation/pages/CreatePage/abstractions.js";
import type { CreatePageParams } from "~/features/pages/createPage/abstractions.js";
import type { IEcommerceApiProvider } from "~/features/index.js";
import type { Resource } from "../types.js";
import { ResourcesPickerButton } from "./ResourcesPicker.js";
import { toTitleCaseLabel } from "./toTitleCaseLabel.js";
import { useEcommerceApi } from "~/features/index.js";

// ---------------------------------------------------------------------------
// ResourcePicker field renderer
// ---------------------------------------------------------------------------

declare module "@webiny/app-admin/features/formModel/abstractions.js" {
    interface IFieldRendererRegistry {
        [key: `resource-picker:${string}`]: { fieldType: "text"; settings?: { rows?: number } };
    }
}

interface ResourcePickerRendererConfig {
    pluginName: string;
    resourceType: string;
}

export function createResourcePickerRenderer(config: ResourcePickerRendererConfig) {
    return observer(function ResourcePickerField({ field }: { field: IFieldVM }) {
        const { api } = useEcommerceApi(config.pluginName);

        if (!api) {
            return <Skeleton />;
        }

        return (
            <div className={"border-sm rounded-md border-neutral-muted p-sm"}>
                <ResourcesPickerButton
                    api={api}
                    resourceName={config.resourceType}
                    pluginName={config.pluginName}
                    value={field.value as string}
                    onChange={value => field.onChange(value)}
                />
            </div>
        );
    });
}

// ---------------------------------------------------------------------------
// EcommerceResourcePageType — IPageType implementation
// ---------------------------------------------------------------------------

export interface EcommerceResourcePageTypeConfig {
    name: string;
    label: string;
    resourceType: string;
    previewPath: (resource: Resource) => string;
    apiName: string;
}

export class EcommerceResourcePageType implements IPageType {
    readonly name: string;
    readonly label: string;

    constructor(
        private config: EcommerceResourcePageTypeConfig,
        private provider: IEcommerceApiProvider
    ) {
        this.name = config.name;
        this.label = config.label;
    }

    modifyForm(form: IFormModel): void {
        form.fields(fields => ({
            resourceId: fields
                .text()
                .label(toTitleCaseLabel(this.config.resourceType))
                .required()
                .renderer(`resource-picker:${this.config.apiName}`)
                .afterChange((value, f) => {
                    if (!value) {
                        return;
                    }
                    void this.onResourceSelected(String(value), f);
                })
        }));

        form.field("title").setDisabled(true);
        form.field("path").setDisabled(true);

        form.layout(layout => [layout.row("resourceId").before("title")]);
    }

    mapFromForm(data: Record<string, unknown>, input: CreatePageParams): void {
        input.metadata = input.metadata ?? {};
        input.metadata.resourceId = data.resourceId;
    }

    private async onResourceSelected(resourceId: string, form: IFormModel): Promise<void> {
        const api = await this.provider.getApi(this.config.apiName);
        if (!api) {
            return;
        }

        const resource = await api[this.config.resourceType].findById(resourceId);
        form.field("title").setValue(resource.title);
        form.field("title").setDisabled(false);
        form.field("path").setValue(this.config.previewPath(resource));
        form.field("path").setDisabled(false);
    }
}
