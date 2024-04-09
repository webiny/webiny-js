import React, { Fragment, useCallback, useMemo } from "react";
import { Grid, Cell } from "@webiny/ui/Grid";
import { i18n } from "@webiny/app/i18n";
import { Form } from "@webiny/form";
import { useI18N } from "@webiny/app-i18n/hooks/useI18N";
import { CheckboxGroup, Checkbox } from "@webiny/ui/Checkbox";
import { Radio, RadioGroup } from "@webiny/ui/Radio";
import { I18NSecurityPermission } from "@webiny/app-i18n/types";

const t = i18n.ns("app-i18n/admin/plugins/permissionRenderer");

interface ContentPermissionsProps {
    value: I18NSecurityPermission[];
    onChange: (value: I18NSecurityPermission[]) => void;
}
export const ContentPermissions = ({ value, onChange }: ContentPermissionsProps) => {
    const { getLocales } = useI18N();

    const onFormChange = useCallback((formData: I18NSecurityPermission) => {
        let newValue: I18NSecurityPermission[] = [];
        if (Array.isArray(value)) {
            // Let's just filter out the `content*` permission objects, it's easier to build new ones from scratch.
            newValue = value.filter(item => !item.name.startsWith("content"));
        }

        const permission: I18NSecurityPermission = {
            name: "content.i18n",
            locales: undefined
        };
        if (formData.level === "locales") {
            permission.locales = Array.isArray(formData.locales) ? formData.locales : [];
        }
        newValue.push(permission);
        onChange(newValue);
    }, []);

    const formData = useMemo((): Partial<I18NSecurityPermission> => {
        const defaultData: Omit<I18NSecurityPermission, "name"> = {
            level: undefined,
            locales: []
        };
        if (Array.isArray(value) === false) {
            return defaultData;
        }

        const permission = value.find(item => item.name === "content.i18n");
        if (!permission) {
            return defaultData;
        }

        if (Array.isArray(permission.locales)) {
            return { level: "locales", locales: permission.locales };
        }

        return { level: "all" };
    }, []);

    return (
        <Form
            data={formData}
            onChange={data => {
                /**
                 * We are positive that data is I18NSecurityPermission.
                 */
                return onFormChange(data as unknown as I18NSecurityPermission);
            }}
        >
            {({ data, Bind }) => (
                <Fragment>
                    <Grid style={{ padding: "0px !important" }}>
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
                                        description={t`The user will be able to access content in the selected locales.`}
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
