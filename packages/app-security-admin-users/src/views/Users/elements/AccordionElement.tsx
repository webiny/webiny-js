import React from "react";
import { LayoutElement } from "~/views/Users/elements/LayoutElement";
import { Accordion, AccordionItem } from "@webiny/ui/Accordion";

interface Item {
    id: string;
    title: string;
    description: string;
    icon: React.ReactElement<any>;
    open?: boolean;
}

export class AccordionItemElement extends LayoutElement<Item> {
    constructor(id, config: Item) {
        super(id, config);
    }
    
    setTitle(title: string) {
        this._config.title = title;
    }

    setDescription(description: string) {
        this._config.description = description;
    }

    render(props: any): any {
        return <AccordionItem {...this._config}>{super.render(props) as any}</AccordionItem>;
    }
}

interface Config {
    items: Item[];
}

export class AccordionElement extends LayoutElement<Config> {
    constructor(id, config: Config) {
        super(id, config);

        this.disableGrid();

        this._config.items.forEach(item => {
            this.addElement(new AccordionItemElement(item.id, item));
        });
    }

    render(props: any): any {
        return <Accordion elevation={0}>{super.render(props)}</Accordion>;
    }
}
