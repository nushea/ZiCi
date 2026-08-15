import React, { ReactNode } from 'react';
import { as } from 'fork-of-folds';
import classNames from 'classnames';
import * as css from './styles.css';

type NavCategoryProps = {
  children: ReactNode;
};
export const NavCategory = as<'div', NavCategoryProps>(({ className, ...props }, ref) => (
  <div className={classNames(css.NavCategory, className)} {...props} ref={ref} />
));
