import React, { MouseEventHandler, useCallback, useRef, useState } from 'react';
import { useAtomValue } from 'jotai';
import { useNavigate } from 'react-router-dom';
import { Box, PopOut, RectCords, Text } from 'fork-of-folds';
import FocusTrap from 'focus-trap-react';
import { Room } from 'matrix-js-sdk';
import { useDirects } from '../../../state/hooks/roomList';
import { useMatrixClient } from '../../../hooks/useMatrixClient';
import { mDirectAtom } from '../../../state/mDirectList';
import { allRoomsAtom } from '../../../state/room-list/roomList';
import { roomToUnreadAtom } from '../../../state/room/roomToUnread';
import { useRoomsUnread } from '../../../state/hooks/unread';
import { getDirectRoomPath } from '../../pathUtils';
import { getCanonicalAliasOrRoomId } from '../../../utils/matrix';
import { RoomAvatar } from '../../../components/room-avatar';
import { RoomUnreadProvider } from '../../../components/RoomUnreadProvider';
import {
  SidebarItem,
  SidebarItemTooltip,
  SidebarAvatar,
  SidebarItemBadge,
} from '../../../components/sidebar';
import { UnreadBadge } from '../../../components/unread-badge';
import { useMediaAuthentication } from '../../../hooks/useMediaAuthentication';
import { nameInitials } from '../../../utils/common';
import { stopPropagation } from '../../../utils/keyboard';
import { getDirectRoomAvatarUrl, getRoomAvatarUrl } from '../../../utils/room';
import { RoomNavItemMenu } from '../../../features/room-nav/RoomNavItem';
import {
  getRoomNotificationMode,
  RoomNotificationMode,
  useRoomsNotificationPreferencesContext,
} from '../../../hooks/useRoomsNotificationPreferences';

type SpaceTabProps = {
  room: Room;
  onClick: MouseEventHandler<HTMLButtonElement>;
  notificationMode?: RoomNotificationMode;
};
function DMTab({ room, onClick, notificationMode }: SpaceTabProps) {
  const mx = useMatrixClient();
  const useAuthentication = useMediaAuthentication();
  const targetRef = useRef<HTMLDivElement>(null);

  const [menuAnchor, setMenuAnchor] = useState<RectCords>();

  const handleContextMenu: MouseEventHandler<HTMLButtonElement> = (evt) => {
    evt.preventDefault();
    const cords = evt.currentTarget.getBoundingClientRect();
    setMenuAnchor((currentState) => {
      if (currentState) return undefined;
      return cords;
    });
  };
  const avatarSrc =
    getRoomAvatarUrl(mx, room, 96, useAuthentication) ||
    getDirectRoomAvatarUrl(mx, room, 96, useAuthentication) ||
    undefined;

  return (
    <RoomUnreadProvider roomId={room.roomId}>
      {(unread) => (
        <SidebarItem ref={targetRef}>
          <SidebarItemTooltip tooltip={room.name}>
            {(triggerRef) => (
              <SidebarAvatar
                as="button"
                data-id={room.roomId}
                ref={triggerRef}
                size="400"
                onClick={onClick}
                onContextMenu={handleContextMenu}
              >
                <RoomAvatar
                  roomId={room.roomId}
                  src={avatarSrc}
                  alt={room.name}
                  renderFallback={() => <Text size="H4">{nameInitials(room.name, 2)}</Text>}
                />
              </SidebarAvatar>
            )}
          </SidebarItemTooltip>
          {unread && (
            <SidebarItemBadge hasCount={unread.total > 0}>
              <UnreadBadge highlight={unread.highlight > 0} count={unread.total} />
            </SidebarItemBadge>
          )}
          {menuAnchor && (
            <PopOut
              anchor={menuAnchor}
              position="Right"
              align="Start"
              content={
                <FocusTrap
                  focusTrapOptions={{
                    initialFocus: false,
                    returnFocusOnDeactivate: false,
                    onDeactivate: () => setMenuAnchor(undefined),
                    clickOutsideDeactivates: true,
                    isKeyForward: (evt: KeyboardEvent) => evt.key === 'ArrowDown',
                    isKeyBackward: (evt: KeyboardEvent) => evt.key === 'ArrowUp',
                    escapeDeactivates: stopPropagation,
                  }}
                >
                  <RoomNavItemMenu
                    room={room}
                    requestClose={() => setMenuAnchor(undefined)}
                    notificationMode={notificationMode}
                  />
                </FocusTrap>
              }
            />
          )}
        </SidebarItem>
      )}
    </RoomUnreadProvider>
  );
}

export function UnreadsTab() {
  const navigate = useNavigate();
  const mx = useMatrixClient();
  const notificationPreferences = useRoomsNotificationPreferencesContext();

  const mDirects = useAtomValue(mDirectAtom);
  const directs = useDirects(mx, allRoomsAtom, mDirects);
  const unreadSet = useRoomsUnread(directs, roomToUnreadAtom)?.from ?? undefined;

  const handleSpaceClick = useCallback(
    (roomId: string) => navigate(getDirectRoomPath(getCanonicalAliasOrRoomId(mx, roomId))),
    [mx, navigate]
  );

  if (!unreadSet) return null;

  const unread = Array.from(unreadSet);
  return (
    <Box gap="300" direction="Column">
      {unread.map((roomId) => {
        const room = mx.getRoom(roomId);
        if (!room) return null;
        return (
          <DMTab
            key={roomId}
            room={room}
            onClick={() => handleSpaceClick(roomId)}
            notificationMode={getRoomNotificationMode(notificationPreferences, room.roomId)}
          />
        );
      })}
    </Box>
  );
}
