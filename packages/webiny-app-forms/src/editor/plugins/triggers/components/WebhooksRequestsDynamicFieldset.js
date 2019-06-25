// @flow
import { DynamicFieldset } from "webiny-ui/DynamicFieldset";
import { Input } from "webiny-ui/Input";
import * as React from "react";
import { Typography } from "webiny-ui/Typography";
import { Grid, Cell } from "webiny-ui/Grid";
import { css } from "emotion";
import { ButtonPrimary, ButtonSecondary } from "webiny-ui/Button";
import { debounce, camelCase, trim } from "lodash";
import { I18NInput, useI18N } from "webiny-app-forms/__i18n/components";

const controlButtons = css({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    ">button": {
        marginRight: 15
    }
});

const textStyling = css({
    color: "var(--mdc-theme-text-secondary-on-background)"
});

export default ({ form }: Object) => {
    const { Bind, setValue } = form;
    const { translate } = useI18N();
    // $FlowFixMe
    const getAfterChangeLabel = React.useCallback(index => {
        return debounce(
            value => setValue(`settings.options.${index}.value`, camelCase(translate(value))),
            200
        );
    }, []);

    return (
        <Bind name={"settings.options"} validators={["minLength:2", "required"]}>
            {({ value, onChange, ...other }) => {
                return (
                    <DynamicFieldset value={value} onChange={onChange} {...other}>
                        {({ actions, header, row, empty }) => (
                            <>
                                {header(() => (
                                    <Grid style={{ paddingTop: 0, paddingBottom: 0 }}>
                                        <Cell span={12} className={textStyling}>
                                            <Typography use={"button"}>Webhook URLs</Typography>
                                        </Cell>
                                    </Grid>
                                ))}
                                {row(({ index }) => (
                                    <Grid>
                                        <Cell span={12}>
                                            <Bind
                                                name={`settings.options.${index}.label`}
                                                validators={["required"]}
                                                afterChange={getAfterChangeLabel(index)}
                                            >
                                                <I18NInput label={"Label"} />
                                            </Bind>
                                        </Cell>
                                    </Grid>
                                ))}
                                {empty(() => (
                                    <Grid>
                                        <Cell span={12} className={textStyling}>
                                            <Typography use={"button"}>Options</Typography>
                                            <br />
                                            <ButtonPrimary onClick={actions.add()}>
                                                Add option
                                            </ButtonPrimary>
                                        </Cell>
                                    </Grid>
                                ))}
                            </>
                        )}
                    </DynamicFieldset>
                );
            }}
        </Bind>
    );
};
