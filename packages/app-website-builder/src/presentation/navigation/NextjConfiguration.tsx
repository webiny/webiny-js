import React from "react";
// @ts-expect-error Unable to resolve types
import { compiler } from "markdown-to-jsx/react";
import { markdownComponents } from "./markdownComponents.js";

const md =
    'This is a configuration for <a href=\"https://github.com/webiny/website-builder-nextjs\" target=\"_blank\">Webiny Next.js starter kit:</a>\n```dotenv\nNEXT_PUBLIC_WEBSITE_BUILDER_API_KEY=wat_710a7fafeca8bf14ae3774ab249d8e056384\nNEXT_PUBLIC_WEBSITE_BUILDER_API_HOST=https://d3vl5axotmijnx.cloudfront.net\nNEXT_PUBLIC_WEBSITE_BUILDER_API_TENANT=root\n```';

export const NextjsConfiguration = () => {
    const content = compiler(md, { overrides: markdownComponents });

    return <>{content}</>;
};
