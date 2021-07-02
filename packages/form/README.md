# @webiny/form

[![](https://img.shields.io/npm/dw/@webiny/form.svg)](https://www.npmjs.com/package/@webiny/form)
[![](https://img.shields.io/npm/v/@webiny/form.svg)](https://www.npmjs.com/package/@webiny/form)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

A simple React library for creating forms.

## Install

```
npm install --save @webiny/form
```

Or if you prefer yarn:

```
yarn add @webiny/form
```

## Quick Example

```tsx
import React, { useCallback } from "react";
import { Form } from "@webiny/form";
import { Input } from "@webiny/ui/Input";
import { ButtonPrimary } from "@webiny/ui/Button";
import { validation } from "@webiny/validation";

const CarManufacturersForm = () => {
  const onSubmit = useCallback(formData => console.log(formData), []);
  return (
    <Form data={{ title: "Untitled" }} onSubmit={onSubmit}>
      {({ form, Bind }) => (
        <React.Fragment>
          <Bind name="title" validators={validation.create("required")}>
            <Input label={"Title"} />
          </Bind>
          <Bind name="description" validators={validation.create("maxLength:500")}>
            <Input
              label={"Description"}
              description={"Provide a short description here."}
              rows={4}
            />
          </Bind>
          <ButtonPrimary onClick={form.submit}>Submit</ButtonPrimary>
        </React.Fragment>
      )}
    </Form>
  );
};

export default CarManufacturersForm;
```
