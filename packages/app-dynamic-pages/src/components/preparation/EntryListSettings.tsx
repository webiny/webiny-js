import React, { useMemo } from "react";
import get from "lodash/get";
import styled from "@emotion/styled";
import { Input } from "@webiny/ui/Input";
import { Switch } from "@webiny/ui/Switch";
import { BindComponent } from "@webiny/form/types";
import { FilterSettings } from "~/components/Settings/FilterSettings";
import { SortRuleSettings } from "~/components/Settings/SortRuleSettings";
import { ModelSelect } from "~/components/Select/ModelSelect";
import {
    SettingsWrapper,
    SettingsTitle,
    InputWrapper,
    SwitchWrapper
} from "~/components/Settings/Settings.styles";

const EntryListSettingsWrapper = styled.div`
    display: grid;
    row-gap: 24px;
    padding: 16px 16px 120px 16px;
`;

const SourceSettingsWrapper = styled.div`
    display: grid;
    row-gap: 6px;
`;

type EntryListSettingsProps = {
    Bind: BindComponent;
    submit: () => void;
    data: Record<string, any>;
};

export const EntryListSettings: React.FC<EntryListSettingsProps> = ({ Bind, submit, data }) => {
    const selectedModelId = useMemo(() => {
        return get(data, "dynamicSource.model.id");
    }, [data]);

    const showPagination = useMemo(() => {
        return get(data, "dynamicSource.pagination");
    }, [data]);

    return (
        <EntryListSettingsWrapper>
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
                <>
                    <Bind name={"dynamicSource.filter"} afterChange={submit}>
                        {({ value, onChange }) => (
                            <FilterSettings
                                sourceModelId={selectedModelId}
                                value={value}
                                showExcludeCurrentEntry
                                onChange={value => onChange(value)}
                            />
                        )}
                    </Bind>
                    <Bind name={"dynamicSource.sortRules"} afterChange={submit}>
                        {({ value, onChange }) => (
                            <SortRuleSettings
                                sourceModelId={selectedModelId}
                                value={value || []}
                                onChange={value => onChange(value)}
                            />
                        )}
                    </Bind>
                    <SettingsWrapper>
                        <SettingsTitle>Pagination & limit:</SettingsTitle>
                        <SwitchWrapper>
                            Show pagination:
                            <Bind name={"dynamicSource.pagination"} afterChange={submit}>
                                <Switch />
                            </Bind>
                        </SwitchWrapper>
                        <InputWrapper>
                            Results per page:
                            <Bind name={"dynamicSource.resultsPerPage"} afterChange={submit}>
                                <Input type="number" disabled={!showPagination} />
                            </Bind>
                        </InputWrapper>
                        <InputWrapper>
                            Limit the number of results to:
                            <Bind name={"dynamicSource.limit"} afterChange={submit}>
                                <Input type="number" />
                            </Bind>
                        </InputWrapper>
                    </SettingsWrapper>
                </>
            )}
        </EntryListSettingsWrapper>
    );
};
