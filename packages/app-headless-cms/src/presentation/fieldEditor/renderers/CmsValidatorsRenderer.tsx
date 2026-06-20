import React from "react";
import { observer } from "mobx-react-lite";
import { createObjectFieldRenderer } from "@webiny/app-admin/features/formModel/createFieldRenderer.js";
import { LayoutNodeRenderer } from "@webiny/app-admin/features/formModel/FormView.js";
import type { IObjectFieldVM } from "@webiny/app-admin/features/formModel/abstractions.js";
import { Accordion, Switch } from "@webiny/admin-ui";

declare module "@webiny/app-admin/features/formModel/abstractions.js" {
    interface IFieldRendererRegistry {
        cmsValidatorItem: { fieldType: "object"; settings: undefined };
    }
}

export const CmsValidatorItemRenderer = createObjectFieldRenderer(({ field }) => {
    return <ValidatorItem field={field} />;
});

interface ValidatorItemProps {
    field: IObjectFieldVM;
}

const ValidatorItem = observer(({ field }: ValidatorItemProps) => {
    const value = field.value as Record<string, unknown> | null;
    const isEnabled = Boolean(value && value.enabled);

    const toggleEnabled = (checked: boolean) => {
        field.onChange({ ...value, enabled: checked });
    };

    return (
        <Accordion.Item
            interactive={false}
            open={isEnabled}
            title={field.label}
            description={field.description}
            actions={
                <Switch label="Enabled" checked={isEnabled} onChange={toggleEnabled} />
            }
        >
            {isEnabled ? (
                <div className={"flex flex-col gap-md p-md"}>
                    {field.layout.map((node, index) => (
                        <LayoutNodeRenderer key={index} node={node} />
                    ))}
                </div>
            ) : null}
        </Accordion.Item>
    );
});
