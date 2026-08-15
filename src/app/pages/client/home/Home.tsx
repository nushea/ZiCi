import React, { MouseEventHandler, forwardRef, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Avatar,
  Box,
  Button,
  Icon,
  IconButton,
  Icons,
  Menu,
  MenuItem,
  PopOut,
  RectCords,
  Text,
  config,
  toRem,
} from 'fork-of-folds';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useAtom, useAtomValue } from 'jotai';
import FocusTrap from 'focus-trap-react';
import { factoryRoomIdByActivity, factoryRoomIdByAtoZ } from '../../../utils/sort';
import {
  NavButton,
  NavCategory,
  NavCategoryHeader,
  NavEmptyCenter,
  NavEmptyLayout,
  NavItem,
  NavItemContent,
  NavLink,
} from '../../../components/nav';
import {
  encodeSearchParamValueArray,
  getExplorePath,
  getHomeCreatePath,
  getHomeRoomPath,
  getHomeSearchPath,
  withSearchParam,
} from '../../pathUtils';
import { getCanonicalAliasOrRoomId } from '../../../utils/matrix';
import { useSelectedRoom } from '../../../hooks/router/useSelectedRoom';
import {
  useHomeCreateSelected,
  useHomeSearchSelected,
} from '../../../hooks/router/useHomeSelected';
import { useHomeRooms } from './useHomeRooms';
import { useMatrixClient } from '../../../hooks/useMatrixClient';
import { VirtualTile } from '../../../components/virtualizer';
import { RoomNavCategoryButton, RoomNavItem } from '../../../features/room-nav';
import { makeNavCategoryId } from '../../../state/closedNavCategories';
import { roomToUnreadAtom } from '../../../state/room/roomToUnread';
import { useCategoryHandler } from '../../../hooks/useCategoryHandler';
import { useNavToActivePathMapper } from '../../../hooks/useNavToActivePathMapper';
import { PageNav, PageNavHeader, PageNavContent } from '../../../components/page';
import { useRoomsUnread } from '../../../state/hooks/unread';
import { markAsRead } from '../../../utils/notifications';
import { useClosedNavCategoriesAtom } from '../../../state/hooks/closedNavCategories';
import { stopPropagation } from '../../../utils/keyboard';
import { useSetting } from '../../../state/hooks/settings';
import { settingsAtom } from '../../../state/settings';
import {
  getRoomNotificationMode,
  useRoomsNotificationPreferencesContext,
} from '../../../hooks/useRoomsNotificationPreferences';
import { UseStateProvider } from '../../../components/UseStateProvider';
import { JoinAddressPrompt } from '../../../components/join-address-prompt';
import { _RoomSearchParams } from '../../paths';
import { useScreenSizeContext, ScreenSize } from '../../../hooks/useScreenSize';
import { SidebarResizer } from '../sidebar/SidebarResizer';

type HomeMenuProps = {
  requestClose: () => void;
};
const HomeMenu = forwardRef<HTMLDivElement, HomeMenuProps>(({ requestClose }, ref) => {
  const orphanRooms = useHomeRooms();
  const [hideActivity] = useSetting(settingsAtom, 'hideActivity');
  const unread = useRoomsUnread(orphanRooms, roomToUnreadAtom);
  const mx = useMatrixClient();

  const handleMarkAsRead = () => {
    if (!unread) return;
    orphanRooms.forEach((rId) => markAsRead(mx, rId, hideActivity));
    requestClose();
  };

  return (
    <Menu ref={ref} style={{ maxWidth: toRem(160), width: '100vw' }}>
      <Box direction="Column" gap="100" style={{ padding: config.space.S100 }}>
        <MenuItem
          onClick={handleMarkAsRead}
          size="300"
          after={<Icon size="100" src={Icons.CheckTwice} />}
          radii="300"
          aria-disabled={!unread}
        >
          <Text style={{ flexGrow: 1 }} as="span" size="T300" truncate>
            Mark as Read
          </Text>
        </MenuItem>
      </Box>
    </Menu>
  );
});

function HomeHeader({ hideText }: { hideText?: boolean }) {
  const [menuAnchor, setMenuAnchor] = useState<RectCords>();

  const handleOpenMenu: MouseEventHandler<HTMLButtonElement> = (evt) => {
    const cords = evt.currentTarget.getBoundingClientRect();
    setMenuAnchor((currentState) => {
      if (currentState) return undefined;
      return cords;
    });
  };

  return (
    <>
      <PageNavHeader hideText={hideText}>
        {!hideText ? (
          <Box alignItems="Center" grow="Yes" gap="300">
            <Box grow="Yes">
              <Text size="H4" truncate>
                Home
              </Text>
            </Box>
            <Box>
              <IconButton aria-pressed={!!menuAnchor} variant="Background" onClick={handleOpenMenu}>
                <Icon src={Icons.VerticalDots} size="200" />
              </IconButton>
            </Box>
          </Box>
        ) : (
          <IconButton aria-pressed={!!menuAnchor} variant="Background" onClick={handleOpenMenu}>
            <Icon src={Icons.Home} size="200" />
          </IconButton>
        )}
      </PageNavHeader>
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
            <HomeMenu requestClose={() => setMenuAnchor(undefined)} />
          </FocusTrap>
        }
      />
    </>
  );
}

function HomeEmpty() {
  const navigate = useNavigate();

  return (
    <NavEmptyCenter>
      <NavEmptyLayout
        icon={<Icon size="600" src={Icons.Hash} />}
        title={
          <Text size="H5" align="Center">
            No Rooms
          </Text>
        }
        content={
          <Text size="T300" align="Center">
            You do not have any rooms yet.
          </Text>
        }
        options={
          <>
            <Button onClick={() => navigate(getHomeCreatePath())} variant="Secondary" size="300">
              <Text size="B300" truncate>
                Create Room
              </Text>
            </Button>
            <Button
              onClick={() => navigate(getExplorePath())}
              variant="Secondary"
              fill="Soft"
              size="300"
            >
              <Text size="B300" truncate>
                Explore Community Rooms
              </Text>
            </Button>
          </>
        }
      />
    </NavEmptyCenter>
  );
}

const DEFAULT_CATEGORY_ID = makeNavCategoryId('home', 'room');
export function Home() {
  const mx = useMatrixClient();
  useNavToActivePathMapper('home');
  const scrollRef = useRef<HTMLDivElement>(null);
  const rooms = useHomeRooms();
  const notificationPreferences = useRoomsNotificationPreferencesContext();
  const roomToUnread = useAtomValue(roomToUnreadAtom);
  const navigate = useNavigate();

  const selectedRoomId = useSelectedRoom();
  const createRoomSelected = useHomeCreateSelected();
  const searchSelected = useHomeSearchSelected();
  const noRoomToDisplay = rooms.length === 0;
  const [closedCategories, setClosedCategories] = useAtom(useClosedNavCategoriesAtom());

  const sortedRooms = useMemo(() => {
    const items = Array.from(rooms).sort(
      closedCategories.has(DEFAULT_CATEGORY_ID)
        ? factoryRoomIdByActivity(mx)
        : factoryRoomIdByAtoZ(mx)
    );
    if (closedCategories.has(DEFAULT_CATEGORY_ID)) {
      return items.filter((rId) => roomToUnread.has(rId) || rId === selectedRoomId);
    }
    return items;
  }, [mx, rooms, closedCategories, roomToUnread, selectedRoomId]);

  const virtualizer = useVirtualizer({
    count: sortedRooms.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 38,
    overscan: 10,
  });

  const handleCategoryClick = useCategoryHandler(setClosedCategories, (categoryId) =>
    closedCategories.has(categoryId)
  );

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
        <HomeHeader hideText={hideText} />
        {noRoomToDisplay ? (
          <HomeEmpty />
        ) : (
          <PageNavContent scrollRef={scrollRef}>
            <Box direction="Column" gap="300">
              <NavCategory>
                <NavItem variant="Background" radii="400" aria-selected={createRoomSelected}>
                  <NavButton onClick={() => navigate(getHomeCreatePath())}>
                    <NavItemContent style={hideText ? { padding: 0, paddingRight: 0 } : undefined}>
                      <Box
                        as="span"
                        grow="Yes"
                        alignItems="Center"
                        justifyContent="Center"
                        gap="200"
                      >
                        <Avatar size="200" radii="400">
                          <Icon src={Icons.Plus} size="100" />
                        </Avatar>
                        {!hideText && (
                          <Box as="span" grow="Yes">
                            <Text as="span" size="Inherit" truncate>
                              Create Room
                            </Text>
                          </Box>
                        )}
                      </Box>
                    </NavItemContent>
                  </NavButton>
                </NavItem>
                <UseStateProvider initial={false}>
                  {(open, setOpen) => (
                    <>
                      <NavItem variant="Background" radii="400">
                        <NavButton onClick={() => setOpen(true)}>
                          <NavItemContent
                            style={hideText ? { padding: 0, paddingRight: 0 } : undefined}
                          >
                            <Box
                              as="span"
                              grow="Yes"
                              alignItems="Center"
                              justifyContent="Center"
                              gap="200"
                            >
                              <Avatar size="200" radii="400">
                                <Icon src={Icons.Link} size="100" />
                              </Avatar>
                              {!hideText && (
                                <Box as="span" grow="Yes">
                                  <Text as="span" size="Inherit" truncate>
                                    Join with Address
                                  </Text>
                                </Box>
                              )}
                            </Box>
                          </NavItemContent>
                        </NavButton>
                      </NavItem>
                      {open && (
                        <JoinAddressPrompt
                          onCancel={() => setOpen(false)}
                          onOpen={(roomIdOrAlias, viaServers, eventId) => {
                            setOpen(false);
                            const path = getHomeRoomPath(roomIdOrAlias, eventId);
                            navigate(
                              viaServers
                                ? withSearchParam<_RoomSearchParams>(path, {
                                    viaServers: encodeSearchParamValueArray(viaServers),
                                  })
                                : path
                            );
                          }}
                        />
                      )}
                    </>
                  )}
                </UseStateProvider>
                <NavItem variant="Background" radii="400" aria-selected={searchSelected}>
                  <NavLink to={getHomeSearchPath()}>
                    <NavItemContent style={hideText ? { padding: 0, paddingRight: 0 } : undefined}>
                      <Box
                        as="span"
                        grow="Yes"
                        alignItems="Center"
                        justifyContent="Center"
                        gap="200"
                      >
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
              <NavCategory>
                <NavCategoryHeader>
                  <RoomNavCategoryButton
                    closed={closedCategories.has(DEFAULT_CATEGORY_ID)}
                    data-category-id={DEFAULT_CATEGORY_ID}
                    onClick={handleCategoryClick}
                    style={hideText ? { padding: '0', justifyContent: 'center' } : undefined}
                  >
                    {!hideText && <>Rooms</>}
                  </RoomNavCategoryButton>
                </NavCategoryHeader>
                <div
                  style={{
                    position: 'relative',
                    height: virtualizer.getTotalSize(),
                  }}
                >
                  {virtualizer.getVirtualItems().map((vItem) => {
                    const roomId = sortedRooms[vItem.index];
                    const room = mx.getRoom(roomId);
                    if (!room) return null;
                    const selected = selectedRoomId === roomId;

                    return (
                      <VirtualTile
                        virtualItem={vItem}
                        key={vItem.index}
                        ref={virtualizer.measureElement}
                      >
                        <RoomNavItem
                          room={room}
                          selected={selected}
                          linkPath={getHomeRoomPath(getCanonicalAliasOrRoomId(mx, roomId))}
                          notificationMode={getRoomNotificationMode(
                            notificationPreferences,
                            room.roomId
                          )}
                          hideText={hideText}
                        />
                      </VirtualTile>
                    );
                  })}
                </div>
              </NavCategory>
            </Box>
          </PageNavContent>
        )}
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
