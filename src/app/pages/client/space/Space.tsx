import React, {
  MouseEventHandler,
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useAtom, useAtomValue } from 'jotai';
import {
  Avatar,
  Box,
  Button,
  Icon,
  IconButton,
  Icons,
  Line,
  Menu,
  MenuItem,
  Modal,
  Overlay,
  OverlayBackdrop,
  OverlayCenter,
  PopOut,
  RectCords,
  Spinner,
  Text,
  color,
  config,
  toRem,
} from 'fork-of-folds';
import { useVirtualizer } from '@tanstack/react-virtual';
import { JoinRule, Room } from 'matrix-js-sdk';
import { RoomJoinRulesEventContent } from 'matrix-js-sdk/lib/types';
import FocusTrap from 'focus-trap-react';
import { useMatrixClient } from '../../../hooks/useMatrixClient';
import { mDirectAtom } from '../../../state/mDirectList';
import {
  NavCategory,
  NavCategoryHeader,
  NavItem,
  NavItemContent,
  NavLink,
} from '../../../components/nav';
import { getSpaceLobbyPath, getSpaceRoomPath, getSpaceSearchPath } from '../../pathUtils';
import { getCanonicalAliasOrRoomId, isRoomAlias, mxcUrlToHttp } from '../../../utils/matrix';
import { useSelectedRoom } from '../../../hooks/router/useSelectedRoom';
import {
  useSpaceLobbySelected,
  useSpaceSearchSelected,
} from '../../../hooks/router/useSelectedSpace';
import { useSpace } from '../../../hooks/useSpace';
import { VirtualTile } from '../../../components/virtualizer';
import { RoomNavCategoryButton, RoomNavItem } from '../../../features/room-nav';
import { makeNavCategoryId } from '../../../state/closedNavCategories';
import { roomToUnreadAtom } from '../../../state/room/roomToUnread';
import { useCategoryHandler } from '../../../hooks/useCategoryHandler';
import { useNavToActivePathMapper } from '../../../hooks/useNavToActivePathMapper';
import { useRoomName } from '../../../hooks/useRoomMeta';
import { useSpaceJoinedHierarchy } from '../../../hooks/useSpaceHierarchy';
import { allRoomsAtom } from '../../../state/room-list/roomList';
import { PageNav, PageNavContent, PageNavHeader } from '../../../components/page';
import { usePowerLevels } from '../../../hooks/usePowerLevels';
import { useRecursiveChildScopeFactory, useSpaceChildren } from '../../../state/hooks/roomList';
import { roomToParentsAtom } from '../../../state/room/roomToParents';
import { markAsRead } from '../../../utils/notifications';
import { useRoomsUnread } from '../../../state/hooks/unread';
import { UseStateProvider } from '../../../components/UseStateProvider';
import { LeaveSpacePrompt } from '../../../components/leave-space-prompt';
import { copyToClipboard } from '../../../utils/dom';
import { useClosedNavCategoriesAtom } from '../../../state/hooks/closedNavCategories';
import { useStateEvent } from '../../../hooks/useStateEvent';
import {
  CustomStateEvent,
  Membership,
  RoomBannerContent,
  StateEvent,
} from '../../../../types/matrix/room';
import { stopPropagation } from '../../../utils/keyboard';
import { getMatrixToRoom } from '../../../plugins/matrix-to';
import { getViaServers } from '../../../plugins/via-servers';
import { useSetting } from '../../../state/hooks/settings';
import { settingsAtom } from '../../../state/settings';
import {
  getRoomNotificationMode,
  useRoomsNotificationPreferencesContext,
} from '../../../hooks/useRoomsNotificationPreferences';
import { useOpenSpaceSettings } from '../../../state/hooks/spaceSettings';
import { useRoomNavigate } from '../../../hooks/useRoomNavigate';
import { useRoomCreators } from '../../../hooks/useRoomCreators';
import { useRoomPermissions } from '../../../hooks/useRoomPermissions';
import { ContainerColor } from '../../../styles/ContainerColor.css';
import { AsyncStatus, useAsyncCallback } from '../../../hooks/useAsyncCallback';
import { BreakWord } from '../../../styles/Text.css';
import { InviteUserPrompt } from '../../../components/invite-user-prompt';
import { useCallEmbed } from '../../../hooks/useCallEmbed';
import { useScreenSizeContext, ScreenSize } from '../../../hooks/useScreenSize';
import { SidebarResizer } from '../sidebar/SidebarResizer';
import { RoomAvatar } from '../../../components/room-avatar';
import { SidebarAvatar } from '../../../components/sidebar';
import { nameInitials } from '../../../utils/common';
import { getRoomAvatarUrl } from '../../../utils/room';
import { useMediaAuthentication } from '../../../hooks/useMediaAuthentication';
import { ImageViewer } from '../../../components/image-viewer';
import * as css from './styles.css';

type SpaceMenuProps = {
  room: Room;
  requestClose: () => void;
};
const SpaceMenu = forwardRef<HTMLDivElement, SpaceMenuProps>(({ room, requestClose }, ref) => {
  const mx = useMatrixClient();
  const [hideActivity] = useSetting(settingsAtom, 'hideActivity');
  const [developerTools] = useSetting(settingsAtom, 'developerTools');
  const roomToParents = useAtomValue(roomToParentsAtom);
  const powerLevels = usePowerLevels(room);
  const creators = useRoomCreators(room);

  const permissions = useRoomPermissions(creators, powerLevels);
  const canInvite = permissions.action('invite', mx.getSafeUserId());
  const openSpaceSettings = useOpenSpaceSettings();
  const { navigateRoom } = useRoomNavigate();

  const [invitePrompt, setInvitePrompt] = useState(false);

  const allChild = useSpaceChildren(
    allRoomsAtom,
    room.roomId,
    useRecursiveChildScopeFactory(mx, roomToParents)
  );
  const unread = useRoomsUnread(allChild, roomToUnreadAtom);

  const handleMarkAsRead = () => {
    allChild.forEach((childRoomId) => markAsRead(mx, childRoomId, hideActivity));
    requestClose();
  };

  const handleCopyLink = () => {
    const roomIdOrAlias = getCanonicalAliasOrRoomId(mx, room.roomId);
    const viaServers = isRoomAlias(roomIdOrAlias) ? undefined : getViaServers(room);
    copyToClipboard(getMatrixToRoom(roomIdOrAlias, viaServers));
    requestClose();
  };

  const handleInvite = () => {
    setInvitePrompt(true);
  };

  const handleRoomSettings = () => {
    openSpaceSettings(room.roomId);
    requestClose();
  };

  const handleOpenTimeline = () => {
    navigateRoom(room.roomId);
    requestClose();
  };

  return (
    <Menu ref={ref} style={{ maxWidth: toRem(160), width: '100vw' }}>
      <Box direction="Column" gap="100" style={{ padding: config.space.S100 }}>
        {invitePrompt && room && (
          <InviteUserPrompt
            room={room}
            requestClose={() => {
              setInvitePrompt(false);
              requestClose();
            }}
          />
        )}
        <MenuItem
          onClick={handleMarkAsRead}
          size="300"
          after={<Icon size="100" src={Icons.CheckTwice} />}
          radii="300"
          disabled={!unread}
        >
          <Text style={{ flexGrow: 1 }} as="span" size="T300" truncate>
            Mark as Read
          </Text>
        </MenuItem>
      </Box>
      <Line variant="Surface" size="300" />
      <Box direction="Column" gap="100" style={{ padding: config.space.S100 }}>
        <MenuItem
          onClick={handleInvite}
          variant="Primary"
          fill="None"
          size="300"
          after={<Icon size="100" src={Icons.UserPlus} />}
          radii="300"
          aria-pressed={invitePrompt}
          disabled={!canInvite}
        >
          <Text style={{ flexGrow: 1 }} as="span" size="T300" truncate>
            Invite
          </Text>
        </MenuItem>
        <MenuItem
          onClick={handleCopyLink}
          size="300"
          after={<Icon size="100" src={Icons.Link} />}
          radii="300"
        >
          <Text style={{ flexGrow: 1 }} as="span" size="T300" truncate>
            Copy Link
          </Text>
        </MenuItem>
        <MenuItem
          onClick={handleRoomSettings}
          size="300"
          after={<Icon size="100" src={Icons.Setting} />}
          radii="300"
        >
          <Text style={{ flexGrow: 1 }} as="span" size="T300" truncate>
            Space Settings
          </Text>
        </MenuItem>
        {developerTools && (
          <MenuItem
            onClick={handleOpenTimeline}
            size="300"
            after={<Icon size="100" src={Icons.Terminal} />}
            radii="300"
          >
            <Text style={{ flexGrow: 1 }} as="span" size="T300" truncate>
              Event Timeline
            </Text>
          </MenuItem>
        )}
      </Box>
      <Line variant="Surface" size="300" />
      <Box direction="Column" gap="100" style={{ padding: config.space.S100 }}>
        <UseStateProvider initial={false}>
          {(promptLeave, setPromptLeave) => (
            <>
              <MenuItem
                onClick={() => setPromptLeave(true)}
                variant="Critical"
                fill="None"
                size="300"
                after={<Icon size="100" src={Icons.ArrowGoLeft} />}
                radii="300"
                aria-pressed={promptLeave}
              >
                <Text style={{ flexGrow: 1 }} as="span" size="T300" truncate>
                  Leave Space
                </Text>
              </MenuItem>
              {promptLeave && (
                <LeaveSpacePrompt
                  roomId={room.roomId}
                  onDone={requestClose}
                  onCancel={() => setPromptLeave(false)}
                />
              )}
            </>
          )}
        </UseStateProvider>
      </Box>
    </Menu>
  );
});

function SpaceHeader({ hideText }: { hideText?: boolean }) {
  const mx = useMatrixClient();
  const useAuthentication = useMediaAuthentication();
  const space = useSpace();
  const spaceName = useRoomName(space);
  const [menuAnchor, setMenuAnchor] = useState<RectCords>();

  const joinRules = useStateEvent(
    space,
    StateEvent.RoomJoinRules
  )?.getContent<RoomJoinRulesEventContent>();

  const handleOpenMenu: MouseEventHandler<HTMLButtonElement> = (evt) => {
    const cords = evt.currentTarget.getBoundingClientRect();
    setMenuAnchor((currentState) => {
      if (currentState) return undefined;
      return cords;
    });
  };

  const [roomBannerHeight, setRoomBannerHeight] = useSetting(settingsAtom, 'roomBannerHeight');
  const [curHeight, setCurHeight] = useState(roomBannerHeight);
  useEffect(() => {
    setCurHeight(roomBannerHeight);
  }, [roomBannerHeight]);

  const bannerState = useStateEvent(space, CustomStateEvent.RoomBanner);
  const bannerMXC = bannerState?.getContent<RoomBannerContent>()?.url;
  const bannerURI = mxcUrlToHttp(mx, bannerMXC ?? '', useAuthentication);
  const hasBanner = !!(bannerURI && !hideText);

  const [bannerViewerOpen, setBannerViewerOpen] = useState(false);
  useEffect(() => {
    if (!hasBanner) setBannerViewerOpen(false);
  }, [hasBanner]);
  return (
    <>
      <div className={hasBanner ? css.RoomCoverHeaderContainer : ''}>
        <div
          className={
            hasBanner ? css.RoomCoverNavContainer : css.RoomCoverlessNavContainer({ hideText })
          }
        >
          <PageNavHeader
            outlined={!hasBanner}
            style={hideText ? { justifyContent: 'center', padding: '0' } : undefined}
          >
            {!hideText ? (
              <Box alignItems="Center" grow="Yes" gap="300">
                <Box grow="Yes" alignItems="Center" gap="100">
                  <Text size="H4" truncate style={hasBanner ? { color: '#fff' } : {}}>
                    {spaceName}
                  </Text>
                  {joinRules?.join_rule !== JoinRule.Public && <Icon src={Icons.Lock} size="50" />}
                </Box>
                <Box shrink="No">
                  <IconButton
                    aria-pressed={!!menuAnchor}
                    variant="Background"
                    onClick={handleOpenMenu}
                    style={hasBanner ? { backgroundColor: 'transparent', color: '#fff' } : {}}
                  >
                    <Icon src={Icons.VerticalDots} size="200" />
                  </IconButton>
                </Box>
              </Box>
            ) : (
              <SidebarAvatar as="button" data-id={space.roomId} size="300" onClick={handleOpenMenu}>
                <RoomAvatar
                  roomId={space.roomId}
                  src={getRoomAvatarUrl(mx, space, 96, useAuthentication) ?? undefined}
                  alt={space.name}
                  renderFallback={() => <Text size="H4">{nameInitials(space.name, 2)}</Text>}
                />
              </SidebarAvatar>
            )}
          </PageNavHeader>
          {menuAnchor && (
            <PopOut
              anchor={menuAnchor}
              position="Bottom"
              align="End"
              offset={6}
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
                  <SpaceMenu room={space} requestClose={() => setMenuAnchor(undefined)} />
                </FocusTrap>
              }
            />
          )}
        </div>
      </div>

      {hasBanner && (
        <Box shrink="No" className={css.RoomCoverContainer} style={{ height: toRem(curHeight) }}>
          <div className={css.RoomCover}>
            <button
              type="button"
              className={css.RoomCoverImageButton}
              data-no-button-motion
              aria-label={`View ${spaceName} banner`}
              onClick={() => setBannerViewerOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setBannerViewerOpen(true);
                }
              }}
            >
              <img className={css.RoomCoverImage} src={bannerURI} alt="" draggable="false" />
            </button>
            <SidebarResizer
              setCurWidth={setCurHeight}
              sidebarWidth={roomBannerHeight}
              setSidebarWidth={setRoomBannerHeight}
              instep={56}
              outstep={66}
              minValue={56}
              maxValue={500}
              topSided
            />
          </div>
        </Box>
      )}
      {hasBanner && bannerViewerOpen && (
        <Overlay open backdrop={<OverlayBackdrop />}>
          <OverlayCenter>
            <FocusTrap
              focusTrapOptions={{
                initialFocus: false,
                onDeactivate: () => setBannerViewerOpen(false),
                clickOutsideDeactivates: true,
                escapeDeactivates: stopPropagation,
              }}
            >
              <Modal size="500" onContextMenu={(evt: React.MouseEvent) => evt.stopPropagation()}>
                <ImageViewer
                  src={bannerURI}
                  alt={`${spaceName} banner`}
                  requestClose={() => setBannerViewerOpen(false)}
                />
              </Modal>
            </FocusTrap>
          </OverlayCenter>
        </Overlay>
      )}
    </>
  );
}

type SpaceTombstoneProps = { roomId: string; replacementRoomId: string };
function SpaceTombstone({ roomId, replacementRoomId }: SpaceTombstoneProps) {
  const mx = useMatrixClient();
  const { navigateSpace } = useRoomNavigate();

  const [joinState, handleJoin] = useAsyncCallback(
    useCallback(() => {
      const currentRoom = mx.getRoom(roomId);
      const via = currentRoom ? getViaServers(currentRoom) : [];
      return mx.joinRoom(replacementRoomId, {
        viaServers: via,
      });
    }, [mx, roomId, replacementRoomId])
  );
  const replacementRoom = mx.getRoom(replacementRoomId);

  const handleOpen = () => {
    if (replacementRoom) navigateSpace(replacementRoom.roomId);
    if (joinState.status === AsyncStatus.Success) navigateSpace(joinState.data.roomId);
  };

  return (
    <Box
      style={{
        padding: config.space.S200,
        borderRadius: config.radii.R400,
        borderWidth: config.borderWidth.B300,
      }}
      className={ContainerColor({ variant: 'Surface' })}
      direction="Column"
      gap="300"
    >
      <Box direction="Column" grow="Yes" gap="100">
        <Text size="L400">Space Upgraded</Text>
        <Text size="T200">This space has been replaced and is no longer active.</Text>
        {joinState.status === AsyncStatus.Error && (
          <Text className={BreakWord} style={{ color: color.Critical.Main }} size="T200">
            {(joinState.error as { message: string })?.message ??
              'Failed to join replacement space!'}
          </Text>
        )}
      </Box>
      <Box direction="Column" shrink="No">
        {replacementRoom?.getMyMembership() === Membership.Join ||
        joinState.status === AsyncStatus.Success ? (
          <Button onClick={handleOpen} size="300" variant="Success" fill="Solid" radii="300">
            <Text size="B300">Open New Space</Text>
          </Button>
        ) : (
          <Button
            onClick={handleJoin}
            size="300"
            variant="Primary"
            fill="Solid"
            radii="300"
            before={
              joinState.status === AsyncStatus.Loading && (
                <Spinner size="100" variant="Primary" fill="Solid" />
              )
            }
            disabled={joinState.status === AsyncStatus.Loading}
          >
            <Text size="B300">Join New Space</Text>
          </Button>
        )}
      </Box>
    </Box>
  );
}

export function Space() {
  const mx = useMatrixClient();
  const space = useSpace();
  useNavToActivePathMapper(space.roomId);
  const spaceIdOrAlias = getCanonicalAliasOrRoomId(mx, space.roomId);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mDirects = useAtomValue(mDirectAtom);
  const roomToUnread = useAtomValue(roomToUnreadAtom);
  const allRooms = useAtomValue(allRoomsAtom);
  const allJoinedRooms = useMemo(() => new Set(allRooms), [allRooms]);
  const notificationPreferences = useRoomsNotificationPreferencesContext();

  const tombstoneEvent = useStateEvent(space, StateEvent.RoomTombstone);
  const selectedRoomId = useSelectedRoom();
  const lobbySelected = useSpaceLobbySelected(spaceIdOrAlias);
  const searchSelected = useSpaceSearchSelected(spaceIdOrAlias);
  const callEmbed = useCallEmbed();

  const [closedCategories, setClosedCategories] = useAtom(useClosedNavCategoriesAtom());

  const getRoom = useCallback(
    (rId: string): Room | undefined => {
      if (allJoinedRooms.has(rId)) {
        return mx.getRoom(rId) ?? undefined;
      }
      return undefined;
    },
    [mx, allJoinedRooms]
  );

  const hierarchy = useSpaceJoinedHierarchy(
    space.roomId,
    getRoom,
    useCallback(
      (parentId, roomId) => {
        if (!closedCategories.has(makeNavCategoryId(space.roomId, parentId))) {
          return false;
        }
        const showRoomAnyway =
          roomToUnread.has(roomId) || roomId === selectedRoomId || callEmbed?.roomId === roomId;
        return !showRoomAnyway;
      },
      [space.roomId, closedCategories, roomToUnread, selectedRoomId, callEmbed]
    ),
    useCallback(
      (sId) => closedCategories.has(makeNavCategoryId(space.roomId, sId)),
      [closedCategories, space.roomId]
    )
  );

  const virtualizer = useVirtualizer({
    count: hierarchy.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 0,
    overscan: 10,
  });

  const handleCategoryClick = useCategoryHandler(setClosedCategories, (categoryId) =>
    closedCategories.has(categoryId)
  );

  const getToLink = (roomId: string) =>
    getSpaceRoomPath(spaceIdOrAlias, getCanonicalAliasOrRoomId(mx, roomId));

  const [roomSidebarWidth, setRoomSidebarWidth] = useSetting(settingsAtom, 'leftSidebarWidth');
  const [curWidth, setCurWidth] = useState(roomSidebarWidth);
  useEffect(() => {
    setCurWidth(roomSidebarWidth);
  }, [roomSidebarWidth]);

  const screenSize = useScreenSizeContext();
  const isMobile = screenSize === ScreenSize.Mobile;
  const hideText = curWidth <= 80 && !isMobile;

  return (
    <Box
      shrink="No"
      style={{
        position: 'relative',
        width: isMobile ? '100%' : toRem(curWidth),
      }}
    >
      <PageNav>
        <SpaceHeader hideText={hideText} />
        <PageNavContent scrollRef={scrollRef}>
          <Box direction="Column" gap="300">
            {tombstoneEvent && (
              <SpaceTombstone
                roomId={space.roomId}
                replacementRoomId={tombstoneEvent.getContent().replacement_room}
              />
            )}
            <NavCategory>
              <NavItem variant="Background" radii="400" aria-selected={lobbySelected}>
                <NavLink to={getSpaceLobbyPath(getCanonicalAliasOrRoomId(mx, space.roomId))}>
                  <NavItemContent style={hideText ? { padding: 0, paddingRight: 0 } : undefined}>
                    <Box as="span" grow="Yes" alignItems="Center" justifyContent="Center" gap="200">
                      <Avatar size="200" radii="400">
                        <Icon src={Icons.Flag} size="100" filled={lobbySelected} />
                      </Avatar>
                      {!hideText && (
                        <Box as="span" grow="Yes">
                          <Text as="span" size="Inherit" truncate>
                            Lobby
                          </Text>
                        </Box>
                      )}
                    </Box>
                  </NavItemContent>
                </NavLink>
              </NavItem>
              <NavItem variant="Background" radii="400" aria-selected={searchSelected}>
                <NavLink to={getSpaceSearchPath(getCanonicalAliasOrRoomId(mx, space.roomId))}>
                  <NavItemContent style={hideText ? { padding: 0, paddingRight: 0 } : undefined}>
                    <Box as="span" grow="Yes" alignItems="Center" justifyContent="Center" gap="200">
                      <Avatar size="200" radii="400">
                        <Icon src={Icons.Search} size="100" filled={searchSelected} />
                      </Avatar>
                      {!hideText && (
                        <Box as="span" grow="Yes">
                          <Text as="span" size="Inherit" truncate>
                            Message Search
                          </Text>
                        </Box>
                      )}
                    </Box>
                  </NavItemContent>
                </NavLink>
              </NavItem>
            </NavCategory>
            <NavCategory
              style={{
                height: virtualizer.getTotalSize(),
                position: 'relative',
              }}
            >
              {virtualizer.getVirtualItems().map((vItem) => {
                const { roomId } = hierarchy[vItem.index] ?? {};
                const room = mx.getRoom(roomId);
                if (!room) return null;

                if (room.isSpaceRoom()) {
                  const categoryId = makeNavCategoryId(space.roomId, roomId);

                  return (
                    <VirtualTile
                      virtualItem={vItem}
                      key={vItem.index}
                      ref={virtualizer.measureElement}
                    >
                      <div
                        style={{ paddingTop: vItem.index === 0 ? undefined : config.space.S400 }}
                      >
                        <NavCategoryHeader>
                          <RoomNavCategoryButton
                            data-category-id={categoryId}
                            onClick={handleCategoryClick}
                            style={
                              hideText ? { padding: '0', justifyContent: 'center' } : undefined
                            }
                          >
                            {!hideText && (roomId === space.roomId ? 'Rooms' : room?.name)}
                          </RoomNavCategoryButton>
                        </NavCategoryHeader>
                      </div>
                    </VirtualTile>
                  );
                }

                return (
                  <VirtualTile
                    virtualItem={vItem}
                    key={vItem.index}
                    ref={virtualizer.measureElement}
                  >
                    <RoomNavItem
                      room={room}
                      selected={selectedRoomId === roomId}
                      showAvatar={mDirects.has(roomId)}
                      direct={mDirects.has(roomId)}
                      linkPath={getToLink(roomId)}
                      notificationMode={getRoomNotificationMode(
                        notificationPreferences,
                        room.roomId
                      )}
                      hideText={hideText}
                    />
                  </VirtualTile>
                );
              })}
            </NavCategory>
          </Box>
        </PageNavContent>
      </PageNav>
      {!isMobile && (
        <SidebarResizer
          setCurWidth={setCurWidth}
          sidebarWidth={roomSidebarWidth}
          setSidebarWidth={setRoomSidebarWidth}
          instep={50}
          outstep={190}
          minValue={50}
          maxValue={500}
        />
      )}
    </Box>
  );
}
