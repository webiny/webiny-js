import React from "react";
import { LayoutElement } from "~/views/Users/elements/LayoutElement";

export interface ElementConfig extends Record<string, any> {
    shouldRender?(props: any): boolean;
}

export abstract class Element<T extends ElementConfig = ElementConfig> {
    protected _config: T;
    private _id: string;
    private _parent: LayoutElement;

    abstract render(props: any): React.ReactElement<any>;

    constructor(id: string, config?: T) {
        this._id = id;
        this._config = config || ({} as T);
    }

    get id() {
        return this._id;
    }

    setParent(parent: LayoutElement) {
        this._parent = parent;
    }

    getParent(): LayoutElement {
        return this._parent;
    }

    moveTo(targetElement: LayoutElement) {
        const parent = this.getParent();
        if (parent) {
            parent.removeElement(this);
        }
        targetElement.addElement(this);
    }

    moveToTheRightOf(targetElement: Element) {
        const parent = this.getParent();
        if (parent) {
            parent.removeElement(this);
        }
        targetElement.getParent().insertElementToTheRightOf(targetElement, this);
    }

    moveToTheLeftOf(targetElement: Element) {
        this.getParent().removeElement(this);
        targetElement.getParent().insertElementToTheLeftOf(targetElement, this);
    }

    moveAbove(targetElement: Element) {
        this.getParent().removeElement(this);
        targetElement.getParent().insertElementAbove(targetElement, this);
    }

    moveBelow(targetElement: Element) {
        this.getParent().removeElement(this);
        targetElement.getParent().insertElementBelow(targetElement, this);
    }

    moveToTheTopOf(targetElement: LayoutElement) {
        this.getParent().removeElement(this);
        targetElement.insertElementAtTheTop(this);
    }

    moveToTheBottomOf(targetElement: LayoutElement) {
        this.getParent().removeElement(this);
        targetElement.insertElementAtTheBottom(this);
    }

    removeElement() {
        const parent = this.getParent();
        if (!parent) {
            throw new Error("Can't remove an Element without parent!");
        }

        parent.removeElement(this);
    }
    
    replaceWith(element: Element) {
        // TODO
    }

    shouldRender(props) {
        if (typeof this._config.shouldRender === "function") {
            return this._config.shouldRender(props);
        }
        return true;
    }
}
