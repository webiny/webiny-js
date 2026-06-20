import React, { useMemo, useCallback } from "react";
import { observer } from "mobx-react-lite";
import { useContainer } from "@webiny/app";
import { createObjectFieldRenderer } from "@webiny/app-admin/features/formModel/createFieldRenderer.js";
import type { IObjectFieldVM } from "@webiny/app-admin/features/formModel/abstractions.js";
import { Accordion, Input, Switch, Text, Tooltip } from "@webiny/admin-ui";
import { CmsFieldValidator } from "~/presentation/fieldValidators/abstractions.js";
import type { ICmsFieldValidator } from "~/presentation/fieldValidators/abstractions.js";
import { useModelField } from "~/admin/components/ModelFieldProvider/index.js";
import type { CmsModelFieldValidator } from "@webiny/app-headless-cms-common/types/validation.js";

declare module "@webiny/app-admin/features/formModel/abstractions.js" {
    interface IFieldRendererRegistry {
        cmsValidators: { fieldType: "object"; settings: undefined };
    }
}

export const CmsValidatorsRenderer = createObjectFieldRenderer(({ field }) => {
    if (!field.isList) {
        return null;
    }

    return <ValidatorsList field={field} />;
});

interface ValidatorsListProps {
    field: IObjectFieldVM;
}

const ValidatorsList = observer(({ field }: ValidatorsListProps) => {
    const container = useContainer();
    const { field: cmsField } = useModelField();

    const validators = useMemo(() => {
        return container.resolveAll(CmsFieldValidator);
    }, [container]);

    const enabledValidators: CmsModelFieldValidator[] = Array.isArray(field.value)
        ? field.value
        : [];

    const updateValidators = useCallback(
        (updated: CmsModelFieldValidator[]) => {
            field.onChange(updated);
        },
        [field]
    );

    const toggleValidator = useCallback(
        (validator: ICmsFieldValidator) => {
            const existing = enabledValidators.find(v => v.name === validator.name);
            if (existing) {
                updateValidators(enabledValidators.filter(v => v.name !== validator.name));
            } else {
                updateValidators([
                    ...enabledValidators,
                    {
                        name: validator.name,
                        settings: validator.defaultSettings,
                        message: validator.defaultMessage
                    }
                ]);
            }
        },
        [enabledValidators, updateValidators]
    );

    const updateValidatorData = useCallback(
        (validatorName: string, data: Partial<CmsModelFieldValidator>) => {
            updateValidators(
                enabledValidators.map(v => (v.name === validatorName ? { ...v, ...data } : v))
            );
        },
        [enabledValidators, updateValidators]
    );

    if (validators.length === 0) {
        return null;
    }

    return (
        <Accordion>
            {validators.map(validator => {
                const data = enabledValidators.find(v => v.name === validator.name);
                const isEnabled = Boolean(data);

                return (
                    <ValidatorItem
                        key={validator.name}
                        validator={validator}
                        data={data}
                        isEnabled={isEnabled}
                        onToggle={() => toggleValidator(validator)}
                        onUpdate={patch => updateValidatorData(validator.name, patch)}
                    />
                );
            })}
        </Accordion>
    );
});

interface ValidatorItemProps {
    validator: ICmsFieldValidator;
    data: CmsModelFieldValidator | undefined;
    isEnabled: boolean;
    onToggle: () => void;
    onUpdate: (patch: Partial<CmsModelFieldValidator>) => void;
}

const ValidatorItem = observer(
    ({ validator, data, isEnabled, onToggle, onUpdate }: ValidatorItemProps) => {
        const variableHints = useMemo(() => {
            if (!validator.variables || validator.variables.length === 0) {
                return null;
            }
            return (
                <span>
                    Available variables:{" "}
                    {validator.variables.map((v, i) => (
                        <React.Fragment key={v.name}>
                            {i > 0 && ", "}
                            <Tooltip
                                content={v.description}
                                side={"bottom"}
                                trigger={
                                    <strong style={{ cursor: "pointer" }}>{`{${v.name}}`}</strong>
                                }
                            />
                        </React.Fragment>
                    ))}
                    .
                </span>
            );
        }, [validator.variables]);

        return (
            <Accordion.Item
                interactive={false}
                open={isEnabled}
                title={validator.label}
                description={validator.description}
                actions={
                    <Switch label="Enabled" checked={isEnabled} onChange={() => onToggle()} />
                }
            >
                {data ? (
                    <div className={"flex flex-col gap-md p-md"}>
                        <Input
                            label={"Message"}
                            value={data.message || ""}
                            onChange={value => onUpdate({ message: value || undefined })}
                            description={
                                <>
                                    This message will be displayed to the user.{" "}
                                    {variableHints}
                                </>
                            }
                        />
                    </div>
                ) : null}
            </Accordion.Item>
        );
    }
);
