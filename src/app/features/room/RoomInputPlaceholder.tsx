import React, { ComponentProps } from 'react';
import { Box, as } from 'fork-of-folds';
import classNames from 'classnames';

import * as css from './RoomInputPlaceholder.css';

export const RoomInputPlaceholder = as<'div', ComponentProps<typeof Box>>(
  ({ className, ...props }, ref) => (
    <Box className={classNames(css.RoomInputPlaceholder, className)} {...props} ref={ref} />
  )
);
