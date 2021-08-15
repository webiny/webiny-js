import React from "react";
import { UIElement } from "~/ui/UIElement";
import { DrawerContent } from "@webiny/ui/Drawer";
import { navContent } from "~/ui/views/NavigationView/Styled";
import { TAGS } from "~/ui/elements/NavigationMenuElement";

export class ContentElement extends UIElement {
    private _sorters = [];

    constructor(id: string) {
        super(id);

        this.useGrid(false);

        this.addSorter((a, b) => {
            if (a.hasTag(TAGS.APP) && b.hasTag(TAGS.UTILS)) {
                return -1;
            }

            if (a.hasTag(TAGS.UTILS) && b.hasTag(TAGS.APP)) {
                return 1;
            }

            return a.config.label.localeCompare(b.config.label);
        });
    }

    addElement<TElement extends UIElement = UIElement>(element: TElement): TElement {
        super.addElement(element);
        this.runSorters();
        return element;
    }

    addSorter(sorter: Function) {
        this._sorters.push(sorter);
    }

    render(props?: any): React.ReactNode {
        return <DrawerContent className={navContent}>{super.render(props)}</DrawerContent>;
    }

    private runSorters() {
        for (const sorter of this._sorters) {
            this.getLayout().sort(sorter);
        }
    }
}
