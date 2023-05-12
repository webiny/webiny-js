import React from "react";
import { css } from "emotion";
import { UIElement, UIElementConfig, UiElementRenderProps } from "~/ui/UIElement";
import { TopAppBarSecondary, TopAppBarSection } from "@webiny/ui/TopAppBar";
import { IconButton } from "@webiny/ui/Button";
import { ReactComponent as CloseIcon } from "@material-design-icons/svg/outlined/close.svg";
import { PlaceholderElement } from "~/ui/elements/PlaceholderElement";
import { HeaderTitleElement } from "./HeaderTitleElement";

interface HeaderElementConfig extends UIElementConfig {
    onClose: (event: React.MouseEvent) => void;
    getTitle?: GetterWithoutProps<string>;
}

const width = css({
    width: "33%"
});

// !GOOD FIRST ISSUE!
// Extract rendering and styling into a HeaderElementRenderer class.

interface GetterWithoutProps<T> {
    (): T;
}

export class HeaderElement extends UIElement<HeaderElementConfig> {
    private _leftSection: UIElement = new PlaceholderElement("leftSection");
    private _centerSection: UIElement;
    private _rightSection: UIElement = new PlaceholderElement("rightSection");

    public constructor(id: string, config: HeaderElementConfig) {
        super(id, config);

        this._centerSection = new HeaderTitleElement("title", {
            title: () => {
                return typeof this.config.getTitle === "function" ? this.config.getTitle() : null;
            }
        });

        this.useGrid(false);
    }

    public setTitle(title: GetterWithoutProps<string>): void {
        this.config.getTitle = title;
    }

    public setLeftSectionElement(element: UIElement): void {
        this._leftSection = element;
    }

    public setCenterSectionElement(element: UIElement): void {
        this._centerSection = element;
    }

    public setRightSectionElement(element: UIElement): void {
        this._rightSection = element;
    }

    public getLeftSectionElement(): UIElement {
        return this._leftSection;
    }

    public getCenterSectionElement(): UIElement {
        return this._centerSection;
    }

    public getRightSectionElement(): UIElement {
        return this._rightSection;
    }

    public override render(props: UiElementRenderProps): React.ReactNode {
        return (
            <TopAppBarSecondary fixed style={{ top: 0 }}>
                <TopAppBarSection className={width} alignStart>
                    {this.getLeftSectionElement().render(props)}
                </TopAppBarSection>
                <TopAppBarSection className={width} alignEnd>
                    {this.getCenterSectionElement().render(props)}
                </TopAppBarSection>
                <TopAppBarSection className={width} alignEnd>
                    {this.getRightSectionElement().render(props)}
                    <IconButton
                        ripple={false}
                        onClick={this.config.onClose}
                        icon={<CloseIcon style={{ width: 24, height: 24 }} />}
                    />
                </TopAppBarSection>
            </TopAppBarSecondary>
        );
    }
}
