import { Icons, IconSrc } from 'fork-of-folds';
import { atom } from 'jotai';
import { isMacOS } from '../utils/user-agent';
import { KeySymbol } from '../utils/key-symbol';

const STORAGE_KEY = 'settings';
export type DateFormat =
  | 'D MMM YYYY'
  | 'DD/MM/YYYY'
  | 'MM/DD/YYYY'
  | 'YYYY/MM/DD'
  | 'YYYY-MM-DD'
  | '';
export type MessageSpacing = '0' | '100' | '200' | '300' | '400' | '500';
export enum MessageLayout {
  Modern = 0,
  Compact = 1,
  Bubble = 2,
}

export interface Settings {
  themeId?: string;
  useSystemTheme: boolean;
  lightThemeId?: string;
  darkThemeId?: string;
  monochromeMode?: boolean;
  isMarkdown: boolean;
  editorToolbar: boolean;
  twitterEmoji: boolean;
  pageZoom: number;
  hideActivity: boolean;

  isPeopleDrawer: boolean;
  memberSortFilterIndex: number;
  enterForNewline: boolean;
  messageLayout: MessageLayout;
  messageSpacing: MessageSpacing;
  hideMembershipEvents: boolean;
  hideNickAvatarEvents: boolean;
  mediaAutoLoad: boolean;
  urlPreview: boolean;
  encUrlPreview: boolean;
  showHiddenEvents: boolean;

  showNotifications: boolean;
  isNotificationSounds: boolean;

  hour24Clock: boolean;
  dateFormatString: string;

  developerTools: boolean;

  // reintroduced features
  leftSidebarWidth: number;
  memberSidebarWidth: number;
  vcmsgSidebarWidth: number;
  roomBannerHeight: number;
}

const defaultSettings: Settings = {
  themeId: undefined,
  useSystemTheme: true,
  lightThemeId: undefined,
  darkThemeId: undefined,
  monochromeMode: false,
  isMarkdown: true,
  editorToolbar: false,
  twitterEmoji: false,
  pageZoom: 100,
  hideActivity: false,

  isPeopleDrawer: true,
  memberSortFilterIndex: 0,
  enterForNewline: false,
  messageLayout: 0,
  messageSpacing: '400',
  hideMembershipEvents: false,
  hideNickAvatarEvents: true,
  mediaAutoLoad: true,
  urlPreview: true,
  encUrlPreview: false,
  showHiddenEvents: false,

  showNotifications: true,
  isNotificationSounds: true,

  hour24Clock: false,
  dateFormatString: 'D MMM YYYY',

  developerTools: false,

  // reintroduced features
  leftSidebarWidth: 256,
  memberSidebarWidth: 262,
  vcmsgSidebarWidth: 399,
  roomBannerHeight: 190,
};

const getSettings = () => {
  const settings = localStorage.getItem(STORAGE_KEY);
  if (settings === null) return defaultSettings;
  return {
    ...defaultSettings,
    ...(JSON.parse(settings) as Settings),
  };
};

const setSettings = (settings: Settings) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
};

const baseSettings = atom<Settings>(getSettings());
export const settingsAtom = atom<Settings, [Settings], undefined>(
  (get) => get(baseSettings),
  (get, set, update) => {
    set(baseSettings, update);
    setSettings(update);
  }
);

type SettingsOption = {
  name: string;
  value: unknown;
};

enum SettingTypes {
  Switch,
  DropDown,
  FreeForm,
  Percent,
}

type SettingsRequirement = {
  setting: keyof Settings;
  toBe: unknown; // the value that the setting described above should be
};

type SettingsItem = {
  title: string;
  description?: string;
  key: keyof Settings;
  type: SettingTypes;
  options?: SettingsOption[];
  requires?: SettingsRequirement[];
};
type SettingsCategory = {
  name: string;
  items: SettingsItem[];
};

type SettingsMenu = {
  name: string;
  icon: IconSrc;
  categories: SettingsCategory[];
};

type settingsLayoutType = SettingsMenu[];

const ThemeOptions: SettingsOption[] = [
  {
    name: 'Light',
    value: 'light-theme',
  },
  {
    name: 'Silver',
    value: 'silver-theme',
  },
  {
    name: 'Dark',
    value: 'dark-theme',
  },
  {
    name: 'Butter',
    value: 'butter-theme',
  },
  {
    name: 'Mocha',
    value: 'mocha-theme',
  },
];

const MessageLayoutOptions: SettingsOption[] = [
  {
    name: 'Modern',
    value: MessageLayout.Modern,
  },
  {
    name: 'Compact',
    value: MessageLayout.Compact,
  },
  {
    name: 'Bubble',
    value: MessageLayout.Bubble,
  },
];

const MessageSpacingOptions: SettingsOption[] = [
  {
    value: '0',
    name: 'None',
  },
  {
    value: '100',
    name: 'Ultra Small',
  },
  {
    value: '200',
    name: 'Extra Small',
  },
  {
    value: '300',
    name: 'Small',
  },
  {
    value: '400',
    name: 'Normal',
  },
  {
    value: '500',
    name: 'Large',
  },
];

export const settingsLayout: settingsLayoutType = [
  {
    name: 'General',
    icon: Icons.Setting,
    categories: [
      {
        name: 'Appearance',
        items: [
          {
            title: 'System Theme',
            description: 'Choose between light and dark theme based on system preference.',
            key: 'useSystemTheme',
            type: SettingTypes.Switch,
          },
          {
            title: 'System Theme',
            description: 'Choose between light and dark theme based on system preference.',
            key: 'useSystemTheme',
            type: SettingTypes.DropDown,
            options: ThemeOptions,
          },
          {
            title: 'Monochrome Mode',
            key: 'monochromeMode',
            type: SettingTypes.Switch,
          },
          {
            title: 'Twitter Emoji',
            key: 'twitterEmoji',
            type: SettingTypes.Switch,
          },
          {
            title: 'Page Zoom',
            key: 'pageZoom',
            type: SettingTypes.Percent,
          },
        ],
      },
      {
        name: 'Date & Time',
        items: [
          {
            title: '24-Hour Time Format',
            key: 'hour24Clock',
            type: SettingTypes.Switch,
          },
          {
            title: 'Date Format',
            key: 'dateFormatString',
            type: SettingTypes.DropDown,
            options: ThemeOptions,
          },
        ],
      },
      {
        name: 'Editor',
        items: [
          {
            title: 'ENTER for Newline',
            description: `Use ${
              isMacOS() ? KeySymbol.Command : 'Ctrl'
            } + ENTER to send message and ENTER for newline.`,
            key: 'enterForNewline',
            type: SettingTypes.Switch,
          },
          {
            title: 'Markdown Formatting',
            key: 'isMarkdown',
            type: SettingTypes.Switch,
          },
          {
            title: 'Hide Typing & Read Receipts',
            description:
              'Turn off both typing status and read receipts to keep your activity private.',
            key: 'hideActivity',
            type: SettingTypes.Switch,
          },
        ],
      },
      {
        name: 'Messages',
        items: [
          {
            title: 'Message Layout',
            key: 'messageLayout',
            type: SettingTypes.DropDown,
            options: MessageLayoutOptions,
          },
          {
            title: 'Message Spacing',
            key: 'messageSpacing',
            type: SettingTypes.DropDown,
            options: MessageSpacingOptions,
          },
          {
            title: 'Hide Membership Change',
            key: 'hideMembershipEvents',
            type: SettingTypes.Switch,
          },
          {
            title: 'Hide Profile Change',
            key: 'hideNickAvatarEvents',
            type: SettingTypes.Switch,
          },
          {
            title: 'Disable Media Auto Load',
            key: 'mediaAutoLoad',
            type: SettingTypes.Switch,
          },
          {
            title: 'Hide Membership Change',
            key: 'hideMembershipEvents',
            type: SettingTypes.Switch,
          },
          {
            title: 'Url Preview',
            key: 'urlPreview',
            type: SettingTypes.Switch,
          },
          {
            title: 'Url Preview in Encrypted Room',
            key: 'encUrlPreview',
            type: SettingTypes.Switch,
          },
          {
            title: 'Show Hidden Events',
            key: 'showHiddenEvents',
            type: SettingTypes.Switch,
          },
        ],
      },
    ],
  },
];
