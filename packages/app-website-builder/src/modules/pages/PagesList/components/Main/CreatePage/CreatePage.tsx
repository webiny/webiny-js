import React, { useMemo } from "react";
import { Grid, Select } from "@webiny/admin-ui";
import { useBind } from "@webiny/form";
import { validation } from "@webiny/validation";
import { useDialogs } from "@webiny/app-admin";
import { useCreatePage } from "~/features/pages/index.js";
import type { CreatePageParams } from "~/features/pages/createPage/ICreatePageUseCase.js";
import { useEditPageUrl } from "~/modules/pages/PagesList/hooks/useEditPageUrl.js";
import { useGetPageType, usePageTypes } from "~/features/index.js";

export const useCreatePageDialog = (folderId: string) => {
    const dialog = useDialogs();
    const { createPage } = useCreatePage();
    const { goToPageEditor } = useEditPageUrl();
    const { getPageType } = useGetPageType();

    const showCreatePageDialog = () => {
        dialog.showDialog({
            title: "Create a Page",
            acceptLabel: "Create",
            cancelLabel: "Cancel",
            content: <CreatePageWizard />,
            formData: {},
            onAccept: async ({ type, ...formData }) => {
                const pageType = getPageType(type);

                if (!pageType) {
                    // This edge-case can hardly happen, but let's still check for it.
                    return;
                }

                const input: CreatePageParams = {
                    location: {
                        folderId
                    },
                    properties: {
                        ...(formData.properties ?? {})
                    },
                    extensions: {
                        ...(formData.extensions ?? {})
                    },
                    metadata: {
                        documentType: "page",
                        pageType: type,
                        ...(formData.metadata ?? {})
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
                goToPageEditor(result.id);
            }
        });
    };

    return { showCreatePageDialog };
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

    const pageType = pageTypes.find(type => type.name === pageTypeBind.value);

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
            <>{pageType ? pageType.element : null}</>
        </Grid>
    );
};
