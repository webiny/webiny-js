import React from "react";
import { validation } from "@webiny/validation";
import { RichTextRenderer } from "@webiny/react-rich-text-renderer";
import { FieldErrorMessage } from "./fields/components/FieldErrorMessage";
import { useBind } from "@webiny/form";
import { Field } from "./fields/components/Field";
import { Row } from "./Row";
import { Cell } from "./Cell";
import { FieldLabelStyled } from "./fields/components/FieldLabel";
import { CheckboxButton, CheckboxGroup } from "./fields/Checkbox";
import {
    TermsOfServiceComponent,
    TermsOfServiceChildrenFunction
} from "@webiny/app-page-builder-elements/renderers/form/types";
import styled from "@emotion/styled";

interface Props {
    component: TermsOfServiceComponent;
}

const RteFieldLabel = styled(FieldLabelStyled)`
    .rte-block-paragraph {
        ${props => props.theme.styles.typography["paragraphs"].stylesById("paragraph1")};
        margin: 0;
    }
`;

export const renderCheckbox: TermsOfServiceChildrenFunction = ({
    onChange,
    errorMessage,
    message
}) => {
    const bind = useBind({
        name: "tosAccepted",
        validators: validation.create("required"),
        afterChange: onChange
    });

    return (
        <Row>
            <Cell>
                <Field>
                    <CheckboxGroup>
                        <CheckboxButton
                            name={"webiny-tos-checkbox"}
                            type="checkbox"
                            id="webiny-tos-checkbox"
                            checked={Boolean(bind.value)}
                            onChange={() => bind.onChange(!bind.value)}
                        />
                        <RteFieldLabel>
                            <RichTextRenderer data={message} />
                        </RteFieldLabel>
                    </CheckboxGroup>
                    <FieldErrorMessage isValid={bind.validation.isValid} message={errorMessage} />
                </Field>
            </Cell>
        </Row>
    );
};

export const TermsOfServiceSection = ({ component: TermsOfServiceComponent }: Props) => {
    return <TermsOfServiceComponent>{renderCheckbox}</TermsOfServiceComponent>;
};
