import React from 'react';
import { Line } from 'fork-of-folds';
import * as css from './styles.css';

export function StatusDivider() {
  return (
    <Line variant="Background" size="300" direction="Vertical" className={css.ControlDivider} />
  );
}
