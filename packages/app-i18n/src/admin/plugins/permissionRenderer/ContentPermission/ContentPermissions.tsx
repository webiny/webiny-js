import React, { Fragment, useCallback, useMemo } from "react";
import { Grid, Cell } from "@webiny/ui/Grid";
import { i18n } from "@webiny/app/i18n";
import { gridNoPaddingClass } from "@webiny/app-security-user-management/components/permission";
import { Form } from "@webiny/form";
import { useI18N } from "@webiny/app-i18n/hooks/useI18N";
import { CheckboxGroup, Checkbox } from "@webiny/ui/Checkbox";
import { Radio, RadioGroup } from "@webiny/ui/Radio";

const t = i18n.ns("app-i18n/admin/plugins/permissionRenderer");

const createDefault = () => ({ name: "content-locales", level: "all", locales: [] });

export const ContentPermissions = ({ securityGroup, value, onChange }) => {
    const { getLocales } = useI18N();

    const onFormChange = useCallback(
        data => {
            const newValue = Array.isArray(value) ? [...value] : [];
            let permission = newValue.find(item => item.name === "content-locales");
            if (!permission) {
                newValue.push(createDefault());
                permission = newValue[newValue.length - 1];
            }

            permission.locales = data.level === "locales" ? data.locales : [];
            permission.level = data.level;
            onChange(newValue);
        },
        [securityGroup.id]
    );

    const formData = useMemo(() => {
        if (!Array.isArray(value)) {
            return createDefault();
        }

        const permission = value.find(item => item.name === "content-locales");
        if (!permission) {
            return createDefault();
        }

        return permission;
    }, [securityGroup.id]);

    return (
        <Form data={formData} onChange={onFormChange}>
            {({ data, Bind }) => (
                <Fragment>
                    <Grid className={gridNoPaddingClass}>
                        <Cell span={12}>
                            <Bind name={"level"}>
                                <RadioGroup label={t`Content can be accessed on:`}>
                                    {({ getValue, onChange }) => (
                                        <React.Fragment>
                                            <Radio
                                                label={t`All locales`}
                                                value={getValue("all")}
                                                onChange={onChange("all")}
                                            />
                                            <Radio
                                                label={t`Specific locales`}
                                                value={getValue("locales")}
                                                onChange={onChange("locales")}
                                            />
                                        </React.Fragment>
                                    )}
                                </RadioGroup>
                            </Bind>
                        </Cell>
                        {data.level === "locales" && (
                            <Cell span={12}>
                                <Bind name={"locales"}>
                                    <CheckboxGroup
                                        label={t`Available Locales`}
                                        description={t`The user will be able to manage content in the selected locales.`}
                                    >
                                        {({ onChange, getValue }) =>
                                            getLocales().map(({ code }) => (
                                                <Checkbox
                                                    key={code + data.level}
                                                    label={code}
                                                    value={getValue(code)}
                                                    onChange={onChange(code)}
                                                />
                                            ))
                                        }
                                    </CheckboxGroup>
                                </Bind>
                            </Cell>
                        )}
                    </Grid>
                </Fragment>
            )}
        </Form>
    );
};
