import * as React from "react";
import { Query } from "react-apollo";
import { get } from "lodash";
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
import { LIST_FORMS } from "./graphql";

const FormOptionsWrapper = styled("div")({
    minHeight: 250
});

const getOptions = ({ gqlResponse, data }) => {
    const output = {
        parents: {
            options: [],
            value: null
        },
        publishedRevisions: {
            options: [],
            value: null
        }
    };

    const selected = {
        parent: get(data, "settings.form.parent"),
        revision: get(data, "settings.form.revision")
    };

    const parentsList = get(gqlResponse, "data.formBuilder.listForms.data") || [];

    output.parents.options = parentsList.map(({ parent, name }) => ({ id: parent, name }));
    output.parents.value = output.parents.options.find(item => item.id === selected.parent) || null;

    const parent = parentsList.find(item => item.parent === selected.parent);
    if (parent) {
        output.publishedRevisions.options = parent.publishedRevisions.map(item => ({
            id: item.id,
            name: `${item.name} (version ${item.version})`
        }));
        if (output.publishedRevisions.options.length > 0) {
            output.publishedRevisions.options.unshift({
                id: "latest",
                name: "Latest published revision"
            });
        }

        output.publishedRevisions.value =
            output.publishedRevisions.options.find(item => item.id === selected.revision) || null;
    }

    return output;
};

const FormElementAdvancedSettings = ({ Bind, submit, data }) => {
    return (
        <Accordion title={"Form"} defaultValue={true}>
            <FormOptionsWrapper>
                <Query query={LIST_FORMS} fetchPolicy="network-only">
                    {gqlResponse => {
                        const options = getOptions({ gqlResponse, data });
                        return (
                            <Grid className={classes.simpleGrid}>
                                <Cell span={12}>
                                    <Bind
                                        name={"settings.form.parent"}
                                        validators={validation.create("required")}
                                    >
                                        {({ onChange }) => (
                                            <AutoComplete
                                                options={options.parents.options}
                                                value={options.parents.value}
                                                onChange={onChange}
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
                                            const parentSelected = !!options.parents.value;
                                            const noPublished =
                                                options.publishedRevisions.options.length === 0;

                                            const description = "Choose a published revision.";
                                            if (parentSelected && noPublished) {
                                                return (
                                                    <Alert type="danger" title="Form not published">
                                                        Please publish the form and then you can
                                                        insert it into your page.
                                                    </Alert>
                                                );
                                            } else {
                                                return (
                                                    <AutoComplete
                                                        label={"Revision"}
                                                        description={description}
                                                        disabled={!parentSelected || noPublished}
                                                        options={options.publishedRevisions.options}
                                                        value={options.publishedRevisions.value}
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
                        );
                    }}
                </Query>
            </FormOptionsWrapper>
        </Accordion>
    );
};

export default FormElementAdvancedSettings;
