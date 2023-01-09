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
import {TermsOfServiceChildrenFunction} from "@webiny/app-page-builder-elements/renderers/form/types";

interface Props {
    message: any;
    errorMessage: any;
    onChange: any;
}

export const TermsOfServiceSection: TermsOfServiceChildrenFunction = ({ message, errorMessage, onChange }) => {
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
                        <FieldLabel>
                            <RichTextRenderer data={message} />
                        </FieldLabel>
                    </CheckboxGroup>
                    <FieldMessage isValid={bind.validation.isValid} errorMessage={errorMessage} />
                </Field>
            </Cell>
        </Row>
    );
};
