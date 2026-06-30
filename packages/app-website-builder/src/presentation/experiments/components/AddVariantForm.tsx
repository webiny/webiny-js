import React, { useState } from "react";
import { observer } from "mobx-react-lite";
import { Button, Grid, Input } from "@webiny/admin-ui";
import type {
    ExperimentsPresenter,
    ExperimentVm
} from "~/presentation/experiments/abstractions.js";

interface Props {
    presenter: ExperimentsPresenter.Interface;
    experiment: ExperimentVm;
}

export const AddVariantForm = observer(({ presenter, experiment }: Props) => {
    const { vm } = presenter;
    const [name, setName] = useState("");

    const add = async () => {
        const trimmed = name.trim();
        if (!trimmed) {
            return;
        }
        await presenter.addVariant(experiment.id, trimmed);
        setName("");
    };

    return (
        <Grid>
            <Grid.Column span={8}>
                <Input
                    value={name}
                    onChange={setName}
                    placeholder="New variant name"
                    disabled={vm.busy}
                />
            </Grid.Column>
            <Grid.Column span={4}>
                <Button variant="secondary" text="Add variant" disabled={vm.busy} onClick={add} />
            </Grid.Column>
        </Grid>
    );
});
