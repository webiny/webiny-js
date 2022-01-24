import React, { useCallback, useState } from "react";
import get from "lodash/get";
import { css } from "emotion";
import styled from "@emotion/styled";
import {
    Dialog,
    DialogActions,
    DialogButton,
    DialogCancel,
    DialogContent,
    DialogTitle
} from "@webiny/ui/Dialog";
import { ButtonDefault, ButtonIcon } from "@webiny/ui/Button";
import { useSnackbar } from "@webiny/app-admin";
import { i18n } from "@webiny/app/i18n";
import { ReactComponent as AddIcon } from "@webiny/app-admin/assets/icons/add-18px.svg";
import { Provider as ContentEntriesProvider } from "~/admin/views/contentEntries/ContentEntriesContext";
import { Provider as ContentEntryProvider } from "~/admin/views/contentEntries/ContentEntry/ContentEntryContext";
import { ContentEntryForm } from "~/admin/components/ContentEntryForm/ContentEntryForm";
import { useQuery } from "~/admin/hooks";
import { GET_CONTENT_MODEL } from "~/admin/graphql/contentModels";
import { useContentEntry } from "~/admin/views/contentEntries/hooks/useContentEntry";
import { useNewRefEntryDialog } from "../hooks/useNewRefEntryDialog";

const t = i18n.ns("app-headless-cms/admin/fields/ref");

const dialogContentStyles = css`
    width: 786px;
`;

const dialogContainerStyles = css`
    /*
* By default, a Dialog component has the "z-index" value of 20.
* As we are rendering the content entry form in a "Dialog", the File Manager view triggered by a "file" field 
* will render below the source form, rendering it useless for the user.
*
* To fix that issue, we're setting the "z-index" CSS property for this particular Dialog to less than 18,
* which is the "z-index" value assigned to File Manager view, so that it will render below the File Manager view as expected.  
*/

    &.mdc-dialog {
        z-index: 17;
    }
`;

const EntryForm = ({ onCreate }) => {
    const { setFormRef, contentModel } = useContentEntry();

    return (
        <ContentEntryForm
            contentModel={contentModel}
            onSubmit={onCreate}
            onForm={form => setFormRef(form)}
            entry={{}}
            addEntryToListCache={false}
        />
    );
};

const DialogSaveButton = () => {
    const { form } = useContentEntry();

    return <DialogButton onClick={() => form.current.submit()}>{t`Save`}</DialogButton>;
};

const DefaultButton = styled(ButtonDefault)`
    margin-left: 32px;
`;

export const NewEntryButton = () => {
    const { setOpen } = useNewRefEntryDialog();
    return (
        <DefaultButton small={true} onClick={() => setOpen(true)}>
            <ButtonIcon icon={<AddIcon />} />
            {t`New Entry`}
        </DefaultButton>
    );
};

interface NewRefEntryProps {
    modelId: string;
    children: React.ReactElement;
    onChange: Function;
}

const NewRefEntryFormDialog: React.FC<NewRefEntryProps> = ({ modelId, children, onChange }) => {
    const [contentModel, setContentModel] = useState<any>();

    const { showSnackbar } = useSnackbar();

    useQuery(GET_CONTENT_MODEL, {
        skip: !modelId,
        variables: { modelId },
        onCompleted: data => {
            const contentModelData = get(data, "getContentModel.data");
            if (contentModelData) {
                return setContentModel(contentModelData);
            }

            showSnackbar(
                t`Could not load content for model "{modelId}". Redirecting...`({
                    modelId
                })
            );
        }
    });

    const { open, setOpen } = useNewRefEntryDialog();
    const hideDialog = useCallback(() => setOpen(false), []);

    const onCreate = useCallback(
        entry => {
            onChange(entry);
            /* 
            Close the modal
             */
            setOpen(false);
        },
        [modelId, onChange]
    );

    if (!contentModel) {
        return children;
    }

    return (
        <ContentEntriesProvider
            contentModel={contentModel}
            key={contentModel.modelId}
            insideDialog={true}
        >
            <ContentEntryProvider isNewEntry={() => true} getContentId={() => null}>
                <Dialog open={open} onClose={hideDialog} className={dialogContainerStyles}>
                    <DialogTitle>
                        {t`New {modelName} Entry`({ modelName: contentModel.name })}
                    </DialogTitle>
                    <DialogContent className={dialogContentStyles}>
                        <EntryForm onCreate={onCreate} />
                    </DialogContent>
                    <DialogActions>
                        <DialogCancel>{t`Cancel`}</DialogCancel>
                        <DialogSaveButton />
                    </DialogActions>
                </Dialog>
                {children}
            </ContentEntryProvider>
        </ContentEntriesProvider>
    );
};

export default NewRefEntryFormDialog;
