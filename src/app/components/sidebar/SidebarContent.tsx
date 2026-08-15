import React, { ReactNode } from 'react';
import { Box } from 'fork-of-folds';

type SidebarContentProps = {
  scrollable: ReactNode;
  sticky: ReactNode;
};
export function SidebarContent({ scrollable, sticky }: SidebarContentProps) {
  return (
    <>
      <Box direction="Column" grow="Yes">
        {scrollable}
      </Box>
      <Box direction="Column" shrink="No">
        {sticky}
      </Box>
    </>
  );
}
