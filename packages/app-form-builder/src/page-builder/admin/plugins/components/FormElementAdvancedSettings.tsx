import React, { useMemo } from "react";
import { useQuery } from "@apollo/react-hooks";
import get from "lodash/get";
import { Grid, Cell } from "@webiny/ui/Grid";
import { AutoComplete } from "@webiny/ui/AutoComplete";
import styled from "@emotion/styled";
import { validation } from "@webiny/validation";
import Accordion from "@webiny/app-page-builder/editor/plugins/elementSettings/components/Accordion";
import {
    ButtonContainer,
    SimpleButton,
    classes
} from "@webiny/app-page-builder/editor/plugins/elementSettings/components/StyledComponents";
import { LIST_FORMS, ListFormsQueryResponse } from "./graphql";
import { BindComponent, FormOnSubmit } from "@webiny/form";

const FormOptionsWrapper = styled("div")({
    minHeight: 150
});

interface FormElementAdvancedSettingsProps {
    Bind: BindComponent;
    submit: FormOnSubmit;
    data: Record<string, any>;
}

const FormElementAdvancedSettings = ({ Bind, submit, data }: FormElementAdvancedSettingsProps) => {
    const listQuery = useQuery<ListFormsQueryResponse>(LIST_FORMS, {
        fetchPolicy: "network-only"
    });

    const publishedForms = listQuery?.data?.formBuilder.listForms.data || [];

    const publishedFormsOptions = useMemo(
        () =>
            publishedForms.map(publishedForm => ({
                id: publishedForm.formId,
                name: publishedForm.name
            })),
        [publishedForms]
    );

    const selectedOption = useMemo(() => {
        const formId = get(data, "settings.form.parent");

        return publishedFormsOptions.find(option => option.id === formId);
    }, [data, publishedFormsOptions]);

    // required so ts build does not break
    const buttonProps: any = {};

    return (
        <Accordion title={"Form"} defaultValue={true}>
            <FormOptionsWrapper>
                <Grid className={classes.simpleGrid}>
                    <Cell span={12}>
                        <Bind name={"settings.form"} validators={validation.create("required")}>
                            {({ onChange }) => (
                                <AutoComplete
                                    options={publishedFormsOptions}
                                    label={"Form"}
                                    value={selectedOption}
                                    onChange={value => {
                                        // For backward compatibility we always set revision "latest" and parent the actual formId
                                        onChange({
                                            parent: value,
                                            revision: "latest"
                                        });
                                    }}
                                />
                            )}
                        </Bind>
                    </Cell>
                    <Cell span={12}>
                        <ButtonContainer {...buttonProps}>
                            <SimpleButton onClick={submit} {...buttonProps}>
                                Save
                            </SimpleButton>
                        </ButtonContainer>
                    </Cell>
                </Grid>
            </FormOptionsWrapper>
        </Accordion>
    );
};

export default FormElementAdvancedSettings;
