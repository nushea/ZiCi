import React, { useEffect, useState } from 'react';
import { Avatar, Box, Icon, Icons, Text, toRem } from 'fork-of-folds';
import { useAtomValue } from 'jotai';
import { NavCategory, NavItem, NavItemContent, NavLink } from '../../../components/nav';
import { getInboxInvitesPath, getInboxNotificationsPath } from '../../pathUtils';
import {
  useInboxInvitesSelected,
  useInboxNotificationsSelected,
} from '../../../hooks/router/useInbox';
import { UnreadBadge } from '../../../components/unread-badge';
import { allInvitesAtom } from '../../../state/room-list/inviteList';
import { useNavToActivePathMapper } from '../../../hooks/useNavToActivePathMapper';
import { PageNav, PageNavContent, PageNavHeader } from '../../../components/page';
import { useScreenSizeContext, ScreenSize } from '../../../hooks/useScreenSize';
import { useSetting } from '../../../state/hooks/settings';
import { settingsAtom } from '../../../state/settings';
import { SidebarResizer } from '../sidebar/SidebarResizer';

function InvitesNavItem({ hideText }: { hideText?: boolean }) {
  const invitesSelected = useInboxInvitesSelected();
  const allInvites = useAtomValue(allInvitesAtom);
  const inviteCount = allInvites.length;

  return (
    <NavItem
      variant="Background"
      radii="400"
      highlight={inviteCount > 0}
      aria-selected={invitesSelected}
    >
      <NavLink to={getInboxInvitesPath()}>
        <NavItemContent style={hideText ? { padding: 0, paddingRight: 0 } : undefined}>
          <Box as="span" grow="Yes" alignItems="Center" justifyContent="Center" gap="200">
            <Avatar size="200" radii="400">
              <Icon src={Icons.Mail} size="100" filled={invitesSelected} />
            </Avatar>
            {!hideText && (
              <Box as="span" grow="Yes">
                <Text as="span" size="Inherit" truncate>
                  Invites
                </Text>
              </Box>
            )}
            {inviteCount > 0 && <UnreadBadge highlight count={inviteCount} />}
          </Box>
        </NavItemContent>
      </NavLink>
    </NavItem>
  );
}

export function Inbox() {
  useNavToActivePathMapper('inbox');
  const notificationsSelected = useInboxNotificationsSelected();

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
        <PageNavHeader hideText={hideText}>
          {!hideText ? (
            <Box grow="Yes" gap="300">
              <Box grow="Yes">
                <Text size="H4" truncate>
                  Inbox
                </Text>
              </Box>
            </Box>
          ) : (
            <Icon src={Icons.Inbox} size="200" />
          )}
        </PageNavHeader>

        <PageNavContent>
          <Box direction="Column" gap="300">
            <NavCategory>
              <NavItem variant="Background" radii="400" aria-selected={notificationsSelected}>
                <NavLink to={getInboxNotificationsPath()}>
                  <NavItemContent style={hideText ? { padding: 0, paddingRight: 0 } : undefined}>
                    <Box as="span" grow="Yes" alignItems="Center" justifyContent="Center" gap="200">
                      <Avatar size="200" radii="400">
                        <Icon src={Icons.MessageUnread} size="100" filled={notificationsSelected} />
                      </Avatar>
                      {!hideText && (
                        <Box as="span" grow="Yes">
                          <Text as="span" size="Inherit" truncate>
                            Notifications
                          </Text>
                        </Box>
                      )}
                    </Box>
                  </NavItemContent>
                </NavLink>
              </NavItem>
              <InvitesNavItem hideText={hideText} />
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
