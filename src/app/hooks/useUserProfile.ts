import { useEffect, useState } from 'react';
import { Room, UserEvent, UserEventHandlerMap } from 'matrix-js-sdk';
import { useMatrixClient } from './useMatrixClient';
import { getMemberAvatarMxc, getMemberDisplayName } from '../utils/room';
import { getMxIdLocalPart } from '../utils/matrix';

export type UserProfile = {
  avatarUrl?: string;
  displayName?: string;
};
export const useUserProfile = (userId: string, room?: Room): UserProfile => {
  const mx = useMatrixClient();

  const [profile, setProfile] = useState<UserProfile>(() => {
    const user = mx.getUser(userId);
    return {
      avatarUrl: user?.avatarUrl,
      displayName: user?.displayName,
    };
  });

  useEffect(() => {
    const user = mx.getUser(userId);
    const onAvatarChange: UserEventHandlerMap[UserEvent.AvatarUrl] = (event, myUser) => {
      setProfile((cp) => ({
        ...cp,
        avatarUrl: myUser.avatarUrl,
      }));
    };
    const onDisplayNameChange: UserEventHandlerMap[UserEvent.DisplayName] = (event, myUser) => {
      setProfile((cp) => ({
        ...cp,
        displayName: myUser.displayName,
      }));
    };
    mx.getProfileInfo(userId).then((info) =>
      setProfile({
        avatarUrl: getMemberAvatarMxc(room, userId) ?? info.avatar_url,
        displayName:
          getMemberDisplayName(room, userId) ??
          info.displayname ??
          getMxIdLocalPart(userId) ??
          userId,
      })
    );

    user?.on(UserEvent.AvatarUrl, onAvatarChange);
    user?.on(UserEvent.DisplayName, onDisplayNameChange);
    return () => {
      user?.removeListener(UserEvent.AvatarUrl, onAvatarChange);
      user?.removeListener(UserEvent.DisplayName, onDisplayNameChange);
    };
  }, [mx, userId, room]);

  return profile;
};
