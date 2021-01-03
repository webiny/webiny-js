import React, { useMemo } from "react";
import { useLazyQuery, useQuery } from "react-apollo";
import get from "lodash/get";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Alert } from "@webiny/ui/Alert";
import { AutoComplete } from "@webiny/ui/AutoComplete";
import styled from "@emotion/styled";
import { validation } from "@webiny/validation";
import Accordion from "@webiny/app-page-builder/editor/plugins/elementSettings/components/Accordion";
import {
    ButtonContainer,
    SimpleButton,
    classes
} from "@webiny/app-page-builder/editor/plugins/elementSettings/components/StyledComponents";
import { LIST_FORMS, GET_FORM_REVISIONS } from "./graphql";

const FormOptionsWrapper = styled("div")({
    minHeight: 250
});

const FormElementAdvancedSettings = ({ Bind, submit, data }) => {
    const listQuery = useQuery(LIST_FORMS, { fetchPolicy: "network-only" });

    const selectedForm = useMemo(() => {
        return {
            parent: get(data, "settings.form.parent"),
            revision: get(data, "settings.form.revision")
        };
    }, [data]);

    const [getFormRevisions, getQuery] = useLazyQuery(GET_FORM_REVISIONS, {
        variables: {
            id: selectedForm.parent
        }
    });

    const latestRevisions = useMemo(() => {
        const output = {
            options: [],
            value: null
        };
        if (listQuery.data) {
            const parentsList = get(listQuery, "data.formBuilder.listForms.data") || [];

            output.options = parentsList.map(({ id, name }) => ({ id, name }));
            output.value = output.options.find(item => item.id === selectedForm.parent) || null;
        }

        return output;
    }, [listQuery, selectedForm]);

    const publishedRevisions = useMemo(() => {
        const output = {
            options: [],
            value: null
        };

        if (getQuery.data) {
            const publishedRevisions = get(
                getQuery,
                "data.formBuilder.getFormRevisions.data"
            ).filter(revision => revision.published);
            output.options = publishedRevisions.map(item => ({
                id: item.id,
                name: `${item.name} (version ${item.version})`
            }));

            if (output.options.length > 0) {
                output.options.unshift({
                    id: "latest",
                    name: "Latest published revision"
                });
            }

            output.value = output.options.find(item => item.id === selectedForm.revision) || null;
        }

        return output;
    }, [getQuery, selectedForm]);

    return (
        <Accordion title={"Form"} defaultValue={true}>
            <FormOptionsWrapper>
                <Grid className={classes.simpleGrid}>
                    <Cell span={12}>
                        <Bind
                            name={"settings.form.parent"}
                            validators={validation.create("required")}
                        >
                            {({ onChange }) => (
                                <AutoComplete
                                    options={latestRevisions.options}
                                    value={latestRevisions.value}
                                    onChange={value => {
                                        onChange(value);
                                        getFormRevisions();
                                    }}
                                    label={"Form"}
                                />
                            )}
                        </Bind>
                    </Cell>
                    <Cell span={12}>
                        <Bind
                            name={"settings.form.revision"}
                            validators={validation.create("required")}
                        >
                            {({ onChange }) => {
                                const parentSelected = !!latestRevisions.value;
                                const noPublished = publishedRevisions.options.length === 0;
                                if (getQuery.loading) {
                                    return <span>Loading revisions...</span>;
                                }

                                const description = "Choose a published revision.";
                                if (parentSelected && noPublished) {
                                    return (
                                        <Alert type="danger" title="Form not published">
                                            Please publish the form and then you can insert it into
                                            your page.
                                        </Alert>
                                    );
                                } else {
                                    return (
                                        <AutoComplete
                                            label={"Revision"}
                                            description={description}
                                            disabled={!parentSelected || noPublished}
                                            options={publishedRevisions.options}
                                            value={publishedRevisions.value}
                                            onChange={onChange}
                                        />
                                    );
                                }
                            }}
                        </Bind>
                    </Cell>
                    <Cell span={12}>
                        <ButtonContainer>
                            <SimpleButton onClick={submit}>Save</SimpleButton>
                        </ButtonContainer>
                    </Cell>
                </Grid>
            </FormOptionsWrapper>
        </Accordion>
    );
};

export default FormElementAdvancedSettings;
