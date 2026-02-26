import { FieldType, type IFieldTypeFactory } from "./abstractions.js";
import { type LayoutFieldBuildResult } from "./BaseFieldBuilder.js";
import { LayoutFieldBuilder } from "./LayoutFieldBuilder.js";

type AlertType = "info" | "success" | "warning" | "danger";

export interface IUiAlertFieldBuilder extends LayoutFieldBuilder<"uiAlert"> {
    alertType(type: AlertType): this;
}

class AlertFieldBuilder extends LayoutFieldBuilder<"uiAlert"> implements IUiAlertFieldBuilder {
    private _alertType: AlertType = "warning";

    public constructor() {
        super("uiAlert");
    }

    public alertType(type: AlertType): this {
        this._alertType = type;
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
    public readonly type = "uiAlert";

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
