import React from "react";
import { createFieldRenderer } from "@webiny/app-admin/exports/admin/form.js";
import { Alert } from "@webiny/admin-ui";
import { Button } from "@webiny/admin-ui";
import { Checkbox } from "@webiny/admin-ui";
import { DelayedOnChange } from "@webiny/admin-ui";
import { Heading } from "@webiny/admin-ui";
import { Input } from "@webiny/admin-ui";
import { Select } from "@webiny/admin-ui";
import { Separator } from "@webiny/admin-ui";
import { Switch } from "@webiny/admin-ui";
import { Tag } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { Textarea } from "@webiny/admin-ui";
import type { FieldRendererRuntime } from "~/shared/adminExtensions/fieldRendererRuntime.js";

/*
 * The values behind every runtime name. Typed against the shared list, so adding a name there
 * without a value here does not compile.
 */
export function createFieldRendererRuntime(): FieldRendererRuntime {
    return {
        React,
        createFieldRenderer,
        Input,
        Textarea,
        Text,
        Heading,
        Button,
        Switch,
        Checkbox,
        Select,
        Tag,
        Alert,
        Separator,
        DelayedOnChange
    };
}
