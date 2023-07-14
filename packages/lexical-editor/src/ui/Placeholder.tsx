/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import "./Placeholder.css";

import * as React from "react";
import { ReactNode } from "react";

export function Placeholder({
    children,
    className,
    styles
}: {
    children: ReactNode;
    className?: string;
    styles?: React.CSSProperties;
}): JSX.Element {
    return (
        <div style={{ ...styles }} className={className || "Placeholder__root"}>
            {children}
        </div>
    );
}
