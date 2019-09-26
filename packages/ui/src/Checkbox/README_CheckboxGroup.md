# Group

### Design
<a href="https://material.io/design/components/selection-controls.html#checkboxes" target="_blank">https://material.io/design/components/selection-controls.html#checkboxes</a>

### Description
Unlike single `Checkbox` which is used to store simple boolean values, grouping multiple `Checkbox` components
with `CheckboxGroup` will allow you to store an array of selected values.

Each `Checkbox` component must receive `value` and `onChange` callback via props.

### Import
To use, import base `Checkbox` component.

```js
import { CheckboxGroup, Checkbox } from "@webiny/ui/Checkbox";
```