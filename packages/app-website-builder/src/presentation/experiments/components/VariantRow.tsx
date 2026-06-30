import React from "react";
import { Button, Grid, Text } from "@webiny/admin-ui";
import type { ExperimentsPresenter } from "~/presentation/experiments/abstractions.js";
import type { ExperimentVm, VariantVm } from "~/presentation/experiments/abstractions.js";

interface Props {
    presenter: ExperimentsPresenter.Interface;
    experiment: ExperimentVm;
    variant: VariantVm;
}

export const VariantRow = ({ presenter, experiment, variant }: Props) => {
    const { vm } = presenter;
    const weight = experiment.trafficSplit.variants[variant.entryId];
    const isWinner = experiment.winningVariantId === variant.entryId;

    return (
        <Grid>
            <Grid.Column span={5}>
                <Text>{variant.name}</Text>
            </Grid.Column>
            <Grid.Column span={3}>
                <Text size="sm">{typeof weight === "number" ? `${weight}%` : "—"}</Text>
            </Grid.Column>
            <Grid.Column span={4}>
                {experiment.status === "draft" ? (
                    <Button
                        variant="ghost"
                        size="sm"
                        text="Remove"
                        disabled={vm.busy}
                        onClick={() => presenter.deleteVariant(experiment.entryId, variant.id)}
                    />
                ) : null}
                {experiment.status === "running" || experiment.status === "stopped" ? (
                    <Button
                        variant="secondary"
                        size="sm"
                        text={isWinner ? "Winner" : "Graduate"}
                        disabled={vm.busy || experiment.status === "running"}
                        onClick={() =>
                            presenter.graduateVariant(experiment.entryId, variant.entryId)
                        }
                    />
                ) : null}
            </Grid.Column>
        </Grid>
    );
};
