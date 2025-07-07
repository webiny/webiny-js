import React, { Fragment, useMemo } from "react";
import { Button, Grid, Select } from "@webiny/admin-ui";
import { usePageTypes } from "./usePageTypes";
import { useBind } from "@webiny/form";
import { validation } from "@webiny/validation";
import { useDialogs } from "@webiny/app-admin";

export const PagesDashboard = () => {
    const dialog = useDialogs();

    const showCreatePage = () => {
        dialog.showDialog({
            title: "Create a Page",
            acceptLabel: "Create",
            cancelLabel: "Cancel",
            content: <CreatePageWizard />,
            formData: {},
            onAccept: formData => {
                console.log("formData", formData);
            }
        });
    };

    return <Button variant="primary" text="Create Dialog" onClick={showCreatePage} />;
};

const CreatePageWizard = () => {
    const { pageTypes } = usePageTypes();

    const options = useMemo(() => {
        return Array.from(pageTypes.entries()).map(([, type]) => ({
            label: type.label,
            value: type.name
        }));
    }, [pageTypes]);

    const pageTypeBind = useBind({
        name: "type",
        validators: [validation.create("required")]
    });

    const pageType = pageTypes.get(pageTypeBind.value);

    return (
        <Grid>
            <Grid.Column span={12}>
                <Select
                    label={"Page Type"}
                    {...pageTypeBind}
                    value={pageTypeBind.value ?? ""}
                    options={options}
                ></Select>
            </Grid.Column>
            <>{pageType ? <Fragment key={pageType.name}>{pageType.element}</Fragment> : null}</>
        </Grid>
    );
};
