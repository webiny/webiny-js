import React from "react";
import { css } from "emotion";
import { Element, ElementConfig } from "@webiny/ui-composer/Element";
import { TopAppBarSecondary, TopAppBarSection } from "@webiny/ui/TopAppBar";
import { IconButton } from "@webiny/ui/Button";
import { ReactComponent as CloseIcon } from "@webiny/app-admin/components/OverlayLayout/icons/close.svg";
import { PlaceholderElement } from "@webiny/ui-composer/elements/PlaceholderElement";
import { HeaderTitleElement } from "./HeaderTitleElement";

interface HeaderElementConfig extends ElementConfig {
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

export class HeaderElement extends Element<HeaderElementConfig> {
    private _leftSection: Element = new PlaceholderElement("leftSection");
    private _centerSection: Element;
    private _rightSection: Element = new PlaceholderElement("rightSection");

    constructor(id: string, config: HeaderElementConfig) {
        super(id, config);

        this._centerSection = new HeaderTitleElement("title", {
            title: () => {
                return typeof this.config.getTitle === "function" ? this.config.getTitle() : null;
            }
        });

        this.toggleGrid(false);
    }

    setTitle(title: GetterWithoutProps<string>) {
        this.config.getTitle = title;
    }

    setLeftSectionElement(element: Element) {
        this._leftSection = element;
    }

    setCenterSectionElement(element: Element) {
        this._centerSection = element;
    }

    setRightSectionElement(element: Element) {
        this._rightSection = element;
    }

    getLeftSectionElement() {
        return this._leftSection;
    }

    getCenterSectionElement() {
        return this._centerSection;
    }

    getRightSectionElement() {
        return this._rightSection;
    }

    render(props): React.ReactNode {
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
