import React, { useMemo } from "react";
import get from "lodash/get";
import styled from "@emotion/styled";
import { Input } from "@webiny/ui/Input";
import { Select } from "@webiny/ui/Select";
import { Switch } from "@webiny/ui/Switch";
import { BindComponent } from "@webiny/form/types";
import { ModelSelect } from "~/components/Select/ModelSelect";
import {
    SettingsWrapper,
    SettingsTitle,
    InputWrapper,
    SwitchWrapper,
    SelectWrapper,
    smallSelectStyles
} from "~/components/Settings/Settings.styles";

const showEntriesOptions = [
    { label: "All entries", value: "all" },
    { label: "Odd entries", value: "odd" },
    { label: "Even entries", value: "even" }
];

const RepeatElementSettingsWrapper = styled.div`
    display: grid;
    row-gap: 24px;
    padding: 16px 16px 120px 16px;
`;

const SourceSettingsWrapper = styled.div`
    display: grid;
    row-gap: 6px;
`;

type RepeatElementSettingsProps = {
    Bind: BindComponent;
    submit: () => void;
    data: Record<string, any>;
};

export const RepeatElementSettings: React.FC<RepeatElementSettingsProps> = ({
    Bind,
    submit,
    data
}) => {
    const selectedModelId = useMemo(() => {
        return get(data, "dynamicSource.model.id");
    }, [data]);

    return (
        <RepeatElementSettingsWrapper>
            <SourceSettingsWrapper>
                <span>Source:</span>
                <Bind name={"dynamicSource"} afterChange={submit}>
                    {({ value, onChange }) => (
                        <ModelSelect
                            value={value?.model?.name}
                            onChange={model => onChange({ model })}
                        />
                    )}
                </Bind>
            </SourceSettingsWrapper>
            {selectedModelId && (
                <SettingsWrapper>
                    <SettingsTitle>Repeatable field settings:</SettingsTitle>
                    <SelectWrapper>
                        Show entries:
                        <Bind name={"dynamicSource.showEntries"} afterChange={submit}>
                            <Select className={smallSelectStyles}>
                                {showEntriesOptions.map((option, index) => (
                                    <option key={index} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </Select>
                        </Bind>
                    </SelectWrapper>
                    <SwitchWrapper>
                        Skip first entry:
                        <Bind name={"dynamicSource.skipFirst"} afterChange={submit}>
                            <Switch />
                        </Bind>
                    </SwitchWrapper>
                    <SwitchWrapper>
                        Skip last entry:
                        <Bind name={"dynamicSource.skipLast"} afterChange={submit}>
                            <Switch />
                        </Bind>
                    </SwitchWrapper>
                    <InputWrapper>
                        Limit the number of entries to:
                        <Bind name={"dynamicSource.limit"} afterChange={submit}>
                            <Input type="number" />
                        </Bind>
                    </InputWrapper>
                </SettingsWrapper>
            )}
        </RepeatElementSettingsWrapper>
    );
};
