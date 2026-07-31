import React, { useCallback, useEffect } from "react";
import { AutoComplete } from "@webiny/admin-ui";
import { useFeature } from "@webiny/app";
import { observer } from "mobx-react-lite";
import { TeamsAutocompletePresenterFeature } from "~/presentation/accessManagement/teams/teamsAutocomplete/feature.js";

type TeamAutocompleteProps = Omit<
    React.ComponentProps<typeof AutoComplete>,
    "options" | "onValueChange"
> & {
    onChange?: (value: string) => void;
};

export const TeamAutocomplete = observer(({ onChange, value, ...props }: TeamAutocompleteProps) => {
    const { presenter } = useFeature(TeamsAutocompletePresenterFeature);

    useEffect(() => {
        presenter.init();
    }, [presenter]);

    const onValueChange = useCallback((id: string) => onChange?.(id), [onChange]);

    return (
        <AutoComplete
            {...props}
            options={presenter.vm.options}
            value={presenter.vm.loading ? undefined : (value as string | undefined)}
            onValueChange={onValueChange}
        />
    );
});
