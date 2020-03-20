import { withFields, string, date } from "@webiny/commodo";

export default withFields({
    token: string(),
    createdOn: date({ value: new Date() })
})();
