import * as React from "react";

type Props = { label: React.ReactNode; children: React.ReactNode; icon?: React.ReactNode };

export default function Section(props: Props) {
    return props.children;
}
