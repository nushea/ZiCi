import { style } from '@vanilla-extract/css';
import { config } from 'fork-of-folds';

export const Header = style({
  borderBottomColor: 'transparent',
});
export const HeaderTopic = style({
  ':hover': {
    cursor: 'pointer',
    opacity: config.opacity.P500,
    textDecoration: 'underline',
  },
});
