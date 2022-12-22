/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import "./ColorPicker.css";
import { ReactNode } from "react";
interface ColorPickerProps {
    disabled?: boolean;
    buttonAriaLabel?: string;
    buttonClassName: string;
    buttonIconClassName?: string;
    buttonLabel?: string;
    color: string;
    children?: ReactNode;
    onChange?: (color: string) => void;
    title?: string;
}
export default function ColorPicker({ color, children, onChange, disabled, ...rest }: Readonly<ColorPickerProps>): JSX.Element;
export interface Position {
    x: number;
    y: number;
}
export declare function toHex(value: string): string;
export {};
