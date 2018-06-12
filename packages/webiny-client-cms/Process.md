## Process
- when saving the page, a URL regex has to be generated
- client sends a `GET /api/cms/pages/load?url=$url`
- try matching the given `$url` against published pages
- extract URL parameters
- load data for each relevant content block using `DataSource` (HKT logic)
- for each block data will be provided using `data` prop
- blocks that have data source set to `independent` will not have the
data loaded by the API
- once the API loads the data, the page is rendered using lazy loaded
components (module names are returned from the API) by passing the relevant
props to each component
- components that don't receive `data` should load data on their own
- EDITOR: when a widget is deleted, we need to call a delete callback on the widget for optional API calls (delete image, etc.)


## Components
- `EditorWidget` HOC is used to wrap the editor component
- `EditorWidgetSettings` HOC is used to wrap the widget settings content

## Plugin structure
```js
// Editor widget group. This is used in the editor to group widgets.
app.services.get("cms").addWidgetGroup({
    name: "custom",
    title: "Custom widgets",
    icon: ["fas", "cogs"]
});

// Editor widget (add widget into `custom` group)
app.services.get("cms").addEditorWidget("custom", {
    name: "my-widget",
    renderWidget() {
        return (
            <EditorWidget>
                <Input name="something" />
                <Switch name="doIt" />
            </EditorWidget>
        );
    },

    renderSettings() {
        return (
            <EditorWidgetSettings dataSource={true}>
                <Input name="something" />
                <Switch name="doIt" />
            </EditorWidgetSettings>
        );
    }
});

// Content widget (used to render content)
app.services.get("cms").addWidget({
    name: "my-widget",
    render({data, settings}) {
        return (
            <h2>{data.title}</h2>
        );
    }
});
```

```
app.services.get("cms").addWidget({
    name: "my-widget",
    render(props) {
        return app.modules.load('some-module').then(Cmp => (
            return <Cmp {...props}/>
        ));
    }
});
```

```
import React from "react";
import { createComponent } from "webiny-client";
import { EditorPlugin } form "webiny-client-cms/lib/admin";

class View extends React.Component {
  constructor() {
    super();
    this.state = {};
  }

  render() {
    return (
      <EditorPlugin name={"cms.page.save"}>
        <Button type={"primary"} onClick={form.submit}>
          Save
        </Button>
      </EditorPlugin>
    );
  }
}

export default createComponent(View, { modules: [] });

app.services.get("cms").editor("cms.page.save", (form, element) => {
  return (
    <div>
      <SlugModal name={"slug-modal"} onSuccess={() => element.props.onClick()}/>
      {React.cloneElement(element, {
        onClick: () => app.services.get("modal").show("slug-modal")
      })}
    </div>
  );
});
```