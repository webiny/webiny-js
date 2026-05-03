import { FieldType, FieldBuilder } from "webiny/admin/form";

declare module "webiny/admin/form" {
    interface IFieldBuilderRegistry {
        month(): MonthFieldBuilder;
    }
}

export class MonthFieldBuilder extends FieldBuilder<"month"> {
    constructor() {
        super("month");
        this._config.renderer = "monthInput";
    }

    override normalizeValue(value: unknown): unknown {
        if (value == null || value === "") {
            return value;
        }
        const str = String(value);
        if (/^\d{4}-\d{2}$/.test(str)) {
            return str;
        }
        try {
            const date = new Date(str);
            const y = String(date.getFullYear()).padStart(4, "0");
            const m = String(date.getMonth() + 1).padStart(2, "0");
            return `${y}-${m}`;
        } catch {
            return value;
        }
    }
}

class MonthFieldTypeFactory implements FieldType.Interface {
    readonly type = "month";
    create() {
        return new MonthFieldBuilder();
    }
}

export const MonthFieldType = FieldType.createImplementation({
    implementation: MonthFieldTypeFactory,
    dependencies: []
});
