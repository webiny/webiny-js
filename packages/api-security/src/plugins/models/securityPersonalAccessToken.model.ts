import { withFields, string, date } from "@webiny/commodo";

export default withFields({
    name: string(),
    token: string(),
    createdOn: date({ value: new Date() })
})();
