import React from "react";
import styled from "@emotion/styled";
import { Cell, Grid } from "@webiny/ui/Grid";
import { Bind } from "@webiny/form";
import { CheckboxGroup, Checkbox } from "@webiny/ui/Checkbox";
import { validation } from "@webiny/validation";
import { useThemeManager } from "~/hooks/useThemeManager";

const WideOptions = styled.div(`
  .mdc-form-field {
    width: 100%
  }  
`);

export const ThemeCheckboxGroup = () => {
    const { themes } = useThemeManager();

    return (
        <Grid>
            <Cell span={12}>
                <Bind
                    name={"settings.themes"}
                    defaultValue={[]}
                    validators={validation.create("required,minLength:1")}
                >
                    <CheckboxGroup
                        label="Themes"
                        description={"Choose themes that will be enabled for this tenant."}
                    >
                        {({ onChange, getValue }) => (
                            <WideOptions>
                                {themes.map(({ label, name }) => (
                                    <Checkbox
                                        key={name}
                                        label={label}
                                        value={getValue(name)}
                                        onChange={onChange(name)}
                                    />
                                ))}
                            </WideOptions>
                        )}
                    </CheckboxGroup>
                </Bind>
            </Cell>
        </Grid>
    );
};
