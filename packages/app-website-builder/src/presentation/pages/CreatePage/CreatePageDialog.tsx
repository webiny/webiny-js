import React, { useEffect, useMemo } from "react";
import { useDialog } from "@webiny/app-admin";
import { Dialog, Grid, Select } from "@webiny/admin-ui";
import { Form, useBind } from "@webiny/form";
import { validation } from "@webiny/validation";
import { useOpenDialog } from "@webiny/app-admin";
import { useCreatePage } from "~/features/pages/index.js";
import type { CreatePageParams } from "~/features/pages/createPage/ICreatePageUseCase.js";
import { useEditPageUrl } from "~/modules/pages/PagesList/hooks/useEditPageUrl.js";
import { useGetPageType, usePageTypes } from "~/features/index.js";
import { createPageDialogParams } from "./createPageSchema.js";

export const CREATE_PAGE_DIALOG = "createPage";

export const useCreatePageDialog = () => {
    const { openDialog } = useOpenDialog(createPageDialogParams);

    return (folderId: string) => {
        openDialog(CREATE_PAGE_DIALOG, { folderId });
    };
};

export const CreatePageDialog = () => {
    const { params, closeDialog } = useDialog(createPageDialogParams);
    const { createPage } = useCreatePage();
    const { goToPageEditor } = useEditPageUrl();
    const { getPageType } = useGetPageType();
    const { pageTypes } = usePageTypes();

    const options = useMemo(() => {
        return Array.from(pageTypes.entries()).map(([, type]) => ({
            label: type.label,
            value: type.name
        }));
    }, [pageTypes]);

    const handleSubmit = async ({ type, ...formData }: Record<string, unknown>) => {
        const pageType = getPageType(type as string);

        if (!pageType) {
            return;
        }

        const input: CreatePageParams = {
            location: {
                folderId: params.folderId
            },
            properties: {
                ...((formData.properties as Record<string, unknown>) ?? {})
            },
            extensions: {
                ...((formData.extensions as Record<string, unknown>) ?? {})
            },
            metadata: {
                documentType: "page",
                pageType: type as string,
                ...((formData.metadata as Record<string, unknown>) ?? {})
            },
            elements: {
                root: {
                    type: "Webiny/Element",
                    id: "root",
                    component: {
                        name: "Webiny/Root"
                    }
                }
            }
        };

        const result = await createPage(input);
        closeDialog();
        goToPageEditor(result.id);
    };

    return (
        <Form onSubmit={handleSubmit} data={{}}>
            {({ submit }) => (
                <Dialog
                    open={true}
                    onClose={closeDialog}
                    title="Create a Page"
                    actions={
                        <>
                            <Dialog.CancelAction onClick={closeDialog} text="Cancel" />
                            <Dialog.ConfirmAction onClick={submit} text="Create" />
                        </>
                    }
                >
                    <CreatePageForm options={options} pageTypes={pageTypes} />
                </Dialog>
            )}
        </Form>
    );
};

interface CreatePageFormProps {
    options: { label: string; value: string }[];
    pageTypes: ReturnType<typeof usePageTypes>["pageTypes"];
}

const CreatePageForm = ({ options, pageTypes }: CreatePageFormProps) => {
    const pageTypeBind = useBind({
        name: "type",
        validators: [validation.create("required")]
    });

    useEffect(() => {
        if (options.length > 0 && !pageTypeBind.value) {
            pageTypeBind.onChange(options[0].value);
        }
    }, [options]);

    const pageType = pageTypes.find(type => type.name === pageTypeBind.value);

    return (
        <Grid>
            <Grid.Column span={12}>
                <Select
                    displayResetAction={false}
                    label={"Page Type"}
                    {...pageTypeBind}
                    value={pageTypeBind.value ?? ""}
                    options={options}
                />
            </Grid.Column>
            <>{pageType ? pageType.element : null}</>
        </Grid>
    );
};
