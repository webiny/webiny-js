import React from "react";
import { Button, Heading, Text } from "@webiny/admin-ui";
import { VariantRow } from "./VariantRow.js";
import { AddVariantForm } from "./AddVariantForm.js";
import type {
    ExperimentsPresenter,
    ExperimentVm
} from "~/presentation/experiments/abstractions.js";

interface Props {
    presenter: ExperimentsPresenter.Interface;
    experiment: ExperimentVm;
}

const StartControls = ({ presenter, experiment }: Props) => {
    const { vm } = presenter;
    const readyCount = experiment.variants.filter(variant => variant.status === "ready").length;
    return (
        <>
            <AddVariantForm presenter={presenter} experiment={experiment} />
            <Button
                variant="primary"
                text="Start experiment"
                disabled={vm.busy || readyCount === 0}
                onClick={() => presenter.startExperiment(experiment.entryId)}
            />
        </>
    );
};

export const ExperimentRow = ({ presenter, experiment }: Props) => {
    const { vm } = presenter;

    return (
        <div className="wby-mb-4 wby-border wby-border-neutral-dimmed wby-rounded wby-p-4">
            <Heading level={6}>{experiment.name}</Heading>
            <Text size="sm">
                Status: {experiment.status} · Control: {experiment.trafficSplit.control}%
            </Text>
            {experiment.variants.map(variant => (
                <VariantRow
                    key={variant.id}
                    presenter={presenter}
                    experiment={experiment}
                    variant={variant}
                />
            ))}
            {experiment.status === "draft" ? (
                <StartControls presenter={presenter} experiment={experiment} />
            ) : null}
            {experiment.status === "running" ? (
                <Button
                    variant="secondary"
                    text="Stop experiment"
                    disabled={vm.busy}
                    onClick={() => presenter.stopExperiment(experiment.entryId)}
                />
            ) : null}
        </div>
    );
};
