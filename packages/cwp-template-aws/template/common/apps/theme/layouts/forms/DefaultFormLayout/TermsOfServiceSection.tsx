import React from "react";
import { validation } from "@webiny/validation";
import { RichTextRenderer } from "@webiny/react-rich-text-renderer";
import { FieldMessage } from "./fields/components/FieldMessage";
import { useBind } from "@webiny/form";
import { Field } from "./fields/components/Field";
import { Row } from "./Row";
import { Cell } from "./Cell";
import { FieldLabel } from "./fields/components/FieldLabel";
import { CheckboxButton, CheckboxGroup } from "./fields/Checkbox";
import {
    TermsOfServiceComponent,
    TermsOfServiceChildrenFunction
} from "@webiny/app-page-builder-elements/renderers/form/types";
import styled from "@emotion/styled";
import { typography } from "../../../theme";

interface Props {
    component: TermsOfServiceComponent;
}

const RteFieldLabel = styled(FieldLabel)`
    .rte-block-paragraph {
        ${typography.paragraph1};
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
                    <FieldMessage isValid={bind.validation.isValid} errorMessage={errorMessage} />
                </Field>
            </Cell>
        </Row>
    );
};

export const TermsOfServiceSection: React.FC<Props> = ({ component: TermsOfServiceComponent }) => {
    return <TermsOfServiceComponent>{renderCheckbox}</TermsOfServiceComponent>;
};
