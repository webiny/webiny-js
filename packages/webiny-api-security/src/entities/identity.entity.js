// @flow
import { Entity } from "webiny-api";

import type { IAuthorizable } from "../../types";

/**
 * Identity class is the base class for all identity classes.
 * It is used to create your API user classes.
 */
class Identity extends Entity implements IAuthorizable {}

Identity.classId = "SecurityIdentity";

export default Identity;
