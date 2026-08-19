import React from "react";
import { Button, Heading, Text, Link } from "@webiny/admin-ui";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";

interface Props {
    onCreateExperiment: () => void;
}

/** A/B illustration for the empty state — two page thumbnails with an A/B badge between them. */
const Illustration = () => {
    const card: React.CSSProperties = {
        width: 96,
        height: 64,
        borderRadius: 8,
        border: "1px solid var(--wby-color-neutral-muted, #e0e0e0)",
        overflow: "hidden",
        background: "#fff"
    };
    const bar: React.CSSProperties = { height: 16, background: "#1a1a1a" };
    const line: React.CSSProperties = {
        height: 4,
        width: 48,
        margin: 8,
        borderRadius: 4,
        background: "#d5d5d5"
    };

    return (
        <div
            style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 24,
                marginBottom: 24
            }}
        >
            <div style={card}>
                <div style={bar} />
                <div style={line} />
            </div>
            <div style={card}>
                <div style={bar} />
                <div style={line} />
                <div
                    style={{
                        height: 12,
                        background: "#ffb59b",
                        margin: "4px 8px",
                        borderRadius: 4
                    }}
                />
            </div>
            <div
                style={{
                    position: "absolute",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 38,
                    height: 38,
                    borderRadius: "50%",
                    background: "#ffe9e1",
                    color: "#e2572a",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 600
                }}
            >
                A/B
            </div>
        </div>
    );
};

export const ExperimentsEmptyState = ({ onCreateExperiment }: Props) => {
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                padding: 32,
                maxWidth: 420,
                margin: "48px auto 0"
            }}
        >
            <Illustration />
            <Heading level={5}>No experiments on this page</Heading>
            <div style={{ margin: "12px 0 24px" }}>
                <Text size="sm">
                    Create an A/B experiment to test variants of this page against each other. Split
                    traffic across full-page variants and run one experiment live at a time.
                </Text>
            </div>
            <Button
                variant="primary"
                icon={<AddIcon />}
                text="Create experiment"
                onClick={onCreateExperiment}
            />
            <div style={{ marginTop: 16 }}>
                <Link to="https://www.webiny.com/docs" target="_blank">
                    Learn about A/B testing
                </Link>
            </div>
        </div>
    );
};
