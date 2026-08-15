import React, { useState } from 'react';
import { Box, color, config, Icon, Icons, Scroll, toRem, Text } from 'fork-of-folds';
import {
  Page,
  PageContent,
  PageContentCenter,
  PageHero,
  PageHeroSection,
  PageNav,
  PageNavHeader,
} from '../../../components/page';
import { CreateSpaceForm } from '../../../features/create-space';
import { useRoomNavigate } from '../../../hooks/useRoomNavigate';
import { SidebarResizer } from '../sidebar/SidebarResizer';
import { settingsAtom } from '../../../state/settings';
import { useSetting } from '../../../state/hooks/settings';
import { ScreenSize, useScreenSizeContext } from '../../../hooks/useScreenSize';

export function Create() {
  const { navigateSpace } = useRoomNavigate();

  const [roomSidebarWidth, setRoomSidebarWidth] = useSetting(settingsAtom, 'leftSidebarWidth');
  const [curWidth, setCurWidth] = useState(roomSidebarWidth);

  const screenSize = useScreenSizeContext();
  const isMobile = screenSize === ScreenSize.Mobile;
  const hideText = curWidth <= 80 && !isMobile;

  return (
    <>
      {!isMobile && (
        <Box
          shrink="No"
          style={{
            position: 'relative',
            width: toRem(curWidth),
            borderRight: 'solid',
            borderColor: color.SurfaceVariant.ContainerLine,
            borderWidth: `0 ${config.borderWidth.B300} 0 0`,
            background: color.Background.Container,
          }}
        >
          <PageNav>
            <PageNavHeader style={{ width: '100%', flexShrink: 'Yes', flexGrow: 'Yes' }}>
              <Box grow="Yes" shrink="Yes" gap="300" justifyContent="Center">
                {!hideText ? (
                  <Box grow="Yes">
                    <Text size="H4" truncate align="Center">
                      Create Space
                    </Text>
                  </Box>
                ) : (
                  <Icon size="100" src={Icons.SpacePlus} />
                )}
              </Box>
            </PageNavHeader>
            <SidebarResizer
              setCurWidth={setCurWidth}
              sidebarWidth={roomSidebarWidth}
              setSidebarWidth={setRoomSidebarWidth}
              instep={50}
              outstep={190}
              minValue={50}
              maxValue={500}
            />
          </PageNav>
        </Box>
      )}
      <Page>
        <Box grow="Yes">
          <Scroll hideTrack visibility="Hover">
            <PageContent>
              <PageContentCenter>
                <PageHeroSection>
                  <Box direction="Column" gap="700">
                    <PageHero
                      icon={<Icon size="600" src={Icons.Space} />}
                      title="Create Space"
                      subTitle="Build a space for your community."
                    />
                    <CreateSpaceForm onCreate={navigateSpace} />
                  </Box>
                </PageHeroSection>
              </PageContentCenter>
            </PageContent>
          </Scroll>
        </Box>
      </Page>
    </>
  );
}
