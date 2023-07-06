import React, { useMemo } from "react";
import { css } from "emotion";
import { plugins } from "@webiny/plugins";
import { useBind } from "@webiny/form";
import { Typography } from "@webiny/ui/Typography";
import { DelayedOnChange } from "@webiny/ui/DelayedOnChange";
import {
    PbButtonElementClickHandlerVariable,
    PbPageElementActionTypePlugin,
    PbButtonElementClickHandlerPlugin
} from "~/types";
import SelectField from "../../components/SelectField";
import Wrapper from "../../components/Wrapper";
import InputField from "../../components/InputField";

const classes = {
    gridClass: css({
        "&.mdc-layout-grid": {
            padding: 0,
            marginBottom: 24
        }
    }),
    bottomMargin: css({
        marginBottom: 8
    })
};

const OnClickHandlerForm = () => {
    const clickHandlerBind = useBind({
        name: "clickHandler"
    });

    const variablesBind = useBind({
        name: "variables",
        defaultValue: {}
    });

    const clickHandlers: Array<{
        title: string;
        name?: string;
        variables?: PbButtonElementClickHandlerVariable[];
    }> = useMemo(
        () =>
            plugins.byType<PbButtonElementClickHandlerPlugin>(
                "pb-page-element-button-click-handler"
            ),
        []
    );

    const selectedHandler = useMemo(() => {
        return clickHandlers.find(handler => clickHandlerBind.value === handler.name);
    }, [clickHandlerBind.value]);

    return (
        <>
            <Wrapper label={"Handler"} containerClassName={classes.gridClass}>
                <SelectField
                    value={clickHandlerBind.value}
                    onChange={clickHandlerBind.onChange}
                    placeholder={"Select handler..."}
                >
                    {clickHandlers.map(item => (
                        <option key={item.name} value={item.name}>
                            {item.title}
                        </option>
                    ))}
                </SelectField>
            </Wrapper>

            <Wrapper label={"Variables"} containerClassName={classes.gridClass}>
                <DelayedOnChange value={variablesBind.value} onChange={variablesBind.onChange}>
                    {({ value, onChange }: any) => {
                        if (!selectedHandler?.variables) {
                            return <Typography use="body2">None required.</Typography>;
                        }

                        return (
                            <>
                                {selectedHandler.variables.map((variable, index) => (
                                    <InputField
                                        key={index}
                                        value={value[variable.name]}
                                        placeholder={variable.label}
                                        className={classes.bottomMargin}
                                        onChange={val =>
                                            onChange({
                                                ...value,
                                                [variable.name]: val
                                            })
                                        }
                                    />
                                ))}
                            </>
                        );
                    }}
                </DelayedOnChange>
            </Wrapper>
        </>
    );
};

export const onClickHandlerActionType: PbPageElementActionTypePlugin = {
    type: "pb-page-element-action-type",
    actionType: {
        name: "onClickHandler",
        label: "Click handler",
        element: <OnClickHandlerForm />
    }
};
