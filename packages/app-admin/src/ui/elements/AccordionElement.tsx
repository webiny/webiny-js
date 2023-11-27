import React from "react";
import { UIElement, UIElementConfig, UiElementRenderProps } from "~/ui/UIElement";
import { Accordion, AccordionItem } from "@webiny/ui/Accordion";

interface GetterWithProps<TProps, T> {
    (props: TProps): T;
}

interface Item<TProps = any> extends UIElementConfig {
    id: string;
    title: string;
    description: string;
    icon: React.ReactElement;
    open?: boolean | GetterWithProps<TProps, boolean>;
}

export class AccordionItemElement extends UIElement<Item> {
    public constructor(id: string, config: Item) {
        super(id, config);
    }

    public setTitle(title: string): void {
        this.config.title = title;
    }

    public setDescription(description: string): void {
        this.config.description = description;
    }

    public override render(props: UiElementRenderProps): React.ReactNode {
        const { open, ...rest } = this.config;
        const isOpened = typeof open === "function" ? open(props) : open;
        return (
            <AccordionItem open={isOpened} {...rest}>
                {super.render(props)}
            </AccordionItem>
        );
    }
}

interface Config extends UIElementConfig {
    items: Item[];
}

export class AccordionElement extends UIElement<Config> {
    public constructor(id: string, config: Config) {
        super(id, config);

        this.useGrid(false);

        this.config.items.forEach(item => {
            this.addElement(new AccordionItemElement(item.id, item));
        });
    }

    public getAccordionItemElement(id: string): AccordionItemElement {
        return this.getElement(id) as AccordionItemElement;
    }

    public override render(props: UiElementRenderProps): React.ReactNode {
        /**
         * Figure out correct way to have props.children typed.
         * TODO @ts-refactor
         */
        // @ts-expect-error
        return <Accordion elevation={0}>{super.render(props)}</Accordion>;
    }
}
