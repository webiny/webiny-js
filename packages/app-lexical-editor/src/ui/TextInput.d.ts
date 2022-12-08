/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
/// <reference types="react" />
import "./Input.css";
declare type Props = Readonly<{
    "data-test-id"?: string;
    label: string;
    onChange: (val: string) => void;
    placeholder?: string;
    value: string;
}>;
export default function TextInput({ label, value, onChange, placeholder, "data-test-id": dataTestId }: Props): JSX.Element;
export {};
