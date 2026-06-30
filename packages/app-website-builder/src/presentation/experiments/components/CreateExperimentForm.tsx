import React, { useState } from "react";
import { Button, Grid, Input, Text } from "@webiny/admin-ui";
import type { ExperimentsPresenter } from "~/presentation/experiments/abstractions.js";

interface Props {
    presenter: ExperimentsPresenter.Interface;
}

export const CreateExperimentForm = ({ presenter }: Props) => {
    const { vm } = presenter;
    const [name, setName] = useState("");

    const create = async () => {
        const trimmed = name.trim();
        if (!trimmed) {
            return;
        }
        await presenter.createExperiment(trimmed);
        setName("");
    };

    if (!vm.pageIsPublished) {
        return (
            <Text size="sm">
                Publish this page before creating an experiment. An experiment runs against the live
                revision.
            </Text>
        );
    }

    return (
        <Grid>
            <Grid.Column span={8}>
                <Input
                    value={name}
                    onChange={setName}
                    placeholder="New experiment name"
                    disabled={vm.busy}
                />
            </Grid.Column>
            <Grid.Column span={4}>
                <Button
                    variant="primary"
                    text="Create experiment"
                    disabled={vm.busy}
                    onClick={create}
                />
            </Grid.Column>
        </Grid>
    );
};
