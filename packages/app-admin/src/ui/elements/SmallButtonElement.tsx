import React from "react";
import { ButtonDefault, ButtonPrimary, ButtonSecondary } from "@webiny/ui/Button";
import { ButtonElement, ButtonElementConfig } from "~/ui/elements/ButtonElement";

const BUTTONS = {
    default: ButtonDefault,
    primary: ButtonPrimary,
    secondary: ButtonSecondary
};

export class SmallButtonElement<TRenderProps = any> extends ButtonElement<TRenderProps> {
    public constructor(id: string, config: ButtonElementConfig<TRenderProps>) {
        super(id, config);

        this.applyPlugins(SmallButtonElement);
    }

    public override render(props: TRenderProps): React.ReactElement {
        const Component = BUTTONS[this.getType()];
        const onClick = this.getOnClick();

        return (
            <Component small onClick={() => onClick(props)}>
                {this.getLabel()}
            </Component>
        );
    }
}
