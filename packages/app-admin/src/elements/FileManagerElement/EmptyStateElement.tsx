import React from "react";
import { Element } from "@webiny/ui-composer/Element";
import { EmptyStateElementRenderer } from "./EmptyStateElementRenderer";

export class EmptyStateElement extends Element<any> {
    constructor(id: string) {
        super(id);

        this.addRenderer(new EmptyStateElementRenderer());
    }
}
