import React, { Fragment, useCallback, useMemo } from "react";
import { Grid, Select } from "@webiny/admin-ui";
import { i18n } from "@webiny/app/i18n/index.js";
import { PermissionInfo, gridWithPaddingClass } from "@webiny/app-admin";
import { Form } from "@webiny/form";

const t = i18n.ns("app-file-manager/admin/plugins/permissionRenderer");

const WEBSITE_BUILDER = "wb";
const WEBSITE_BUILDER_FULL_ACCESS = `${WEBSITE_BUILDER}.*`;

const FULL_ACCESS = "full";
const NO_ACCESS = "no";

const NO_ACCESS_DATA = { accessLevel: NO_ACCESS };

interface WebsiteBuilderPermissionItem {
    accessLevel?: string;
    name?: string;
}
interface WebsiteBuilderPermissionsProps {
    value: WebsiteBuilderPermissionItem;
    onChange: (value: WebsiteBuilderPermissionItem[]) => void;
}

export const WebsiteBuilderPermissions = ({ value, onChange }: WebsiteBuilderPermissionsProps) => {
    const onFormChange = useCallback(
        (data: WebsiteBuilderPermissionItem) => {
            let newValue: WebsiteBuilderPermissionItem[] = [];
            if (Array.isArray(value)) {
                // Let's just filter out the `file-manager*` permission objects, it's easier to build new ones from scratch.
                newValue = value.filter(item => !item.name.startsWith(WEBSITE_BUILDER));
            }

            if (data.accessLevel === NO_ACCESS) {
                onChange(newValue);
                return;
            }

            if (data.accessLevel === FULL_ACCESS) {
                newValue.push({ name: WEBSITE_BUILDER_FULL_ACCESS });
                onChange(newValue);
                return;
            }

            onChange(newValue);
        },
        [value]
    );

    const formData = useMemo((): WebsiteBuilderPermissionItem => {
        if (!Array.isArray(value)) {
            return NO_ACCESS_DATA;
        }

        const hasFullAccess = value.find(
            item => item.name === WEBSITE_BUILDER_FULL_ACCESS || item.name === "*"
        );

        if (hasFullAccess) {
            return { accessLevel: FULL_ACCESS };
        }

        return NO_ACCESS_DATA;
    }, []);

    return (
        <Form data={formData} onChange={onFormChange}>
            {({ Bind }) => (
                <Fragment>
                    <Grid className={gridWithPaddingClass}>
                        <Grid.Column span={6}>
                            <PermissionInfo title={t`Access Level`} />
                        </Grid.Column>
                        <Grid.Column span={6}>
                            <Bind name={"accessLevel"}>
                                <Select
                                    options={[
                                        {
                                            value: NO_ACCESS,
                                            label: t`No access`
                                        },
                                        {
                                            value: FULL_ACCESS,
                                            label: t`Full access`
                                        }
                                    ]}
                                />
                            </Bind>
                        </Grid.Column>
                    </Grid>
                </Fragment>
            )}
        </Form>
    );
};
