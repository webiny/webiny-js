//using page list as an template example
//https://github.com/webiny/webiny-js/blob/master/packages/app-page-builder/src/render/plugins/elements/pagesList/PagesList.tsx

import * as React from "react";
import warning from "warning";
import { useQuery } from "react-apollo";
import { loadMenus } from "./graphql";
import { getPlugins } from "@webiny/plugins";
import { PbPageElementMenuComponentPlugin } from "@webiny/app-page-builder/types";

