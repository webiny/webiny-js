import { IconPickerPresenter } from "./IconPickerPresenter";
import { IconRepository } from "./IconRepository";
import { Icon } from "./types";

const mockIconTypes = [{ name: "icon" }, { name: "emoji" }, { name: "custom" }];

const mockIcons: Icon[] = [
    {
        type: "emoji",
        name: "thumbs_up",
        value: "👍",
        category: "People & Body",
        skinToneSupport: true
    },
    {
        type: "icon",
        name: "regular_address-book",
        value: '<path fill="currentColor" d="M384 48c8.8 0 16 7.2 16 16v384c0 8.8-7.2 16-16 16H96c-8.8 0-16-7.2-16-16V64c0-8.8 7.2-16 16-16h288zM96 0C60.7 0 32 28.7 32 64v384c0 35.3 28.7 64 64 64h288c35.3 0 64-28.7 64-64V64c0-35.3-28.7-64-64-64H96zm144 256a64 64 0 1 0 0-128a64 64 0 1 0 0 128zm-32 32c-44.2 0-80 35.8-80 80c0 8.8 7.2 16 16 16h192c8.8 0 16-7.2 16-16c0-44.2-35.8-80-80-80h-64zM512 80c0-8.8-7.2-16-16-16s-16 7.2-16 16v64c0 8.8 7.2 16 16 16s16-7.2 16-16V80zm-16 112c-8.8 0-16 7.2-16 16v64c0 8.8 7.2 16 16 16s16-7.2 16-16v-64c0-8.8-7.2-16-16-16zm16 144c0-8.8-7.2-16-16-16s-16 7.2-16 16v64c0 8.8 7.2 16 16 16s16-7.2 16-16v-64z"/>',
        category: "Business"
    }
];

const mockIconPackProviders = [
    {
        name: "mock_icons",
        getIcons: async () => {
            return mockIcons;
        }
    }
];

describe("IconPickerPresenter", () => {
    const icon: Icon = {
        type: "icon",
        name: "solid_bullseye",
        value: '<path fill="currentColor" d="M448 256a192 192 0 1 0-384 0a192 192 0 1 0 384 0zM0 256a256 256 0 1 1 512 0a256 256 0 1 1-512 0zm256 80a80 80 0 1 0 0-160a80 80 0 1 0 0 160zm0-224a144 144 0 1 1 0 288a144 144 0 1 1 0-288zm-32 144a32 32 0 1 1 64 0a32 32 0 1 1-64 0z"/>',
        category: "Business",
        color: "#282fe6"
    };

    let presenter: IconPickerPresenter;

    beforeEach(() => {
        const repository = new IconRepository(mockIconTypes, mockIconPackProviders);
        presenter = new IconPickerPresenter(repository);
    });

    it("should create an IconPickerPresenter with the `vm` definition", async () => {
        // let's load icons and set a predefined `selectedIcon`
        await presenter.load(icon);

        // `vm` should have the expected `selectedIcon` definition
        expect(presenter.vm.selectedIcon).toEqual(icon);

        // `vm` should have the expected `icons` definition
        expect(presenter.vm.icons).toEqual(mockIcons);
    });

    it("should be able to select an icon", async () => {
        // let's load icons
        await presenter.load();

        // should be able to set the icon
        presenter.setIcon(presenter.vm.icons[0]);

        // `vm` should have the expected `selectedIcon` value
        expect(presenter.vm.selectedIcon).toEqual(presenter.vm.icons[0]);
    });

    it("should be able to add an icon", async () => {
        // let's load icons
        await presenter.load();

        // should be able to set the icon
        presenter.addIcon(icon);

        // `vm` should have three icons
        expect(presenter.vm.icons.length).toBe(3);

        // `vm` should have the expected `icons` value
        expect(presenter.vm.icons).toEqual([...mockIcons, icon]);
    });

    it("should be able to filter icons by name", async () => {
        // let's load icons
        await presenter.load();

        // should be able to set the filter
        presenter.setFilter("book");

        // `vm` should have only one icon
        expect(presenter.vm.icons.length).toBe(1);

        // `vm` should have filtered icon
        expect(presenter.vm.icons[0]).toEqual(mockIcons[1]);
    });

    it("should be able to set active tab on menu open", async () => {
        // let's load icons and set a predefined `selectedIcon`
        await presenter.load(mockIcons[0]);

        // default `isMenuOpened` should be false
        expect(presenter.vm.isMenuOpened).toBe(false);

        // default `activeTab` should be 0
        expect(presenter.vm.activeTab).toBe(0);

        // should be able to set `isMenuOpened`
        // should be able to set `activeTab` based on `selectedIcon` type
        presenter.openMenu();

        // `vm` should have the expected `isMenuOpened` value
        expect(presenter.vm.isMenuOpened).toBe(true);

        // `vm` should have the expected `activeTab` value
        expect(presenter.vm.activeTab).toBe(1);
    });
});
