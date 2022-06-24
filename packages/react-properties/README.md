# React Properties

[![](https://img.shields.io/npm/dw/@webiny/react-properties.svg)](https://www.npmjs.com/package/@webiny/react-properties)
[![](https://img.shields.io/npm/v/@webiny/react-properties.svg)](https://www.npmjs.com/package/@webiny/react-properties)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

A tiny React properties framework, to build dynamic data objects using React components, which can be customized after initial creation. The usage is very similar to how you write XML data structures, but in this case you're using actual React.

## Basic Example

```jsx
import React, { useCallback } from "react";
import { Properties, Property, toObject } from "@webiny/react-properties";

const View = () => {
  const onChange = useCallback(properties => {
    console.log(toObject(properties));
  }, []);

  return (
    <Properties onChange={onChange}>
      <Property name={"group"}>
        <Property name={"name"} value={"layout"} />
        <Property name={"label"} value={"Layout"} />
        <Property name={"toolbar"}>
          <Property name={"name"} value={"basic"} />
        </Property>
      </Property>
      <Property name={"group"}>
        <Property name={"name"} value={"heroes"} />
        <Property name={"label"} value={"Heroes"} />
        <Property name={"toolbar"}>
          <Property name={"name"} value={"heroes"} />
        </Property>
      </Property>
    </Properties>
  );
};
```

Output:

```json
{
  "group": [
    {
      "name": "layout",
      "label": "Layout",
      "toolbar": {
        "name": "basic"
      }
    },
    {
      "name": "heroes",
      "label": "Heroes",
      "toolbar": {
        "name": "heroes"
      }
    }
  ]
}
```

For more examples, check out the test files.
