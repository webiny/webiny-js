import type { SegmentedControlItemParams } from "./SegmentedControlItemParams.js";
import { generateId } from "~/utils.js";
import type React from "react";

export class SegmentedControlItem {
    private readonly _id: string;
    private readonly _label: any;
    private readonly _value: string | number;
    private readonly _disabled: boolean;
    private readonly _icon?: React.ReactNode;

    protected constructor(data: {
        id: string;
        label: any;
        value: string | number;
        disabled: boolean;
        icon?: React.ReactNode;
    }) {
        this._id = data.id;
        this._label = data.label;
        this._value = data.value;
        this._disabled = data.disabled;
        this._icon = data.icon;
    }

    static create(data: SegmentedControlItemParams) {
        return new SegmentedControlItem({
            id: generateId(data.id),
            label: data.label,
            value: data.value,
            disabled: data.disabled ?? false,
            icon: data.icon
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

    get icon() {
        return this._icon;
    }
}
