// @flow
import config from "./../configs";
import "webiny-api/install";
import "webiny-api-cms/install";
import install from "webiny-install";

export default async () => install({ config });
