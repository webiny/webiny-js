import React, { useMemo } from "react";
import { css } from "emotion";
import { merge } from "dot-prop-immutable";
import { Form, FormOnSubmit } from "@webiny/form";
import { plugins } from "@webiny/plugins";
import { withActiveElement } from "../../../components";
import {
    PbEditorElement,
    PbEditorPageElementSettingsRenderComponentProps,
    PbPageElementActionTypePlugin
} from "~/types";
import Accordion from "../components/Accordion";
import Wrapper from "../components/Wrapper";
import SelectField from "../components/SelectField";
import { useUpdateElement } from "~/editor/hooks/useUpdateElement";

const classes = {
    gridClass: css({
        "&.mdc-layout-grid": {
            padding: 0,
            marginBottom: 24
        }
    }),
    gridCellClass: css({
        justifySelf: "end"
    }),
    bottomMargin: css({
        marginBottom: 8
    })
};

interface ActionSettingsPropsType extends PbEditorPageElementSettingsRenderComponentProps {
    element: PbEditorElement;
}

const ActionSettingsComponent = ({ element, defaultAccordionValue }: ActionSettingsPropsType) => {
    const updateElement = useUpdateElement();

    const { actionType } = element.data?.action || { actionType: "link" };

    const updateSettings: FormOnSubmit = data => {
        const attrKey = `data.action`;
        const newElement: PbEditorElement = merge(element, attrKey, data);
        updateElement(newElement);
    };

    const actionTypes = useMemo(() => {
        const actionTypePlugins = plugins.byType<PbPageElementActionTypePlugin>(
            "pb-page-element-action-type"
        );

        return actionTypePlugins
            .map(plugin => plugin.actionType)
            .sort((a, b) => a.label.toLowerCase().localeCompare(b.label.toLowerCase()));
    }, []);

    const activeActionType = actionTypes.find(type => type.name === actionType);

    // For backwards compatibility, use `data.link` first, then apply the current values.
    const formData = { actionType, ...element.data?.link, ...element.data?.action };

    return (
        <Accordion title={"Action"} defaultValue={defaultAccordionValue}>
            <Form data={formData} onChange={updateSettings}>
                {({ Bind }) => {
                    return (
                        <>
                            <Bind name="actionType">
                                {({ value, onChange }) => (
                                    <Wrapper
                                        label={"Action Type"}
                                        containerClassName={classes.gridClass}
                                    >
                                        <SelectField value={value} onChange={onChange}>
                                            {actionTypes.map(item => (
                                                <option key={item.name} value={item.name}>
                                                    {item.label}
                                                </option>
                                            ))}
                                        </SelectField>
                                    </Wrapper>
                                )}
                            </Bind>
                            {activeActionType ? activeActionType.element : null}
                        </>
                    );
                }}
            </Form>
        </Accordion>
    );
};
export default withActiveElement()(ActionSettingsComponent);
