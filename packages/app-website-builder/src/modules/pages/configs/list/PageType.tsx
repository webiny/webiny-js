import type React from "react";
import { useEffect } from "react";
import { usePageTypes } from "~/features/index.js";
import { Title } from "./PageType/Title.js";
import { Path } from "./PageType/Path.js";
import { Language } from "./PageType/Language.js";

export type PageTypeProps =
    | {
          name: string;
          remove: true;
      }
    | {
          name: string;
          label: string;
          element: React.ReactNode;
          remove?: never;
      };

const BasePageType = (props: PageTypeProps) => {
    const { addPageType, removePageType } = usePageTypes();

    useEffect(() => {
        if (props.remove) {
            removePageType(props.name);
            return;
        }

        addPageType({
            name: props.name,
            label: props.label,
            element: props.element
        });
    }, []);

    return null;
};

export const PageType = Object.assign(BasePageType, {
    Title,
    Path,
    Language
});
