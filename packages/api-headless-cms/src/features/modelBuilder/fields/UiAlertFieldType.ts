import { FieldType, type IFieldTypeFactory } from "./abstractions.js";
import { type LayoutFieldBuildResult } from "./FieldBuilder.js";
import { UiFieldBuilder } from "./UiFieldType.js";

type AlertType = "info" | "success" | "warning" | "danger";

export interface IUiAlertFieldBuilder extends UiFieldBuilder {
    alertType(type: AlertType): this;
    list(): this;
}

class AlertFieldBuilder extends UiFieldBuilder implements IUiAlertFieldBuilder {
    private _alertType: AlertType = "warning";

    public constructor() {
        super("alert");
    }

    public alertType(type: AlertType): this {
        this._alertType = type;
        return this;
    }

    public override list(): this {
        return this;
    }

    public override build(): LayoutFieldBuildResult {
        return {
            type: "layout",
            layoutCell: {
                type: "alert",
                label: this.config.label,
                alertType: this._alertType
            }
        };
    }
}

class UiAlertFieldTypeFactory implements IFieldTypeFactory {
    public readonly type = "ui:alert";

    public create(): IUiAlertFieldBuilder {
        return new AlertFieldBuilder();
    }
}

export const UiAlertFieldType = FieldType.createImplementation({
    implementation: UiAlertFieldTypeFactory,
    dependencies: []
});

// Module augmentation for TypeScript autocomplete
declare module "../abstractions.js" {
    interface IFieldBuilderRegistry {
        uiAlert(): IUiAlertFieldBuilder;
    }
}
