import type { ToggleItemDto } from "./ToggleItemDto.js";
import { generateId } from "~/utils.js";

export class ToggleItem {
    private readonly _id: string;
    private readonly _label: any;
    private readonly _value: string | number;
    private readonly _checked: boolean;
    private readonly _disabled: boolean;
    private readonly _icon: any;
    private readonly _iconPosition: "start" | "end";

    protected constructor(data: {
        id: string;
        label: any;
        value: any;
        checked: boolean;
        disabled: boolean;
        icon: any;
        iconPosition: "start" | "end";
    }) {
        this._id = data.id;
        this._label = data.label;
        this._value = data.value;
        this._checked = data.checked;
        this._disabled = data.disabled;
        this._icon = data.icon;
        this._iconPosition = data.iconPosition;
    }

    static create(data: ToggleItemDto): ToggleItem {
        return new ToggleItem({
            id: generateId(data.id),
            label: data.label,
            value: data.value,
            checked: data.checked ?? Boolean(data.value),
            disabled: data.disabled ?? false,
            icon: data.icon,
            iconPosition: data.iconPosition ?? "start"
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

    get checked() {
        return this._checked;
    }

    get disabled() {
        return this._disabled;
    }

    get icon() {
        return this._icon;
    }

    get iconPosition() {
        return this._iconPosition;
    }
}
