import { AbstractModel } from "./AbstractModel";

export interface FunnelFieldValueModelDto<TValue = unknown> {
    type: string;
    array: boolean;
    value: TValue;
}

export class FunnelFieldValueModel<
    TValue = unknown
> extends AbstractModel<FunnelFieldValueModelDto> {
    static type = "";

    type: string;
    array: boolean;
    value: TValue;

    constructor(dto?: Partial<FunnelFieldValueModelDto<TValue>>) {
        super();
        this.type = dto?.type || "";
        this.array = dto?.array || false;
        if (typeof dto?.value !== "undefined") {
            this.value = dto.value;
        } else {
            this.value = this.getDefaultValue() as TValue;
        }
    }

    hasValue() {
        if (this.array) {
            return Array.isArray(this.value) && this.value.length > 0;
        }

        return !!this.value;
    }

    isEmpty() {
        return !this.hasValue();
    }

    toDto(): FunnelFieldValueModelDto<TValue> {
        return {
            type: this.type,
            value: this.value,
            array: this.array
        };
    }

    clone() {
        return FunnelFieldValueModel.fromDto(this.toDto());
    }

    getDefaultValue() {
        return this.array ? [] : null;
    }

    static fromDto<TValue = unknown>(
        dto: FunnelFieldValueModelDto<TValue>
    ): FunnelFieldValueModel<TValue> {
        // Could not import the module directly because of circular dependency.
        return require("./fieldValues/fieldValueFactory").fieldValueFromDto(dto);
    }
}
