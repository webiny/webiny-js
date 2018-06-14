import React from "react";
import FormComponent from "./index";

export default function withFormComponent() {
    return Target => {
        const FormComponentHOC = ({ children, ...props }) => {
            return (
                <FormComponent {...props}>
                    {formComponentProps => (
                        <Target {...props} {...formComponentProps}>
                            {children}
                        </Target>
                    )}
                </FormComponent>
            );
        };

        FormComponentHOC.displayName = "FormComponentHOC";

        return FormComponentHOC;
    };
}
