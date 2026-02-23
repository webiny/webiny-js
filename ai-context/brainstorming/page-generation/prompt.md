Using the following components catalog and page schema, generate a product page

## Component Catalog

```json
{
  "components": {
    "Webiny/Box": {
      "name": "Webiny/Box",
      "label": "Box",
      "inputs": [
        {
          "type": "slot",
          "list": true,
          "name": "children"
        }
      ]
    },
    "Webiny/Grid": {
      "name": "Webiny/Grid",
      "label": "Grid",
      "inputs": [
        {
          "type": "text",
          "name": "gridLayout",
          "label": "Grid Layout"
        },
        {
          "type": "number",
          "name": "rowCount",
          "label": "Row Count",
          "minValue": 1
        },
        {
          "type": "number",
          "name": "rowGap",
          "label": "Row Gap"
        },
        {
          "type": "number",
          "name": "columnGap",
          "label": "Column Gap"
        },
        {
          "type": "select",
          "name": "stackAtBreakpoint",
          "label": "Stack at breakpoint",
          "options": [
            {
              "label": "Tablet",
              "value": "tablet"
            },
            {
              "label": "Mobile",
              "value": "mobile"
            }
          ]
        },
        {
          "type": "boolean",
          "name": "reverseWhenStacked",
          "label": "Reverse columns when stacked"
        },
        {
          "type": "object",
          "name": "columns",
          "list": true,
          "fields": [
            {
              "type": "slot",
              "list": false,
              "name": "children",
              "components": ["Webiny/GridColumn"]
            }
          ]
        }
      ]
    },
    "Webiny/GridColumn": {
      "name": "Webiny/GridColumn",
      "label": "Column",
      "inputs": [
        {
          "type": "slot",
          "list": true,
          "name": "children"
        }
      ]
    },
    "Webiny/Lexical": {
      "name": "Webiny/Lexical",
      "label": "Rich Text",
      "inputs": [
        {
          "type": "lexical",
          "name": "content",
          "label": "Content"
        }
      ]
    },
    "Webiny/Hero": {
      "name": "Webiny/Hero",
      "label": "Hero",
      "inputs": [
        {
          "type": "text",
          "name": "title",
          "label": "Title",
          "required": true
        },
        {
          "type": "lexical",
          "name": "description",
          "label": "Description",
          "required": false
        },
        {
          "type": "lexical",
          "name": "footerText",
          "label": "Footer Text",
          "required": false
        }
      ]
    }
  }
}
```

`gridLayout` can be one of: `12`, `6-6`, `4-4-4`, `8-4`, `4-8`, `3-3-3-3`

## Page Schema

Recursive structure, `{ component: string, inputs: Record<string, string | number | boolean> }`>

```ts
type ElementSchema = {
  component: string;
  inputs: Record<string, string | number | boolean | CreateElementAction>;
};

type CreateElementAction = {
  action: "CreateElement";
  params: ElementSchema;
};

type PageSchema = ElementSchema[];
```

For image input values, use a free placeholder image service to generate an object of type:

```ts
interface Image {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  src: string;
  width: number;
  height: number;
}
```

For `lexical` input values, generate `{ html: string }` object.
