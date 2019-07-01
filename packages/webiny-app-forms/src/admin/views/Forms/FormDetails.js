import React from "react";
import { compose, withProps } from "recompose";
import { Query } from "react-apollo";
import { renderPlugins } from "webiny-app/plugins";
import { withRouter } from "react-router-dom";
import styled from "react-emotion";
import { Elevation } from "webiny-ui/Elevation";
import { getForm } from "webiny-app-forms/admin/viewsGraphql";
import { withSnackbar } from "webiny-admin/components";
import { get } from "lodash";

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

const EmptyFormDetails = () => {
    return (
        <EmptySelect>
            <Elevation z={2} className={"select-form"}>
                Select a form on the left side, or click the green button to create a new one.
            </Elevation>
        </EmptySelect>
    );
};

const FormDetails = ({ formId, history, query, showSnackbar, refreshForms }) => {
    if (!formId) {
        return <EmptyFormDetails />;
    }

    return (
        <Query
            query={getForm}
            variables={{ id: formId }}
            onCompleted={data => {
                const error = get(data, "cms.form.error.message");
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
                        {form && renderPlugins("forms-form-details", {
                            refreshForms,
                            form,
                            loading
                        })}
                    </DetailsContainer>
                );
            }}
        </Query>
    );
};

export default compose(
    withRouter,
    withSnackbar(),
    withProps(({ location }) => {
        const query = new URLSearchParams(location.search);
        return { formId: query.get("id"), query };
    })
)(FormDetails);
