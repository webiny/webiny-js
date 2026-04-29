# PROMPT (sent to AI via generateObject)

## System Prompt

You are a page content generator. Given a user prompt, generate structured page
content using the provided component catalog and available actions.

### Component Catalog

```json
{
  "components": {
    "Webiny/Hero": {
      "name": "Webiny/Hero",
      "label": "Hero",
      "inputs": [
        { "type": "text", "name": "title", "required": true },
        { "type": "lexical", "name": "description" },
        { "type": "image", "name": "heroImage" },
        { "type": "lexical", "name": "footerText" }
      ]
    },
    "Webiny/Grid": {
      "name": "Webiny/Grid",
      "label": "Grid",
      "inputs": [
        { "type": "text", "name": "gridLayout" },
        { "type": "number", "name": "rowCount", "minValue": 1 },
        { "type": "number", "name": "columnGap" },
        { "type": "number", "name": "rowGap" },
        {
          "type": "select",
          "name": "stackAtBreakpoint",
          "options": ["tablet", "mobile"]
        },
        { "type": "boolean", "name": "reverseWhenStacked" },
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
      "inputs": [{ "type": "slot", "list": true, "name": "children" }]
    },
    "Webiny/Lexical": {
      "name": "Webiny/Lexical",
      "label": "Rich Text",
      "inputs": [{ "type": "lexical", "name": "content" }]
    },
    "Webiny/Box": {
      "name": "Webiny/Box",
      "label": "Box",
      "inputs": [{ "type": "slot", "list": true, "name": "children" }]
    },
    "Webiny/ProductCard": {
      "name": "Webiny/ProductCard",
      "label": "Product Card",
      "inputs": [
        { "type": "product", "name": "product" },
        { "type": "boolean", "name": "showPrice" },
        { "type": "boolean", "name": "showRating" }
      ]
    }
  }
}
```

Grid layout options: `12`, `6-6`, `4-4-4`, `8-4`, `4-8`, `3-3-3-3`

### Available Tools

For input fields that require post-processing, wrap the value in a tool
envelope: `{ "tool": "<toolName>", "params": { ... } }`.

Plain values (text, number, boolean, select) should be set directly without
an envelope.

```json
{
  "tools": {
    "htmlToLexical": {
      "description": "Converts an HTML string into Lexical editor state. Use for all 'lexical' type inputs.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "html": { "type": "string", "description": "HTML content" }
        },
        "required": ["html"]
      },
      "outputSchema": {
        "type": "object",
        "description": "Lexical editor state JSON"
      }
    },
    "resolveImage": {
      "description": "Fetches an image from the DAM matching the given tags and constraints.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "tags": {
            "type": "array",
            "items": { "type": "string" },
            "description": "Semantic tags describing the desired image"
          },
          "aspect": {
            "type": "string",
            "description": "Desired aspect ratio, e.g. '16:9', '1:1'"
          }
        },
        "required": ["tags"]
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "name": { "type": "string" },
          "src": { "type": "string" },
          "width": { "type": "number" },
          "height": { "type": "number" },
          "mimeType": { "type": "string" }
        }
      }
    },
    "resolveProduct": {
      "description": "Fetches a product reference from the e-commerce catalog.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "query": {
            "type": "string",
            "description": "Search query or product name"
          },
          "sku": { "type": "string", "description": "Exact SKU if known" },
          "category": {
            "type": "string",
            "description": "Product category to filter by"
          }
        }
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "name": { "type": "string" },
          "sku": { "type": "string" },
          "price": { "type": "number" },
          "currency": { "type": "string" },
          "imageUrl": { "type": "string" }
        }
      }
    }
  }
}
```

### Page Schema

```typescript
type ElementSchema = {
  component: string;
  inputs: Record<string, unknown>;
};

type CreateElementAction = {
  action: "CreateElement";
  params: ElementSchema;
};

type PageSchema = ElementSchema[];
```

For slot inputs, use `{ "action": "CreateElement", "params": { "component": "...", "inputs": { ... } } }`.
Note: `CreateElement` uses "action" — it is a structural instruction for the page builder, not a tool invocation.

## User Prompt

"Create a landing page for Nike Air Max 90 sneakers. Include a hero section
with a tagline, a features grid, and a section showing 3 related products."

# AI RESPONSE (from generateObject)

```json
[
  {
    "component": "Webiny/Hero",
    "inputs": {
      "title": "Nike Air Max 90 — Iconic Style, Modern Comfort",
      "description": {
        "tool": "htmlToLexical",
        "params": {
          "html": "<p>The shoe that changed everything. Originally released in 1990, the Air Max 90 continues to set the standard for streetwear culture with its visible Air unit and timeless design.</p>"
        }
      },
      "heroImage": {
        "tool": "resolveImage",
        "params": {
          "tags": ["nike", "air max 90", "sneakers", "hero"],
          "aspect": "16:9"
        }
      },
      "footerText": {
        "tool": "htmlToLexical",
        "params": {
          "html": "<p><strong>Free shipping</strong> on orders over $100 · <strong>30-day</strong> returns · Authenticity guaranteed</p>"
        }
      }
    }
  },
  {
    "component": "Webiny/Grid",
    "inputs": {
      "gridLayout": "4-4-4",
      "rowCount": 1,
      "columnGap": 32,
      "rowGap": 0,
      "stackAtBreakpoint": "tablet",
      "reverseWhenStacked": false,
      "columns": [
        {
          "children": {
            "action": "CreateElement",
            "params": {
              "component": "Webiny/GridColumn",
              "inputs": {
                "children": [
                  {
                    "action": "CreateElement",
                    "params": {
                      "component": "Webiny/Lexical",
                      "inputs": {
                        "content": {
                          "tool": "htmlToLexical",
                          "params": {
                            "html": "<h3>Visible Air Cushioning</h3><p>The revolutionary Air Max unit provides all-day impact protection and a smooth ride, whether you're hitting the streets or standing all day.</p>"
                          }
                        }
                      }
                    }
                  }
                ]
              }
            }
          }
        },
        {
          "children": {
            "action": "CreateElement",
            "params": {
              "component": "Webiny/GridColumn",
              "inputs": {
                "children": [
                  {
                    "action": "CreateElement",
                    "params": {
                      "component": "Webiny/Lexical",
                      "inputs": {
                        "content": {
                          "tool": "htmlToLexical",
                          "params": {
                            "html": "<h3>Premium Materials</h3><p>Crafted with a combination of leather, synthetic overlays, and breathable mesh for durability that doesn't sacrifice comfort.</p>"
                          }
                        }
                      }
                    }
                  }
                ]
              }
            }
          }
        },
        {
          "children": {
            "action": "CreateElement",
            "params": {
              "component": "Webiny/GridColumn",
              "inputs": {
                "children": [
                  {
                    "action": "CreateElement",
                    "params": {
                      "component": "Webiny/Lexical",
                      "inputs": {
                        "content": {
                          "tool": "htmlToLexical",
                          "params": {
                            "html": "<h3>Timeless Design</h3><p>From the wavy mudguard to the bold color-blocking, every detail has been refined over three decades while staying true to the original.</p>"
                          }
                        }
                      }
                    }
                  }
                ]
              }
            }
          }
        }
      ]
    }
  },
  {
    "component": "Webiny/Box",
    "inputs": {
      "children": [
        {
          "action": "CreateElement",
          "params": {
            "component": "Webiny/Lexical",
            "inputs": {
              "content": {
                "tool": "htmlToLexical",
                "params": {
                  "html": "<h2>You might also like</h2>"
                }
              }
            }
          }
        }
      ]
    }
  },
  {
    "component": "Webiny/Grid",
    "inputs": {
      "gridLayout": "4-4-4",
      "rowCount": 1,
      "columnGap": 24,
      "rowGap": 0,
      "stackAtBreakpoint": "tablet",
      "reverseWhenStacked": false,
      "columns": [
        {
          "children": {
            "action": "CreateElement",
            "params": {
              "component": "Webiny/GridColumn",
              "inputs": {
                "children": [
                  {
                    "action": "CreateElement",
                    "params": {
                      "component": "Webiny/ProductCard",
                      "inputs": {
                        "product": {
                          "tool": "resolveProduct",
                          "params": {
                            "query": "Nike Air Max 95",
                            "category": "sneakers"
                          }
                        },
                        "showPrice": true,
                        "showRating": true
                      }
                    }
                  }
                ]
              }
            }
          }
        },
        {
          "children": {
            "action": "CreateElement",
            "params": {
              "component": "Webiny/GridColumn",
              "inputs": {
                "children": [
                  {
                    "action": "CreateElement",
                    "params": {
                      "component": "Webiny/ProductCard",
                      "inputs": {
                        "product": {
                          "tool": "resolveProduct",
                          "params": {
                            "query": "Nike Air Max 97",
                            "category": "sneakers"
                          }
                        },
                        "showPrice": true,
                        "showRating": true
                      }
                    }
                  }
                ]
              }
            }
          }
        },
        {
          "children": {
            "action": "CreateElement",
            "params": {
              "component": "Webiny/GridColumn",
              "inputs": {
                "children": [
                  {
                    "action": "CreateElement",
                    "params": {
                      "component": "Webiny/ProductCard",
                      "inputs": {
                        "product": {
                          "tool": "resolveProduct",
                          "params": {
                            "query": "Nike Air Force 1",
                            "category": "sneakers"
                          }
                        },
                        "showPrice": true,
                        "showRating": true
                      }
                    }
                  }
                ]
              }
            }
          }
        }
      ]
    }
  }
]
```

The pipeline runner would:

1. Walk the entire structure recursively

2. Find 8 tool envelopes:

- 5x htmlToLexical (hero description, footer, 3 feature texts, section heading)

- 1x resolveImage (hero image)

- 3x resolveProduct (related products)

3. Run all 9 in parallel

4. Replace each envelope with the tool's return value

The "CreateElement" actions are NOT tool invocations — they use "action", not "tool". They're structural instructions for the page editor. The pipeline runner recurses into them to find tool envelopes, but doesn't dispatch them.
