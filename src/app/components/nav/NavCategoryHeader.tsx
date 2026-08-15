import React, { ReactNode } from 'react';
import classNames from 'classnames';
import { Header, as } from 'fork-of-folds';
import * as css from './styles.css';

export type NavCategoryHeaderProps = {
  children: ReactNode;
};
export const NavCategoryHeader = as<'div', NavCategoryHeaderProps & css.NavCategoryHeaderVariants>(
  ({ className, hideText, ...props }, ref) => (
    <Header
      className={classNames(css.NavCategoryHeader(hideText), className)}
      variant="Background"
      size="300"
      {...props}
      ref={ref}
    />
  )
);
