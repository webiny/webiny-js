# webiny-mailchimp

Renders Mailchimp list signup form.

## Installation
 
### CMS

1. In your app, import and register admin plugins: 
```
import somePlugin from "./somePlugin";
import otherPlugin from "./otherPlugin";
import mailchimpPlugins from "webiny-mailchimp/admin/plugins";

export default [
    somePlugin,
    otherPlugin,
    ...mailchimpPlugins,
];
```
This will enable you to select the Mailchimp element in CMS editor.

But before that, this integration also requires you to register a component inside your theme file 
(the same way we would do e.g. with `PagesList` element). All components you define here will be available for 
selection in CMS editor. 

You could put the following into `demo-theme/src/index.js`: 

```
import * as React from "react";
import { MailchimpDefaultForm } from "webiny-mailchimp/render/components";

export default {
    fonts: {
        ...
    },
    colors: {
        ...
    },
    elements: {
        pagesList: {
            ...
        },
        mailchimp: {
            components: [
                {
                    name: "default",
                    title: "Default page list",
                    component: MailchimpDefaultForm
                },
                {
                    name: "custom",
                    title: "Custom page list",
                    component: (props: *) => {
                        const { Bind, submit } = props;
                        return (
                            <div>
                                <Bind name={"email"} validate={["required"]}>
                                    <Input label={"Your e-mail"} />
                                </Bind>
                                <ButtonPrimary onClick={submit}>Submit</ButtonPrimary>
                            </div>
                        );
                    }
                }
            ]
        }        
    },
    styles: {
        ...
    }
};
```

Feel free to add as many components as needed.

## Site

Once you have finished the steps from previous section, just import render plugins from `webiny-mailchimp/render/plugins` 
in your site app.

```
import somePlugin from "./somePlugin";
import otherPlugin from "./otherPlugin";
import mailchimpPlugins from "webiny-mailchimp/render/plugins";

export default [
    somePlugin,
    otherPlugin,
    ...mailchimpPlugins,
];
```


