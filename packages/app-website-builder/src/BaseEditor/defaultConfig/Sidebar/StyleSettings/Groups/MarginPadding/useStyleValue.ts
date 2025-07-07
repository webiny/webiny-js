import { useStyles } from "../../useStyles";

export const useStyleValue = (elementId: string, propertyName: string) => {
    const { styles, onChange, onPreviewChange, inheritanceMap } = useStyles(elementId);
    const [match, value, unit = "px"] = (styles[propertyName] ?? "").match(/(\d+)?(\S+)/) ?? [];
    const { overridden, inheritedFrom } = inheritanceMap[propertyName] ?? {};

    const onValueChange = (value: string) => {
        onChange(({ styles }) => {
            styles.set(propertyName, value);
        });
    };

    const onValueChangePreview = (value: string) => {
        onPreviewChange(({ styles }) => {
            styles.set(propertyName, value);
        });
    };

    const onValueReset = () => {
        onChange(({ styles }) => {
            styles.unset(propertyName);
        });
    };

    return {
        value: match === "auto" ? "auto" : value,
        unit,
        onChange: onValueChange,
        onChangePreview: onValueChangePreview,
        onReset: onValueReset,
        inheritedFrom,
        overridden
    };
};
