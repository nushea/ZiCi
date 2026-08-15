import { style } from '@vanilla-extract/css';
import { DefaultReset } from 'fork-of-folds';

export const VirtualTile = style([
  DefaultReset,
  {
    position: 'absolute',
    width: '100%',
    left: 0,
  },
]);
