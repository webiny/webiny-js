import React, { Fragment, useCallback } from "react";
import { getPlugins } from "webiny-plugins";
import { Switch } from "webiny-ui/Switch";
import {
    SimpleForm,
    SimpleFormContent,
    SimpleFormHeader
} from "webiny-admin/components/SimpleForm";

function useValidatorsTab({ formProps, value, onChange, field }) {
    const { fieldType } = getPlugins("form-editor-field-type").find(
        f => f.fieldType.id === field.type
    );

    const validators = getPlugins("form-editor-field-validator")
        .map(pl => pl.validator)
        .map(v => {
            if (fieldType.validators.includes(v.id)) {
                return { optional: true, validator: v };
            } else if (fieldType.validators.includes(`!${v.id}`)) {
                return { optional: false, validator: v };
            }
            return null;
        })
        .filter(Boolean)
        .sort((a, b) => {
            if (!a.optional && b.optional) {
                return -1;
            }

            if (a.optional && !b.optional) {
                return 1;
            }

            return 0;
        });

    function createToggle(id, enabled) {
        return useCallback(() => {
            if (!enabled) {
                onChange([...value, { id }]);
            } else {
                const index = value.findIndex(v => v.id === id);
                onChange([...value.slice(0, index), ...value.slice(index + 1)]);
            }
        }, [id, enabled, value]);
    }

    function createSetValue(id, index) {
        return useCallback(
            (name, newValue) => {
                formProps.setValue(`validation.${index}.${name}`, newValue);
            },
            [id, index]
        );
    }

    function createBind(id, index) {
        const { Bind } = formProps;
        return useCallback(
            ({ children, name, ...props }) => {
                return (
                    <Bind {...props} name={`validation.${index}.${name}`}>
                        {children}
                    </Bind>
                );
            },
            [id, index]
        );
    }

    return { createBind, createToggle, createSetValue, validators, formProps };
}

const ValidatorsTab = props => {
    const { validators, createBind, createToggle, createSetValue } = useValidatorsTab(props);

    return (
        <Fragment>
            {validators.map(({ optional, validator: v }) => {
                const vIndex = props.value.findIndex(x => x.id === v.id);
                const enabled = vIndex > -1;
                const hasSettings = typeof v.renderSettings === "function";
                const Bind = createBind(v.id, vIndex);
                const setValue = createSetValue(v.id, vIndex);
                const data = props.value[vIndex];

                return (
                    <SimpleForm key={v.id}>
                        <SimpleFormHeader title={v.label} description={v.description}>
                            {optional && (
                                <Switch
                                    label="Enabled"
                                    value={enabled}
                                    onChange={createToggle(v.id, enabled)}
                                />
                            )}
                        </SimpleFormHeader>
                        {enabled && hasSettings && (
                            <SimpleFormContent>
                                {v.renderSettings({ data, setValue, Bind })}
                            </SimpleFormContent>
                        )}
                    </SimpleForm>
                );
            })}
        </Fragment>
    );
};

export default ValidatorsTab;
