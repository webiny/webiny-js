import React, { useMemo } from "react";
import { observer } from "mobx-react-lite";
import { DiContainerProvider, useContainer, useFeature } from "@webiny/app";
import { Button, Input, Text } from "@webiny/admin-ui";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { ReactComponent as InfoIcon } from "@webiny/icons/info.svg";
import { ReactComponent as CloseIcon } from "@webiny/icons/close.svg";
import { VariantSplitRow } from "./VariantSplitRow.js";
import { ExperimentFormPresenterFeature } from "../feature.js";
import type {
    ExperimentFormInitial,
    NewExperimentPayload
} from "../abstractions/ExperimentFormPresenter.js";

interface Props {
    onCancel: () => void;
    onSubmit: (payload: NewExperimentPayload) => void;
    initial?: ExperimentFormInitial;
    submitLabel?: string;
    /** When false, variants can't be added/removed (used when editing an existing experiment). */
    allowStructureChange?: boolean;
}

const ExperimentFormViewInner = observer(function ExperimentFormViewInner({
    onCancel,
    onSubmit,
    initial,
    submitLabel = "Create experiment",
    allowStructureChange = true
}: Props) {
    const { presenter } = useFeature(ExperimentFormPresenterFeature);

    useMemo(() => {
        presenter.init(initial, { submitLabel, allowStructureChange, onSubmit });
    }, [presenter]);

    const { vm } = presenter;

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
                <div style={{ marginBottom: 20 }}>
                    <Input
                        label="Experiment name"
                        value={vm.name}
                        onChange={value => presenter.setName(value)}
                        placeholder="e.g. Homepage CTA test"
                    />
                </div>

                <div style={{ marginBottom: 12 }}>
                    <Input
                        label="Experiment key"
                        value={vm.key}
                        onChange={value => presenter.setKey(value)}
                        placeholder="homepage-cta-test"
                    />
                </div>

                <div
                    style={{
                        display: "flex",
                        gap: 8,
                        background: "#f5f5f5",
                        borderRadius: 8,
                        padding: 12,
                        marginBottom: 28
                    }}
                >
                    <InfoIcon style={{ width: 18, height: 18, flexShrink: 0, marginTop: 2 }} />
                    <Text size="sm">
                        This key is the identifier reported to your analytics platform to track this
                        experiment. Auto-generated from the name — edit it to override.
                    </Text>
                </div>

                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 4
                    }}
                >
                    <Text>Variants &amp; traffic split</Text>
                    <span
                        style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: vm.total === 100 ? "#0f9d58" : "#d93025"
                        }}
                    >
                        Total {vm.total}%
                    </span>
                </div>
                <div style={{ marginBottom: 16 }}>
                    <Text size="sm">
                        Each variant is an independent copy of the page. Sliders auto-balance to
                        100%.
                    </Text>
                </div>

                {vm.buckets.map((bucket, index) => (
                    <VariantSplitRow
                        key={bucket.id}
                        name={bucket.name}
                        variantKey={bucket.key}
                        description={bucket.description}
                        isControl={bucket.isControl}
                        weight={bucket.weight}
                        variantIndex={vm.buckets.slice(0, index).filter(b => !b.isControl).length}
                        onNameChange={value => presenter.changeName(index, value)}
                        onKeyChange={value => presenter.changeKey(index, value)}
                        onDescriptionChange={value => presenter.changeDescription(index, value)}
                        onChange={value => presenter.changeWeight(index, value)}
                        onRemove={
                            bucket.isControl || !vm.allowStructureChange || vm.variantCount <= 1
                                ? undefined
                                : () => presenter.removeVariant(index)
                        }
                        removeIcon={<CloseIcon style={{ width: 14, height: 14 }} />}
                    />
                ))}

                {vm.allowStructureChange ? (
                    <div style={{ marginTop: 8 }}>
                        <Button
                            variant="tertiary"
                            icon={<AddIcon />}
                            text="Add variant"
                            onClick={() => presenter.addVariant()}
                        />
                    </div>
                ) : null}
            </div>

            <div
                style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 12,
                    padding: 16,
                    borderTop: "1px solid #eee"
                }}
            >
                <Button variant="secondary" text="Cancel" onClick={onCancel} />
                <Button
                    variant="primary"
                    text={vm.submitLabel}
                    disabled={!vm.canSubmit}
                    onClick={() => presenter.submit()}
                />
            </div>
        </div>
    );
});

export const ExperimentFormView = (props: Props) => {
    const container = useContainer();

    const scopedContainer = useMemo(() => {
        const child = container.createChildContainer();
        ExperimentFormPresenterFeature.register(child);
        return child;
    }, []);

    return (
        <DiContainerProvider container={scopedContainer}>
            <ExperimentFormViewInner {...props} />
        </DiContainerProvider>
    );
};
