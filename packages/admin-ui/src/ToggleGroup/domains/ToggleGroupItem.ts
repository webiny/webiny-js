import type { ToggleGroupItemParams } from "./ToggleGroupItemParams.js";
import { generateId } from "~/utils.js";

export class ToggleGroupItem {
    private readonly _id: string;
    private readonly _label: any;
    private readonly _value: string;
    private readonly _disabled: boolean;
    private readonly _icon: any;
    private readonly _iconPosition: "start" | "end";
    private readonly _tooltip?: string;

    protected constructor(data: {
        id: string;
        label: any;
        value: string;
        disabled: boolean;
        icon: any;
        iconPosition: "start" | "end";
        tooltip?: string;
    }) {
        this._id = data.id;
        this._label = data.label;
        this._value = data.value;
        this._disabled = data.disabled;
        this._icon = data.icon;
        this._iconPosition = data.iconPosition;
        this._tooltip = data.tooltip;
    }

    static create(data: ToggleGroupItemParams): ToggleGroupItem {
        return new ToggleGroupItem({
            id: generateId(data.id),
            label: data.label,
            value: data.value,
            disabled: data.disabled ?? false,
            icon: data.icon,
            iconPosition: data.iconPosition ?? "start",
            tooltip: data.tooltip
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

    get iconPosition() {
        return this._iconPosition;
    }

    get tooltip() {
        return this._tooltip;
    }
}
