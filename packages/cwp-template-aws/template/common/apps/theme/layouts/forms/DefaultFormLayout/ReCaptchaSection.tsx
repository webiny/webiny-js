import React from "react";
import { validation } from "@webiny/validation";
import { FieldMessage } from "./fields/components/FieldMessage";
import { useBind } from "@webiny/form";
import { Row } from "./Row";
import { Cell } from "./Cell";
import { ReCaptchaComponent } from "@webiny/app-page-builder-elements/renderers/form/types";

interface Props {
    component: ReCaptchaComponent;
}

export const ReCaptchaSection: React.FC<Props> = ({ component: ReCaptchaComponent }) => {
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
                            <FieldMessage
                                isValid={bind.validation.isValid}
                                errorMessage={errorMessage}
                            />
                        </Cell>
                    </Row>
                </>
            )}
        </ReCaptchaComponent>
    );
};
