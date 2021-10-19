import afterMenuUpdate from "./afterMenuUpdate";
import afterPageDelete from "./afterPageDelete";
import afterPagePublish from "./afterPagePublish";
import afterPageUnpublish from "./afterPageUnpublish";
import afterSettingsUpdate from "./afterSettingsUpdate";

export default () => {
    return [
        afterMenuUpdate(),
        afterPageDelete(),
        afterPagePublish(),
        afterPageUnpublish(),
        afterSettingsUpdate()
    ];
};
