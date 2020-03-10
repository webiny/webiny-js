import React from "react";
import { Query } from "react-apollo";
import { renderPlugins } from "@webiny/app/plugins";
import useReactRouter from "use-react-router";
import styled from "@emotion/styled";
import { Elevation } from "@webiny/ui/Elevation";
import { GET_CONTENT_MODEL } from "@webiny/app-headless-cms/admin/viewsGraphql";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { get } from "lodash";
import { Tabs } from "@webiny/ui/Tabs";
import { i18n } from "@webiny/app/i18n";
const t = i18n.ns("app-headless-cms/admin/views/content-models");

const EmptySelect = styled("div")({
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--mdc-theme-on-surface)",
    ".select-form": {
        maxWidth: 400,
        padding: "50px 100px",
        textAlign: "center",
        display: "block",
        borderRadius: 2,
        backgroundColor: "var(--mdc-theme-surface)"
    }
});

const DetailsContainer = styled("div")({
    height: "calc(100% - 10px)",
    overflow: "hidden",
    position: "relative",
    nav: {
        backgroundColor: "var(--mdc-theme-surface)"
    }
});

const EmptyContentModelDetails = () => {
    return (
        <EmptySelect>
            <Elevation z={2} className={"select-form"}>
                {t`Select a content model on the left side, or click the green button to create a new one.`}
            </Elevation>
        </EmptySelect>
    );
};

export type ContentModelDetailsProps = {
    refreshForms: () => void;
};

const ContentModelDetails = ({ refreshForms }: ContentModelDetailsProps) => {
    const { location, history } = useReactRouter();
    const { showSnackbar } = useSnackbar();
    const query = new URLSearchParams(location.search);
    const formId = query.get("id");

    if (!formId) {
        return <EmptyContentModelDetails />;
    }

    return (
        <Query
            query={GET_CONTENT_MODEL}
            variables={{ id: formId }}
            onCompleted={data => {
                const error = get(data, "forms.form.error.message");
                if (error) {
                    query.delete("id");
                    history.push({ search: query.toString() });
                    showSnackbar(error);
                }
            }}
        >
            {({ data, loading }) => {
                const form = get(data, "forms.form.data") || null;
                return (
                    <DetailsContainer>
                        {form && (
                            <Tabs>
                                {renderPlugins(
                                    "forms-form-details-revision-content",
                                    { refreshForms, form, loading },
                                    { wrapper: false }
                                )}
                            </Tabs>
                        )}
                    </DetailsContainer>
                );
            }}
        </Query>
    );
};

export default ContentModelDetails;
