import type React from "react";
import type { RadioItemParams } from "./RadioItemParams.js";
import { generateId } from "~/utils.js";

export class RadioItem {
    private readonly _id: string;
    private readonly _label: any;
    private readonly _value: string | number;
    private readonly _disabled: boolean;
    private readonly _description?: React.ReactNode;

    protected constructor(data: {
        id: string;
        label: any;
        value: string | number;
        disabled: boolean;
        description?: React.ReactNode;
    }) {
        this._id = data.id;
        this._label = data.label;
        this._value = data.value;
        this._disabled = data.disabled;
        this._description = data.description;
    }

    static create(data: RadioItemParams) {
        return new RadioItem({
            id: generateId(data.id),
            label: data.label,
            value: data.value,
            disabled: data.disabled ?? false,
            description: data.description
        });
    }

    get id() {
        return this._id;
    }

    get label() {
        return this._label;
    }

    get value() {
        return this._value;
    }

    get disabled() {
        return this._disabled;
    }

    get description() {
        return this._description;
    }
}
