import React from "react";
import { validation } from "@webiny/validation";
import { FieldErrorMessage } from "./fields/components/FieldErrorMessage";
import { useBind } from "@webiny/form";
import { Row } from "./Row";
import { Cell } from "./Cell";
import { ReCaptchaComponent } from "@webiny/app-page-builder-elements/renderers/form/types";

interface Props {
    component: ReCaptchaComponent;
}

export const ReCaptchaSection = ({ component: ReCaptchaComponent }: Props) => {
    const bind = useBind({
        name: "reCaptcha",
        validators: validation.create("required")
    });

    return (
        <ReCaptchaComponent>
            {({ errorMessage }) => (
                <>
                    <Row>
                        <Cell>
                            <ReCaptchaComponent onChange={bind.onChange} />
                            <FieldErrorMessage
                                isValid={bind.validation.isValid}
                                message={errorMessage}
                            />
                        </Cell>
                    </Row>
                </>
            )}
        </ReCaptchaComponent>
    );
};
