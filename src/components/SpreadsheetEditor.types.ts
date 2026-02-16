import type { ReactNode } from 'react';

export interface CellBorder {
  top?: boolean;
  right?: boolean;
  bottom?: boolean;
  left?: boolean;
}

export type BorderMode = 'all' | 'outer' | 'top' | 'bottom' | 'left' | 'right' | 'none';
export type HorizontalAlign = 'left' | 'center' | 'right';
export type VerticalAlign = 'top' | 'middle' | 'bottom';

export interface Cell {
  id: string;
  value: string;
  richTextHtml?: string;
  rowSpan?: number;
  colSpan?: number;
  isMerged?: boolean;
  mergedFrom?: { row: number; col: number };
  background?: string;
  border?: CellBorder;
  horizontalAlign?: HorizontalAlign;
  verticalAlign?: VerticalAlign;
  fontFamily?: string;
  fontSize?: string;
  fontColor?: string;
  fontBackground?: string;
  bold?: boolean;
  italic?: boolean;
  strikeThrough?: boolean;
  elements?: Array<{
    id: string;
    type: string;
    label: string;
    primaryKey: string;
    name: string;
    customId: string;
    placeholder?: string;
  }>;
}

export interface CellPosition {
  row: number;
  col: number;
}

export interface Selection {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}

export interface InspectedElement {
  row: number;
  col: number;
  elementId: string;
  type: string;
  label: string;
  primaryKey: string;
  name: string;
  customId: string;
  placeholder?: string;
}

export interface HeaderContextMenuState {
  x: number;
  y: number;
  type: 'row' | 'col';
  index: number;
}

export interface LnbGroup {
  title: string;
  items: Array<{
    id: string;
    icon: ReactNode;
    label: string;
    action?: () => void;
  }>;
}

export interface RnbOpenSections {
  propertiesMain: boolean;
  events: boolean;
  action: boolean;
  identification: boolean;
}

