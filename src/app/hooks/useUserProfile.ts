import { useEffect, useState } from 'react';
import {
  EventTimeline,
  EventType,
  IContent,
  Room,
  UserEvent,
  UserEventHandlerMap,
} from 'matrix-js-sdk';
import { atom, useAtom } from 'jotai';
import { useMatrixClient } from './useMatrixClient';
import { getMemberAvatarMxc, getMemberDisplayName } from '../utils/room';
import { getMxIdLocalPart, mxcUrlToHttp } from '../utils/matrix';
import { ColorSet, extendedKeys, MemberPowerTag } from '../../types/matrix/room';
import { ThemeKind, useActiveTheme } from './useTheme';
import { accessibleColor } from '../plugins/color';
import { useMediaAuthentication } from './useMediaAuthentication';

export type BaseProfile = {
  avatarUrl?: string;
  displayName?: string;
  colors?: ColorSet;
};
type ExtendedProfile = {
  color?: string;
  bannerUrl?: string;
};

export type UserProfile = {
  profile: BaseProfile;
  extended: ExtendedProfile;
  handle: string;
};
type StoredProfiles = {
  [user: string]: IContent;
};

// probably terrible way to do it, easier to implement than anything else tho so :shrug:
const storedProfiles = atom<StoredProfiles>({});

export const useUserProfile = ({
  userId,
  room,
  memberPowerTag,
}: {
  userId: string;
  room?: Room;
  memberPowerTag?: MemberPowerTag;
}): UserProfile => {
  const mx = useMatrixClient();
  const themeKind = useActiveTheme().kind;
  const [getStoredProfiles, setStoredProfiles] = useAtom(storedProfiles);
  const useAuthentication = useMediaAuthentication();

  const [extendedProfile, setExtendedProfile] = useState(getStoredProfiles[userId]);
  const [profile, setProfile] = useState<BaseProfile>(() => {
    const user = mx.getUser(userId);
    mx.getExtendedProfile(userId).then(setExtendedProfile);
    const avatarMxC = getMemberAvatarMxc(room, userId);
    const roomAvatarUrl = mxcUrlToHttp(mx, avatarMxC ?? '', useAuthentication);
    // user.avatarUrl is a lie in getUser for some reason :>
    const avatarUrl =
      typeof roomAvatarUrl === 'string' && roomAvatarUrl.length > 0
        ? roomAvatarUrl
        : mxcUrlToHttp(mx, user?.avatarUrl ?? '', useAuthentication) ?? undefined;

    return {
      avatarUrl,
      displayName:
        getMemberDisplayName(room, userId) ??
        user?.displayName ??
        getMxIdLocalPart(userId) ??
        userId,
    };
  });

  useEffect(() => {
    if (getStoredProfiles[userId] === extendedProfile) return;
    const profiles = getStoredProfiles;
    profiles[userId] = extendedProfile;
    setStoredProfiles(profiles);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [extendedProfile]);
  useEffect(() => {
    const user = mx.getUser(userId);
    const updateBaseProfile: UserEventHandlerMap[UserEvent.AvatarUrl | UserEvent.DisplayName] = (
      event,
      myUser
    ) => {
      setProfile(myUser);
      mx.getExtendedProfile(userId).then(setExtendedProfile);
    };
    const state = room?.getLiveTimeline().getState(EventTimeline.FORWARDS);
    const roomMemberEvent = state?.getStateEvents(EventType.RoomMember, userId);
    const roomContent = roomMemberEvent?.getContent();
    const roomColorSet = roomContent?.[extendedKeys.userColors] as ColorSet | undefined;
    mx.getProfileInfo(userId).then((info) => {
      const avatarMxC = getMemberAvatarMxc(room, userId);
      const roomAvatarUrl = mxcUrlToHttp(mx, avatarMxC ?? '', useAuthentication);
      // user.avatarUrl is a lie in getUser for some reason :>
      const avatarUrl =
        typeof roomAvatarUrl === 'string' && roomAvatarUrl.length > 0
          ? roomAvatarUrl
          : mxcUrlToHttp(mx, info?.avatar_url ?? '', useAuthentication) ?? '';
      setProfile({
        avatarUrl,
        displayName:
          getMemberDisplayName(room, userId) ??
          info.displayname ??
          getMxIdLocalPart(userId) ??
          userId,
        colors: roomColorSet,
      });
    });

    user?.on(UserEvent.AvatarUrl, updateBaseProfile);
    user?.on(UserEvent.DisplayName, updateBaseProfile);
    return () => {
      user?.removeListener(UserEvent.AvatarUrl, updateBaseProfile);
      user?.removeListener(UserEvent.DisplayName, updateBaseProfile);
    };
  }, [mx, userId, room, extendedProfile, useAuthentication]);

  // succession m.room.member m.color >>> m.color extended key >>> m.powerLevelTag >>> default
  const roomColor =
    themeKind === ThemeKind.Dark
      ? profile.colors?.on_dark ?? (extendedProfile?.[extendedKeys.userColors] as ColorSet)?.on_dark
      : profile.colors?.on_light ??
        (extendedProfile?.[extendedKeys.userColors] as ColorSet)?.on_light;
  const preColor = roomColor ?? memberPowerTag?.color;
  const color = accessibleColor(themeKind, preColor);
  const extended = { color };
  const handle = userId;

  return { profile, extended, handle };
};
