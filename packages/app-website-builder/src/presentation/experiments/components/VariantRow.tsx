import React from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "@webiny/app-admin";
import { Button, Grid, Text } from "@webiny/admin-ui";
import { Routes } from "~/routes.js";
import type { ExperimentsPresenter } from "~/presentation/experiments/abstractions.js";
import type { ExperimentVm, VariantVm } from "~/presentation/experiments/abstractions.js";

interface Props {
    presenter: ExperimentsPresenter.Interface;
    experiment: ExperimentVm;
    variant: VariantVm;
}

export const VariantRow = observer(({ presenter, experiment, variant }: Props) => {
    const { vm } = presenter;
    const { goToRoute } = useRouter();
    const weight = experiment.trafficSplit.variants[variant.id];
    const isWinner = experiment.winningVariantId === variant.id;

    return (
        <Grid>
            <Grid.Column span={4}>
                <Text>{variant.name}</Text>
            </Grid.Column>
            <Grid.Column span={2}>
                <Text size="sm">{typeof weight === "number" ? `${weight}%` : "—"}</Text>
            </Grid.Column>
            <Grid.Column span={6}>
                {experiment.status !== "graduated" ? (
                    <Button
                        variant="ghost"
                        size="sm"
                        text="Edit"
                        onClick={() =>
                            goToRoute(Routes.Experiments.VariantEditor, { id: variant.id })
                        }
                    />
                ) : null}
                {experiment.status === "draft" ? (
                    <Button
                        variant="ghost"
                        size="sm"
                        text="Remove"
                        disabled={vm.busy}
                        onClick={() => presenter.deleteVariant(experiment.id, variant.id)}
                    />
                ) : null}
                {experiment.status === "running" || experiment.status === "stopped" ? (
                    <Button
                        variant="secondary"
                        size="sm"
                        text={isWinner ? "Winner" : "Graduate"}
                        disabled={vm.busy || experiment.status === "running"}
                        onClick={() => presenter.graduateVariant(experiment.id, variant.id)}
                    />
                ) : null}
            </Grid.Column>
        </Grid>
    );
});
