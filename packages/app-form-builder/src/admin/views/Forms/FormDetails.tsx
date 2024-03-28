import React from "react";
import { useQuery } from "@apollo/react-hooks";
import { renderPlugins } from "@webiny/app/plugins";
import { useRouter } from "@webiny/react-router";
import styled from "@emotion/styled";
import {
    GET_FORM,
    GET_FORM_REVISIONS,
    GetFormRevisionQueryResponse,
    GetFormRevisionQueryVariables,
    GetFormRevisionsQueryResponse,
    GetFormRevisionsQueryVariables
} from "../../graphql";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { Tabs } from "@webiny/ui/Tabs";
import { CircularProgress } from "@webiny/ui/Progress";
import { ButtonDefault, ButtonIcon } from "@webiny/ui/Button";
import { useSecurity } from "@webiny/app-security";
import EmptyView from "@webiny/app-admin/components/EmptyView";
import { ReactComponent as AddIcon } from "@webiny/app-admin/assets/icons/add-18px.svg";
import { i18n } from "@webiny/app/i18n";
import { useForms } from "./useForms";

const t = i18n.ns("app-form-builder/admin/views/forms/form-details");

const DetailsContainer = styled("div")({
    height: "100%",
    overflow: "hidden",
    position: "relative",
    ".mdc-tab-bar": {
        backgroundColor: "var(--mdc-theme-surface)"
    }
});

interface EmptyFormDetailsProps {
    onCreateForm: () => void;
    canCreate: () => boolean;
}
const EmptyFormDetails = ({ canCreate, onCreateForm }: EmptyFormDetailsProps) => {
    return (
        <EmptyView
            title={t`Click on the left side list to display form details {message}`({
                message: canCreate() ? " or create a..." : ""
            })}
            action={
                canCreate() ? (
                    <ButtonDefault data-testid="new-record-button" onClick={onCreateForm}>
                        <ButtonIcon icon={<AddIcon />} /> {t`New Form`}
                    </ButtonDefault>
                ) : null
            }
        />
    );
};

export interface FormDetailsProps {
    onCreateForm: () => void;
}

const FormDetails = ({ onCreateForm }: FormDetailsProps) => {
    const { location, history } = useRouter();
    const { showSnackbar } = useSnackbar();
    const security = useSecurity();
    const query = new URLSearchParams(location.search + location.hash);
    const formId = query.get("id");

    const { listQuery, canCreate } = useForms();

    const refreshForms = listQuery.refetch;

    const getForm = useQuery<GetFormRevisionQueryResponse, GetFormRevisionQueryVariables>(
        GET_FORM,
        {
            variables: {
                revision: formId as string
            },
            skip: !formId,
            onCompleted: data => {
                if (!data) {
                    return;
                }

                const { error, data: formData } = data.formBuilder.form;
                if (error) {
                    query.delete("id");
                    history.push({ search: query.toString() });
                    showSnackbar(error.message);
                }
                if (!formData) {
                    query.delete("id");
                    history.push({ search: query.toString() });
                    showSnackbar(t`Could not load form with given ID.`);
                }
            }
        }
    );

    const getRevisions = useQuery<GetFormRevisionsQueryResponse, GetFormRevisionsQueryVariables>(
        GET_FORM_REVISIONS,
        {
            variables: {
                id: (formId || "").split("#")[0]
            },
            skip: !formId
        }
    );

    if (!formId) {
        return <EmptyFormDetails canCreate={canCreate} onCreateForm={onCreateForm} />;
    }

    const form = getForm.loading || !getForm.data ? null : getForm.data.formBuilder.form.data;
    const revisions =
        getRevisions.loading || !getRevisions.data
            ? []
            : getRevisions.data.formBuilder.revisions.data;

    return (
        <DetailsContainer>
            {getForm.loading && <CircularProgress label={"Loading details..."} />}
            {form && (
                <Tabs>
                    {renderPlugins(
                        "forms-form-details-revision-content",
                        { security, refreshForms, form, revisions, loading: getForm.loading },
                        { wrapper: false }
                    )}
                </Tabs>
            )}
        </DetailsContainer>
    );
};

export default FormDetails;
