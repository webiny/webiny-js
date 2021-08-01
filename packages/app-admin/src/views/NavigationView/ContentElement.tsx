import React from "react";
import { Element } from "@webiny/ui-composer/Element";
import { DrawerContent } from "@webiny/ui/Drawer";
import { navContent } from "~/views/NavigationView/Styled";
import { TAGS } from "~/elements/NavigationMenuElement";

export class ContentElement extends Element {
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

    addElement<TElement extends Element = Element>(element: TElement): TElement {
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
