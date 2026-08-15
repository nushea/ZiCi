import React, { useState } from 'react';
import { Text } from 'fork-of-folds';
import { SidebarItem, SidebarItemTooltip, SidebarAvatar } from '../../../components/sidebar';
import { UserAvatar } from '../../../components/user-avatar';
import { useMatrixClient } from '../../../hooks/useMatrixClient';
import { nameInitials } from '../../../utils/common';
import { Settings } from '../../../features/settings';
import { useUserProfile } from '../../../hooks/useUserProfile';
import { Modal500 } from '../../../components/Modal500';

export function SettingsTab() {
  const mx = useMatrixClient();
  const userId = mx.getUserId()!;
  const user = useUserProfile({ userId });

  const [settings, setSettings] = useState(false);

  const { displayName, avatarUrl } = user.profile;

  const openSettings = () => setSettings(true);
  const closeSettings = () => setSettings(false);
  console.log(avatarUrl);
  return (
    <SidebarItem active={settings}>
      <SidebarItemTooltip tooltip="User Settings">
        {(triggerRef) => (
          <SidebarAvatar as="button" ref={triggerRef} onClick={openSettings}>
            <UserAvatar
              userId={userId}
              src={avatarUrl}
              renderFallback={() => <Text size="H4">{nameInitials(displayName)}</Text>}
            />
          </SidebarAvatar>
        )}
      </SidebarItemTooltip>
      {settings && (
        <Modal500 requestClose={closeSettings}>
          <Settings requestClose={closeSettings} />
        </Modal500>
      )}
    </SidebarItem>
  );
}
