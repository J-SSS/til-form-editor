import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import Header from './layout/Header';
import LayoutIndex from './layout';
import LNB from './layout/LNB';
import Main from './layout/Main';
import RNB from './layout/RNB';
import SheetPreview from './layout/SheetPreview';
import { BorderMode, Cell, CellPosition, HeaderContextMenuState, HorizontalAlign, InspectedElement, LnbGroup, Selection, VerticalAlign } from './SpreadsheetEditor.types';
import { createLnbCustomGroups, createLnbSelectGroups, lnbAutoGroups } from './config/lnbGroups';
import './SpreadsheetEditor.css';

const GRID_CELL_WIDTH = 1024;
const HEADER_SIDE_WIDTH = 50;
const DEFAULT_ROW_HEIGHT = 25;
const INITIAL_ROWS = 3;
const INITIAL_COLS = 3;
const MIN_COL_WIDTH = 50;
const ELEMENT_TOKEN_TEXT_REGEX = /\[\[[^[\]]+\]\]/g;

const stripElementTokens = (value: string) => value.replace(ELEMENT_TOKEN_TEXT_REGEX, '').trim();
const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
const plainTextToHtml = (value: string) => escapeHtml(value).replace(/\n/g, '<br />');
const htmlToPlainText = (value: string) =>
  value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

const toElementHtml = (el: NonNullable<Cell['elements']>[number]) => {
  const displayLabel = escapeHtml(el.label || el.name || '');
  const placeholderText = escapeHtml(el.placeholder || '');
  const placeholderAttr = placeholderText ? ` placeholder="${placeholderText}"` : '';
  let control = `<span class="cell-native-label">${escapeHtml(el.type)}</span>`;
  if (el.type === 'text') control = `<input class="cell-native-control" type="text"${placeholderAttr} readonly tabindex="-1" />`;
  else if (el.type === 'textarea') control = `<textarea class="cell-native-control" readonly tabindex="-1"${placeholderAttr}></textarea>`;
  else if (el.type === 'number') control = `<input class="cell-native-control" type="number"${placeholderAttr} readonly tabindex="-1" />`;
  else if (el.type === 'select') control = `<select class="cell-native-control" disabled tabindex="-1"><option>${displayLabel || '선택'}</option></select>`;
  else if (el.type === 'checkbox') control = `<label class="cell-native-check"><input type="checkbox" disabled tabindex="-1" /><span>${displayLabel || '체크 박스'}</span></label>`;
  else if (el.type === 'radio') control = `<label class="cell-native-check"><input type="radio" disabled tabindex="-1" /><span>${displayLabel || '라디오 버튼'}</span></label>`;
  else if (el.type === 'label') control = `<span class="cell-native-label">${displayLabel || '라벨'}</span>`;
  else if (el.type === 'url') control = `<a class="cell-native-link" href="#" tabindex="-1">${displayLabel || 'URL'}</a>`;
  else if (el.type === 'image') control = `<span class="cell-native-image">이미지</span>`;
  else if (el.type === 'button' || el.type === 'repeat-button') control = `<button type="button" class="cell-native-control" disabled tabindex="-1">${displayLabel || '버튼'}</button>`;
  else if (el.type === 'user-select' || el.type === 'department-select') control = `<select class="cell-native-control" disabled tabindex="-1"><option>${displayLabel || '선택'}</option></select>`;
  else if (el.type === 'file-upload') control = `<span class="cell-native-label">${displayLabel || '파일 업로드'}</span>`;
  else if (el.type === 'repeat-list-number') control = `<span class="cell-native-label">1.</span>`;
  return `<span class="cell-element-node" contenteditable="false" data-element-id="${el.id}" data-element-label="${escapeHtml(el.label)}">${control}</span>`;
};

const buildDefaultRichTextHtml = (cell: Cell) => {
  const safeText = plainTextToHtml(stripElementTokens(cell.value || ''));
  const elementHtml = (cell.elements || [])
    .map((el) => toElementHtml(el))
    .join(' ');
  if (safeText && elementHtml) return `${safeText} ${elementHtml}`;
  return safeText || elementHtml || '';
};

const parseRichEditorPayload = (html: string, elements: NonNullable<Cell['elements']>) => {
  const container = document.createElement('div');
  container.innerHTML = html || '';

  const ids: string[] = [];
  container.querySelectorAll<HTMLElement>('[data-element-id]').forEach((node) => {
    const id = node.dataset.elementId;
    if (id) ids.push(id);
  });

  const byId = new Map(elements.map((el) => [el.id, el]));
  const nextElements: NonNullable<Cell['elements']> = [];
  ids.forEach((id) => {
    const found = byId.get(id);
    if (found) nextElements.push(found);
  });

  const textOnly = container.cloneNode(true) as HTMLElement;
  textOnly.querySelectorAll('[data-element-id]').forEach((node) => node.remove());
  const plain = stripElementTokens(htmlToPlainText(textOnly.innerHTML || textOnly.textContent || ''));

  return { plain, html: container.innerHTML, elements: nextElements };
};

const syncElementNodesInHtml = (html: string, elements: NonNullable<Cell['elements']>) => {
  const container = document.createElement('div');
  container.innerHTML = html || '';
  const byId = new Map(elements.map((el) => [el.id, el]));
  container.querySelectorAll<HTMLElement>('[data-element-id]').forEach((node) => {
    const id = node.dataset.elementId;
    if (!id) return;
    const element = byId.get(id);
    if (!element) {
      node.remove();
      return;
    }
    const wrapper = document.createElement('div');
    wrapper.innerHTML = toElementHtml(element);
    const next = wrapper.firstElementChild;
    if (next) node.replaceWith(next);
  });
  return container.innerHTML;
};

// 열 개수에 맞춰 전체 1024px를 균등 분배합니다.
const computeDistributedWidths = (count: number) => {
  const safe = Math.max(1, count);
  const base = Math.floor(GRID_CELL_WIDTH / safe);
  const rem = GRID_CELL_WIDTH % safe;
  return Array.from({ length: safe }, (_, i) => base + (i < rem ? 1 : 0));
};

// 엘리먼트 기본값에 붙일 현재 시각 토큰(YYYYMMDDHHmmss)을 생성합니다.
const formatCurrentTimeToken = () => {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
};

type LnbTabKey = '기본 설정' | '자동 입력' | '선택 입력' | '커스텀 항목';
type MainSheet = {
  id: string;
  label: string;
  cells: Cell[][];
  rowHeights: number[];
  colWidths: number[];
  selection: Selection;
  focusedCell: CellPosition;
};

const createEmptyCells = (rows: number, cols: number): Cell[][] =>
  Array.from({ length: rows }, (_, row) =>
    Array.from({ length: cols }, (_, col) => ({
      id: `${row}-${col}`,
      value: '',
      rowSpan: 1,
      colSpan: 1,
      isMerged: false,
      background: undefined,
      richTextHtml: '',
      elements: [],
    }))
  );

const SpreadsheetEditor: React.FC = () => {
  // 시트 편집 상태: 셀 데이터와 레이아웃(행 높이/열 너비), 선택/편집 상태를 관리합니다.
  const initialSheetId = 'sheet-1';
  const [sheets, setSheets] = useState<MainSheet[]>([
    {
      id: initialSheetId,
      label: '본문',
      cells: createEmptyCells(INITIAL_ROWS, INITIAL_COLS),
      rowHeights: Array(INITIAL_ROWS).fill(DEFAULT_ROW_HEIGHT),
      colWidths: computeDistributedWidths(INITIAL_COLS),
      selection: { startRow: 0, startCol: 0, endRow: 0, endCol: 0 },
      focusedCell: { row: 0, col: 0 },
    },
  ]);
  const [activeMainTab, setActiveMainTab] = useState<string>(initialSheetId);
  const [cells, setCells] = useState<Cell[][]>(sheets[0].cells);

  const [rowHeights, setRowHeights] = useState<number[]>(sheets[0].rowHeights);
  const [colWidths, setColWidths] = useState<number[]>(sheets[0].colWidths);
  const [selection, setSelection] = useState<Selection>({ startRow: 0, startCol: 0, endRow: 0, endCol: 0 });
  const [isSelecting, setIsSelecting] = useState(false);
  const [editingCell, setEditingCell] = useState<CellPosition | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [focusedCell, setFocusedCell] = useState<CellPosition>(sheets[0].focusedCell);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isShortcutOpen, setIsShortcutOpen] = useState(false);
  const [isDocOpen, setIsDocOpen] = useState(false);
  const [isElementModalOpen, setIsElementModalOpen] = useState(false);
  const [isAddTabModalOpen, setIsAddTabModalOpen] = useState(false);
  const [isTabEditModalOpen, setIsTabEditModalOpen] = useState(false);
  const [isTabDeleteConfirmOpen, setIsTabDeleteConfirmOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [mainTabLabelDraft, setMainTabLabelDraft] = useState('본문');
  const [draggingMainTabId, setDraggingMainTabId] = useState<string | null>(null);
  const [dragOverMainTabId, setDragOverMainTabId] = useState<string | null>(null);
  const [colorMenu, setColorMenu] = useState<{ x: number; y: number } | null>(null);
  const [headerContextMenu, setHeaderContextMenu] = useState<HeaderContextMenuState | null>(null);
  const [inspectedElement, setInspectedElement] = useState<InspectedElement | null>(null);
  const [lnbTab, setLnbTab] = useState<LnbTabKey>('기본 설정');
  const [rnbOpenSections, setRnbOpenSections] = useState({
    propertiesMain: true,
    events: true,
    action: true,
    identification: true,
  });

  // 리사이즈/컨텍스트 메뉴/외부 클릭 처리에 사용할 DOM 참조입니다.
  const tableRef = useRef<HTMLTableElement>(null);
  const colorMenuRef = useRef<HTMLDivElement>(null);
  const headerContextMenuRef = useRef<HTMLDivElement>(null);
  const resizeStartY = useRef(0);
  const resizeStartHeight = useRef(0);
  const resizeStartX = useRef(0);
  const resizeStartWidth = useRef(0);
  const resizeNeighborIndex = useRef<number | null>(null);
  const resizeNeighborStartWidth = useRef(0);
  const isResizingRow = useRef<number | null>(null);
  const isResizingCol = useRef<number | null>(null);
  const isHydratingSheet = useRef(false);
  const prevActiveMainTab = useRef(activeMainTab);

  useEffect(() => {
    if (prevActiveMainTab.current === activeMainTab) return;
    const activeSheet = sheets.find((sheet) => sheet.id === activeMainTab);
    if (!activeSheet) return;
    prevActiveMainTab.current = activeMainTab;
    isHydratingSheet.current = true;
    setCells(activeSheet.cells);
    setRowHeights(activeSheet.rowHeights);
    setColWidths(activeSheet.colWidths);
    setSelection(activeSheet.selection);
    setFocusedCell(activeSheet.focusedCell);
    setEditingCell(null);
    setEditingValue('');
    setInspectedElement(null);
    queueMicrotask(() => {
      isHydratingSheet.current = false;
    });
  }, [activeMainTab, sheets]);

  useEffect(() => {
    if (isHydratingSheet.current) return;
    setSheets((prev) =>
      prev.map((sheet) =>
        sheet.id === activeMainTab
          ? {
              ...sheet,
              cells,
              rowHeights,
              colWidths,
              selection,
              focusedCell,
            }
          : sheet
      )
    );
  }, [activeMainTab, cells, rowHeights, colWidths, selection, focusedCell]);

  const rowCount = cells.length;
  const colCount = cells[0]?.length || 0;
  const totalColWidth = colWidths.reduce((sum, w) => sum + w, 0);
  const gridWidth = HEADER_SIDE_WIDTH + totalColWidth;
  const rulerMarks = Array.from({ length: 21 }, (_, i) => i * 5);
  const hasRnbChanges = useMemo(() => {
    if (!inspectedElement) return false;
    const origin = cells[inspectedElement.row]?.[inspectedElement.col]?.elements?.find(
      (el) => el.id === inspectedElement.elementId
    );
    if (!origin) return false;
    return (
      (origin.label || '') !== inspectedElement.label ||
      (origin.primaryKey || '') !== inspectedElement.primaryKey ||
      (origin.name || '') !== inspectedElement.name ||
      (origin.customId || '') !== inspectedElement.customId ||
      (origin.placeholder || '') !== (inspectedElement.placeholder || '')
    );
  }, [cells, inspectedElement]);
  const colorPalette: string[][] = [
    ['#ffffff', '#f28b82', '#fbbc04', '#fff475', '#ccff90', '#a7ffeb', '#cbf0f8', '#aecbfa', '#d7aefb', '#fdcfe8'],
    ['#e6eaed', '#e57373', '#f7b633', '#fdd663', '#d0f0a0', '#99e1d9', '#a2d2ff', '#90caf9', '#cba4f9', '#f3c4fb'],
    ['#cfd8dc', '#c62828', '#ef6c00', '#f9a825', '#7cb342', '#00acc1', '#039be5', '#3949ab', '#8e24aa', '#d81b60'],
  ];

  const handleMainTabDrop = useCallback((targetTabId: string, sourceTabId?: string) => {
    const draggingId = sourceTabId || draggingMainTabId;
    if (!draggingId || draggingId === targetTabId) {
      setDragOverMainTabId(null);
      return;
    }
    setSheets((prev) => {
      const fromIndex = prev.findIndex((sheet) => sheet.id === draggingId);
      const toIndex = prev.findIndex((sheet) => sheet.id === targetTabId);
      if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return prev;
      const next = [...prev];
      const [dragged] = next.splice(fromIndex, 1);
      const insertIndex = toIndex;
      next.splice(insertIndex, 0, dragged);
      return next;
    });
    setDragOverMainTabId(null);
  }, [draggingMainTabId]);

  // 브라우저 기본 컨텍스트 메뉴를 막아 편집기 UX를 유지합니다.
  const suppressContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  // 단일 셀의 텍스트 값을 갱신합니다.
  const updateCellValue = useCallback((row: number, col: number, value: string) => {
    setCells(prev => {
      const next = prev.map(r => r.map(c => ({ ...c })));
      next[row][col].value = value;
      return next;
    });
  }, []);

  // 행을 n개 추가하고 행 높이 상태도 함께 확장합니다.
  const handleAddRows = useCallback((count: number) => {
    setCells(prev => {
      const cols = prev[0]?.length || 0;
      const next = [...prev];
      for (let i = 0; i < count; i++) {
        const rowIndex = prev.length + i;
        next.push(
          Array.from({ length: cols }, (_, col) => ({
            id: `${rowIndex}-${col}`,
            value: '',
            rowSpan: 1,
            colSpan: 1,
            isMerged: false,
            background: undefined,
            richTextHtml: '',
            elements: [],
          }))
        );
      }
      return next;
    });
    setRowHeights(prev => [...prev, ...Array(count).fill(DEFAULT_ROW_HEIGHT)]);
  }, []);

  // 열을 n개 추가하고 1024px 기준으로 전체 열 너비를 재분배합니다.
  const handleAddCols = useCallback((count: number) => {
    setCells(prev =>
      prev.map((row, rowIdx) => {
        const additions = Array.from({ length: count }, (_, addIdx) => ({
          id: `${rowIdx}-${row.length + addIdx}`,
          value: '',
          rowSpan: 1,
          colSpan: 1,
          isMerged: false,
          background: undefined,
          richTextHtml: '',
          elements: [],
        }));
        return [...row, ...additions];
      })
    );
    setColWidths(prev => computeDistributedWidths(prev.length + count));
  }, []);

  // 행 1개 추가 액션입니다.
  const handleAddRow = useCallback(() => handleAddRows(1), [handleAddRows]);
  // 열 1개 추가 액션입니다.
  const handleAddCol = useCallback(() => handleAddCols(1), [handleAddCols]);
  // 현재 포커스된 행 1개 삭제 액션입니다.
  const handleDeleteRow = useCallback(() => {
    if (rowCount <= 1) return;
    const targetRow = Math.max(0, Math.min(focusedCell.row, rowCount - 1));
    setCells((prev) => {
      const nextRows: Cell[][] = [];
      for (let oldRow = 0; oldRow < prev.length; oldRow++) {
        if (oldRow === targetRow) continue;
        const nextRow = prev[oldRow].map((cell, oldCol) => {
          let nextCell: Cell = { ...cell };
          if (nextCell.mergedFrom) {
            if (nextCell.mergedFrom.row === targetRow) {
              nextCell = { ...nextCell, isMerged: false, mergedFrom: undefined, rowSpan: 1, colSpan: 1 };
            } else if (nextCell.mergedFrom.row > targetRow) {
              nextCell = {
                ...nextCell,
                mergedFrom: { ...nextCell.mergedFrom, row: nextCell.mergedFrom.row - 1 },
              };
            }
          }
          if (!nextCell.isMerged && (nextCell.rowSpan || 1) > 1) {
            const spanStart = oldRow;
            const spanEnd = oldRow + (nextCell.rowSpan || 1) - 1;
            if (spanStart < targetRow && spanEnd >= targetRow) {
              nextCell = { ...nextCell, rowSpan: Math.max(1, (nextCell.rowSpan || 1) - 1) };
            }
          }
          return { ...nextCell, id: `${nextRows.length}-${oldCol}` };
        });
        nextRows.push(nextRow);
      }
      return nextRows;
    });
    setRowHeights((prev) => prev.filter((_, idx) => idx !== targetRow));
    const nextRow = Math.max(0, Math.min(targetRow, rowCount - 2));
    setFocusedCell((prev) => ({ ...prev, row: nextRow }));
    setSelection({ startRow: nextRow, startCol: focusedCell.col, endRow: nextRow, endCol: focusedCell.col });
    setEditingCell(null);
    setInspectedElement((prev) => {
      if (!prev) return prev;
      if (prev.row === targetRow) return null;
      if (prev.row > targetRow) return { ...prev, row: prev.row - 1 };
      return prev;
    });
  }, [focusedCell.col, focusedCell.row, rowCount]);

  // 현재 포커스된 열 1개 삭제 액션입니다.
  const handleDeleteCol = useCallback(() => {
    if (colCount <= 1) return;
    const targetCol = Math.max(0, Math.min(focusedCell.col, colCount - 1));
    setCells((prev) =>
      prev.map((row, oldRow) => {
        const nextRow: Cell[] = [];
        for (let oldCol = 0; oldCol < row.length; oldCol++) {
          if (oldCol === targetCol) continue;
          let nextCell: Cell = { ...row[oldCol] };
          if (nextCell.mergedFrom) {
            if (nextCell.mergedFrom.col === targetCol) {
              nextCell = { ...nextCell, isMerged: false, mergedFrom: undefined, rowSpan: 1, colSpan: 1 };
            } else if (nextCell.mergedFrom.col > targetCol) {
              nextCell = {
                ...nextCell,
                mergedFrom: { ...nextCell.mergedFrom, col: nextCell.mergedFrom.col - 1 },
              };
            }
          }
          if (!nextCell.isMerged && (nextCell.colSpan || 1) > 1) {
            const spanStart = oldCol;
            const spanEnd = oldCol + (nextCell.colSpan || 1) - 1;
            if (spanStart < targetCol && spanEnd >= targetCol) {
              nextCell = { ...nextCell, colSpan: Math.max(1, (nextCell.colSpan || 1) - 1) };
            }
          }
          nextRow.push({ ...nextCell, id: `${oldRow}-${nextRow.length}` });
        }
        return nextRow;
      })
    );
    setColWidths((prev) => computeDistributedWidths(prev.length - 1));
    const nextCol = Math.max(0, Math.min(targetCol, colCount - 2));
    setFocusedCell((prev) => ({ ...prev, col: nextCol }));
    setSelection({ startRow: focusedCell.row, startCol: nextCol, endRow: focusedCell.row, endCol: nextCol });
    setEditingCell(null);
    setInspectedElement((prev) => {
      if (!prev) return prev;
      if (prev.col === targetCol) return null;
      if (prev.col > targetCol) return { ...prev, col: prev.col - 1 };
      return prev;
    });
  }, [colCount, focusedCell.col, focusedCell.row]);

  // 행 리사이즈 시작: 기준 마우스 위치/높이를 저장하고 전역 move/up 리스너를 등록합니다.
  const handleRowResizeStart = useCallback((e: React.MouseEvent, rowIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    resizeStartY.current = e.clientY;
    resizeStartHeight.current = rowHeights[rowIndex];
    isResizingRow.current = rowIndex;
    document.addEventListener('mousemove', handleRowResize);
    document.addEventListener('mouseup', handleRowResizeEnd);
  }, [rowHeights]);

  // 행 리사이즈 중: 마우스 이동량을 실제 행 높이 변경으로 반영합니다.
  const handleRowResize = useCallback((e: MouseEvent) => {
    if (isResizingRow.current === null) return;
    const deltaY = e.clientY - resizeStartY.current;
    const newHeight = Math.max(20, resizeStartHeight.current + deltaY);
    setRowHeights(prev => {
      const next = [...prev];
      next[isResizingRow.current!] = newHeight;
      return next;
    });
  }, []);

  // 행 리사이즈 종료: 전역 리스너를 해제합니다.
  const handleRowResizeEnd = useCallback(() => {
    isResizingRow.current = null;
    document.removeEventListener('mousemove', handleRowResize);
    document.removeEventListener('mouseup', handleRowResizeEnd);
  }, [handleRowResize]);

  // 열 리사이즈 시작: 기준 너비와 이웃 열 정보를 계산해 총합 너비 고정을 준비합니다.
  const handleColResizeStart = useCallback((e: React.MouseEvent, colIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    resizeStartX.current = e.clientX;
    resizeStartWidth.current = colWidths[colIndex];
    isResizingCol.current = colIndex;
    const neighbor = colIndex < colWidths.length - 1 ? colIndex + 1 : colIndex > 0 ? colIndex - 1 : null;
    resizeNeighborIndex.current = neighbor;
    resizeNeighborStartWidth.current = neighbor !== null ? colWidths[neighbor] : 0;
    document.addEventListener('mousemove', handleColResize);
    document.addEventListener('mouseup', handleColResizeEnd);
  }, [colWidths]);

  // 열 리사이즈 중: 현재 열/이웃 열 너비를 동시에 조정해 총합 너비를 유지합니다.
  const handleColResize = useCallback((e: MouseEvent) => {
    if (isResizingCol.current === null) return;
    const deltaX = e.clientX - resizeStartX.current;
    let newWidth = Math.max(MIN_COL_WIDTH, resizeStartWidth.current + deltaX);
    const neighborIndex = resizeNeighborIndex.current;
    if (neighborIndex !== null) {
      let neighborWidth = resizeNeighborStartWidth.current - (newWidth - resizeStartWidth.current);
      if (neighborWidth < MIN_COL_WIDTH) {
        neighborWidth = MIN_COL_WIDTH;
        newWidth = resizeStartWidth.current + (resizeNeighborStartWidth.current - MIN_COL_WIDTH);
      }
      setColWidths(prev => {
        const next = [...prev];
        next[isResizingCol.current!] = newWidth;
        next[neighborIndex] = neighborWidth;
        return next;
      });
    } else {
      // 열이 하나뿐이면 전체 너비를 고정합니다.
      setColWidths([GRID_CELL_WIDTH]);
    }
  }, []);

  // 열 리사이즈 종료: 전역 리스너와 임시 참조를 정리합니다.
  const handleColResizeEnd = useCallback(() => {
    isResizingCol.current = null;
    resizeNeighborIndex.current = null;
    document.removeEventListener('mousemove', handleColResize);
    document.removeEventListener('mouseup', handleColResizeEnd);
  }, [handleColResize]);

  // 병합 셀 좌표를 실제 기준 셀 좌표로 정규화합니다.
  const getActualCell = useCallback((row: number, col: number): CellPosition => {
    const cell = cells[row]?.[col];
    if (cell?.mergedFrom) return cell.mergedFrom;
    return { row, col };
  }, [cells]);

  // 셀 드래그 선택 시작 지점을 설정합니다.
  const handleCellMouseDown = useCallback((e: React.MouseEvent, row: number, col: number) => {
    e.preventDefault();
    const actual = getActualCell(row, col);
    setIsSelecting(true);
    setSelection({ startRow: actual.row, startCol: actual.col, endRow: actual.row, endCol: actual.col });
    setFocusedCell(actual);
  }, [getActualCell]);

  // 드래그 중 마우스 위치에 따라 선택 범위를 확장합니다.
  const handleCellMouseEnter = useCallback((row: number, col: number) => {
    if (!isSelecting) return;
    const actual = getActualCell(row, col);
    setSelection(prev => ({ ...prev, endRow: actual.row, endCol: actual.col }));
  }, [isSelecting, getActualCell]);

  // 마우스 업 시 드래그 선택 모드를 종료합니다.
  useEffect(() => {
    const up = () => setIsSelecting(false);
    document.addEventListener('mouseup', up);
    return () => document.removeEventListener('mouseup', up);
  }, []);

  // 편집 필드 외 영역에서는 드래그/텍스트 선택을 차단합니다.
  useEffect(() => {
    const isEditableTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      return !!target.closest('input, textarea, [contenteditable="true"]');
    };

    const preventDrag = (e: Event) => {
      if (isEditableTarget(e.target)) return;
      e.preventDefault();
    };

    document.addEventListener('dragstart', preventDrag);
    document.addEventListener('dragenter', preventDrag);
    document.addEventListener('dragover', preventDrag);
    document.addEventListener('drop', preventDrag);
    document.addEventListener('selectstart', preventDrag);
    return () => {
      document.removeEventListener('dragstart', preventDrag);
      document.removeEventListener('dragenter', preventDrag);
      document.removeEventListener('dragover', preventDrag);
      document.removeEventListener('drop', preventDrag);
      document.removeEventListener('selectstart', preventDrag);
    };
  }, []);

  /**
   * 더블 클릭으로 셀 편집 모드 전환
   */
  const handleCellDoubleClick = useCallback((row: number, col: number) => {
    const actual = getActualCell(row, col);
    const target = cells[actual.row][actual.col];
    // debugger
    setEditingCell(actual);
    setEditingValue(target.richTextHtml || buildDefaultRichTextHtml(target));
  }, [cells, getActualCell]);

  // 셀 클릭 시 포커스/선택을 맞추고 RNB 선택 상태를 해제합니다.
  const handleCellClick = useCallback((row: number, col: number) => {
    const actual = getActualCell(row, col);
    setFocusedCell(actual);
    setSelection({ startRow: actual.row, startCol: actual.col, endRow: actual.row, endCol: actual.col });
    setInspectedElement(null);
  }, [getActualCell]);

  // 현재 편집 내용을 파싱해 저장하고 편집 모드를 종료합니다.
  const handleCellEditComplete = useCallback(() => {
    if (editingCell) {
      const cell = cells[editingCell.row]?.[editingCell.col];
      if (!cell) {
        setEditingCell(null);
        return;
      }
      const parsed = parseRichEditorPayload(editingValue, cell.elements || []);
      setCells(prev =>
        prev.map((row, rIdx) =>
          row.map((cell, cIdx) => {
            if (rIdx !== editingCell.row || cIdx !== editingCell.col) return cell;
            return { ...cell, value: parsed.plain, richTextHtml: parsed.html, elements: parsed.elements };
          })
        )
      );
      setEditingCell(null);
    }
  }, [cells, editingCell, editingValue]);

  const handleCommitEditing = useCallback((row: number, col: number, value: string) => {
    const current = cells[row]?.[col];
    if (!current) return;
    const parsed = parseRichEditorPayload(value, current.elements || []);
    setCells(prev =>
      prev.map((rowCells, rIdx) =>
        rowCells.map((cell, cIdx) => {
          if (rIdx !== row || cIdx !== col) return cell;
          return { ...cell, value: parsed.plain, richTextHtml: parsed.html, elements: parsed.elements };
        })
      )
    );
    setEditingValue(parsed.html);
    setEditingCell(null);
  }, [cells]);

  // 현재 셀이 선택 범위에 포함되는지(병합 범위 포함) 판단합니다.
  const isCellSelected = useCallback((row: number, col: number) => {
    const minRow = Math.min(selection.startRow, selection.endRow);
    const maxRow = Math.max(selection.startRow, selection.endRow);
    const minCol = Math.min(selection.startCol, selection.endCol);
    const maxCol = Math.max(selection.startCol, selection.endCol);
    const cell = cells[row]?.[col];
    if (cell?.isMerged && !cell.mergedFrom) {
      const cellEndRow = row + (cell.rowSpan || 1) - 1;
      const cellEndCol = col + (cell.colSpan || 1) - 1;
      return !(cellEndRow < minRow || row > maxRow || cellEndCol < minCol || col > maxCol);
    }
    if (cell?.mergedFrom) return false;
    return row >= minRow && row <= maxRow && col >= minCol && col <= maxCol;
  }, [selection, cells]);

  // 현재 셀이 포커스 셀인지 확인합니다.
  const isCellFocused = useCallback((row: number, col: number) => {
    return focusedCell.row === row && focusedCell.col === col;
  }, [focusedCell]);

  // 선택 영역을 좌상단 기준 하나의 병합 셀로 만듭니다.
  const handleMergeCells = useCallback(() => {
    const minRow = Math.min(selection.startRow, selection.endRow);
    const maxRow = Math.max(selection.startRow, selection.endRow);
    const minCol = Math.min(selection.startCol, selection.endCol);
    const maxCol = Math.max(selection.startCol, selection.endCol);
    if (minRow === maxRow && minCol === maxCol) return;
    setCells(prev => {
      const next = prev.map(r => r.map(c => ({ ...c })));
      const rowSpan = maxRow - minRow + 1;
      const colSpan = maxCol - minCol + 1;
      next[minRow][minCol] = { ...next[minRow][minCol], rowSpan, colSpan, isMerged: true };
      for (let r = minRow; r <= maxRow; r++) {
        for (let c = minCol; c <= maxCol; c++) {
          if (r === minRow && c === minCol) continue;
          next[r][c] = { ...next[r][c], isMerged: true, mergedFrom: { row: minRow, col: minCol } };
        }
      }
      return next;
    });
  }, [selection]);

  // 선택 범위와 겹치는 병합 셀을 찾아 병합 영역 전체를 해제합니다.
  const handleUnmergeCells = useCallback(() => {
    const minRow = Math.min(selection.startRow, selection.endRow);
    const maxRow = Math.max(selection.startRow, selection.endRow);
    const minCol = Math.min(selection.startCol, selection.endCol);
    const maxCol = Math.max(selection.startCol, selection.endCol);
    setCells(prev => {
      const next = prev.map(r => r.map(c => ({ ...c })));
      const anchorKeys = new Set<string>();

      for (let r = minRow; r <= maxRow; r++) {
        for (let c = minCol; c <= maxCol; c++) {
          const cell = next[r]?.[c];
          if (!cell) continue;
          const anchor = cell.mergedFrom ? cell.mergedFrom : { row: r, col: c };
          anchorKeys.add(`${anchor.row}-${anchor.col}`);
        }
      }

      anchorKeys.forEach((key) => {
        const [rowText, colText] = key.split('-');
        const anchorRow = Number(rowText);
        const anchorCol = Number(colText);
        const anchorCell = next[anchorRow]?.[anchorCol];
        if (!anchorCell?.isMerged) return;

        const rowSpan = Math.max(1, anchorCell.rowSpan || 1);
        const colSpan = Math.max(1, anchorCell.colSpan || 1);

        for (let r = anchorRow; r < anchorRow + rowSpan; r++) {
          for (let c = anchorCol; c < anchorCol + colSpan; c++) {
            if (!next[r]?.[c]) continue;
            next[r][c] = {
              ...next[r][c],
              isMerged: false,
              rowSpan: 1,
              colSpan: 1,
              mergedFrom: undefined,
            };
          }
        }
      });
      return next;
    });
  }, [selection]);

  // 화살표 방향으로 포커스와 선택 셀을 이동합니다.
  const moveSelection = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    let newRow = focusedCell.row;
    let newCol = focusedCell.col;
    if (direction === 'up') newRow = Math.max(0, newRow - 1);
    if (direction === 'down') newRow = Math.min(rowCount - 1, newRow + 1);
    if (direction === 'left') newCol = Math.max(0, newCol - 1);
    if (direction === 'right') newCol = Math.min(colCount - 1, newCol + 1);
    setFocusedCell({ row: newRow, col: newCol });
    setSelection({ startRow: newRow, startCol: newCol, endRow: newRow, endCol: newCol });
  }, [focusedCell, rowCount, colCount]);

  const extendSelection = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    setSelection((prev) => {
      let nextEndRow = prev.endRow;
      let nextEndCol = prev.endCol;
      if (direction === 'up') nextEndRow = Math.max(0, nextEndRow - 1);
      if (direction === 'down') nextEndRow = Math.min(rowCount - 1, nextEndRow + 1);
      if (direction === 'left') nextEndCol = Math.max(0, nextEndCol - 1);
      if (direction === 'right') nextEndCol = Math.min(colCount - 1, nextEndCol + 1);
      setFocusedCell({ row: nextEndRow, col: nextEndCol });
      return { ...prev, endRow: nextEndRow, endCol: nextEndCol };
    });
  }, [rowCount, colCount]);

  // 선택 범위의 값/배경/리치텍스트/엘리먼트를 초기화합니다.
  const clearSelectionContents = useCallback(() => {
    const minRow = Math.min(selection.startRow, selection.endRow);
    const maxRow = Math.max(selection.startRow, selection.endRow);
    const minCol = Math.min(selection.startCol, selection.endCol);
    const maxCol = Math.max(selection.startCol, selection.endCol);
    const anchors = new Set<string>();
    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        const actual = getActualCell(r, c);
        anchors.add(`${actual.row}-${actual.col}`);
      }
    }
    setCells(prev =>
      prev.map((row, rIdx) =>
        row.map((cell, cIdx) => {
          const key = `${rIdx}-${cIdx}`;
          if (!anchors.has(key)) return cell;
          return {
            ...cell,
            value: '',
            background: undefined,
            richTextHtml: '',
            elements: [],
          };
        })
      )
    );
    setInspectedElement(null);
  }, [selection, getActualCell]);

  // 전역 키보드 단축키(이동/편집/병합/삭제/모달 닫기)를 처리합니다.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTextControl = !!target?.closest('input, textarea, select, [contenteditable="true"]');

      if (e.key === 'Escape') {
        if (headerContextMenu) {
          e.preventDefault();
          setHeaderContextMenu(null);
          return;
        }
        if (isHelpOpen) {
          e.preventDefault();
          setIsHelpOpen(false);
          return;
        }
        if (isShortcutOpen) {
          e.preventDefault();
          setIsShortcutOpen(false);
          return;
        }
        if (isDocOpen) {
          e.preventDefault();
          setIsDocOpen(false);
          return;
        }
        if (isElementModalOpen) {
          e.preventDefault();
          setIsElementModalOpen(false);
          return;
        }
        if (isAddTabModalOpen) {
          e.preventDefault();
          setIsAddTabModalOpen(false);
          return;
        }
        if (isSettingsOpen) {
          e.preventDefault();
          setIsSettingsOpen(false);
          return;
        }
      }

      if (editingCell) {
        if (e.key === 'Escape') {
          e.preventDefault();
          setEditingCell(null);
        } else if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          const active = document.activeElement as HTMLElement | null;
          const nextHtml = active?.isContentEditable ? (active.innerHTML || '') : editingValue;
          const current = cells[editingCell.row]?.[editingCell.col];
          if (!current) {
            setEditingCell(null);
            return;
          }
          const parsed = parseRichEditorPayload(nextHtml, current.elements || []);
          setCells(prev =>
            prev.map((row, rIdx) =>
              row.map((cell, cIdx) => {
                if (rIdx !== editingCell.row || cIdx !== editingCell.col) return cell;
                return { ...cell, value: parsed.plain, richTextHtml: parsed.html, elements: parsed.elements };
              })
            )
          );
          setEditingCell(null);
          const nextCol = editingCell.col < colCount - 1 ? editingCell.col + 1 : 0;
          const nextRow = editingCell.col < colCount - 1
            ? editingCell.row
            : Math.min(rowCount - 1, editingCell.row + 1);
          setFocusedCell({ row: nextRow, col: nextCol });
          setSelection({
            startRow: nextRow,
            startCol: nextCol,
            endRow: nextRow,
            endCol: nextCol,
          });
          active?.blur();
        }
        return;
      }

      if (isTextControl) return;

      if (e.key === 'Delete') {
        e.preventDefault();
        clearSelectionContents();
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          extendSelection('up');
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          extendSelection('down');
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          extendSelection('left');
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          extendSelection('right');
        } else if (e.key === 'm') {
          e.preventDefault();
          handleMergeCells();
        } else if (e.key === 'u') {
          e.preventDefault();
          handleUnmergeCells();
        }
        return;
      }
      if (e.key === 'ArrowUp') { e.preventDefault(); moveSelection('up'); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); moveSelection('down'); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); moveSelection('left'); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); moveSelection('right'); }
      else if (e.key === 'Enter') {
        e.preventDefault();
        setEditingCell(focusedCell);
        const target = cells[focusedCell.row][focusedCell.col];
        setEditingValue(target.richTextHtml || buildDefaultRichTextHtml(target));
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        setEditingCell(focusedCell);
        setEditingValue(plainTextToHtml(e.key));
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    editingCell,
    handleCellEditComplete,
    moveSelection,
    extendSelection,
    focusedCell,
    cells,
    handleMergeCells,
    handleUnmergeCells,
    isHelpOpen,
    isShortcutOpen,
    isDocOpen,
    isElementModalOpen,
    isAddTabModalOpen,
    isSettingsOpen,
    headerContextMenu,
    clearSelectionContents,
  ]);

  // 행 헤더 클릭 시 해당 행 전체를 선택합니다.
  const handleRowHeaderClick = useCallback((rowIndex: number) => {
    setSelection({ startRow: rowIndex, startCol: 0, endRow: rowIndex, endCol: Math.max(0, colCount - 1) });
    setFocusedCell({ row: rowIndex, col: 0 });
  }, [colCount]);

  // 열 헤더 클릭 시 해당 열 전체를 선택합니다.
  const handleColHeaderClick = useCallback((colIndex: number) => {
    setSelection({ startRow: 0, startCol: colIndex, endRow: Math.max(0, rowCount - 1), endCol: colIndex });
    setFocusedCell({ row: 0, col: colIndex });
  }, [rowCount]);

  // 선택 범위 전체에 배경색을 적용합니다.
  const applyBackgroundToSelection = useCallback((color: string) => {
    const minRow = Math.min(selection.startRow, selection.endRow);
    const maxRow = Math.max(selection.startRow, selection.endRow);
    const minCol = Math.min(selection.startCol, selection.endCol);
    const maxCol = Math.max(selection.startCol, selection.endCol);
    setCells(prev =>
      prev.map((row, rIdx) =>
        row.map((cell, cIdx) => {
          if (rIdx >= minRow && rIdx <= maxRow && cIdx >= minCol && cIdx <= maxCol) {
            return { ...cell, background: color || undefined };
          }
          return cell;
        })
      )
    );
    setColorMenu(null);
  }, [selection]);

  // 현재 선택 영역에 테두리 모드를 적용하되, 대상이 아닌 변 정보는 유지합니다.
  const applyBorderToSelection = useCallback((mode: BorderMode) => {
    const minRow = Math.min(selection.startRow, selection.endRow);
    const maxRow = Math.max(selection.startRow, selection.endRow);
    const minCol = Math.min(selection.startCol, selection.endCol);
    const maxCol = Math.max(selection.startCol, selection.endCol);

    setCells(prev => {
      const next = prev.map(row => row.map(cell => ({ ...cell, border: { ...(cell.border || {}) } })));

      // 유효한 셀 좌표에 한쪽 테두리만 기록합니다.
      const setBorder = (row: number, col: number, side: 'top' | 'right' | 'bottom' | 'left', value: boolean) => {
        if (row < 0 || row >= next.length || col < 0 || col >= (next[0]?.length || 0)) return;
        const target = next[row][col];
        target.border = { ...(target.border || {}), [side]: value };
      };

      for (let row = minRow; row <= maxRow; row++) {
        for (let col = minCol; col <= maxCol; col++) {
          if (mode === 'all') {
            setBorder(row, col, 'top', row === minRow);
            setBorder(row, col, 'right', true);
            setBorder(row, col, 'bottom', true);
            setBorder(row, col, 'left', col === minCol);
          } else if (mode === 'none') {
            next[row][col].border = {};
          } else if (mode === 'outer') {
            if (row === minRow) setBorder(row, col, 'top', true);
            if (row === maxRow) setBorder(row, col, 'bottom', true);
            if (col === minCol) setBorder(row, col, 'left', true);
            if (col === maxCol) setBorder(row, col, 'right', true);
          } else if (mode === 'top' && row === minRow) {
            setBorder(row, col, 'top', true);
          } else if (mode === 'bottom' && row === maxRow) {
            setBorder(row, col, 'bottom', true);
          } else if (mode === 'left' && col === minCol) {
            setBorder(row, col, 'left', true);
          } else if (mode === 'right' && col === maxCol) {
            setBorder(row, col, 'right', true);
          }
        }
      }

      return next;
    });
  }, [selection]);

  const applyAlignmentToSelection = useCallback(
    (axis: 'horizontal' | 'vertical', value: HorizontalAlign | VerticalAlign) => {
      const minRow = Math.min(selection.startRow, selection.endRow);
      const maxRow = Math.max(selection.startRow, selection.endRow);
      const minCol = Math.min(selection.startCol, selection.endCol);
      const maxCol = Math.max(selection.startCol, selection.endCol);

      setCells(prev =>
        prev.map((row, rIdx) =>
          row.map((cell, cIdx) => {
            if (rIdx < minRow || rIdx > maxRow || cIdx < minCol || cIdx > maxCol) return cell;
            if (axis === 'horizontal') return { ...cell, horizontalAlign: value as HorizontalAlign };
            return { ...cell, verticalAlign: value as VerticalAlign };
          })
        )
      );
    },
    [selection]
  );

  const applyFontFamilyToSelection = useCallback((fontFamily: string) => {
    const minRow = Math.min(selection.startRow, selection.endRow);
    const maxRow = Math.max(selection.startRow, selection.endRow);
    const minCol = Math.min(selection.startCol, selection.endCol);
    const maxCol = Math.max(selection.startCol, selection.endCol);

    setCells(prev =>
      prev.map((row, rIdx) =>
        row.map((cell, cIdx) => {
          if (rIdx < minRow || rIdx > maxRow || cIdx < minCol || cIdx > maxCol) return cell;
          return { ...cell, fontFamily };
        })
      )
    );
  }, [selection]);

  const applyFontSizeToSelection = useCallback((fontSize: string) => {
    const minRow = Math.min(selection.startRow, selection.endRow);
    const maxRow = Math.max(selection.startRow, selection.endRow);
    const minCol = Math.min(selection.startCol, selection.endCol);
    const maxCol = Math.max(selection.startCol, selection.endCol);

    setCells(prev =>
      prev.map((row, rIdx) =>
        row.map((cell, cIdx) => {
          if (rIdx < minRow || rIdx > maxRow || cIdx < minCol || cIdx > maxCol) return cell;
          return { ...cell, fontSize };
        })
      )
    );
  }, [selection]);

  const applyFontColorToSelection = useCallback((fontColor: string) => {
    const minRow = Math.min(selection.startRow, selection.endRow);
    const maxRow = Math.max(selection.startRow, selection.endRow);
    const minCol = Math.min(selection.startCol, selection.endCol);
    const maxCol = Math.max(selection.startCol, selection.endCol);

    setCells(prev =>
      prev.map((row, rIdx) =>
        row.map((cell, cIdx) => {
          if (rIdx < minRow || rIdx > maxRow || cIdx < minCol || cIdx > maxCol) return cell;
          return { ...cell, fontColor };
        })
      )
    );
  }, [selection]);

  const applyFontBackgroundToSelection = useCallback((fontBackground: string) => {
    const minRow = Math.min(selection.startRow, selection.endRow);
    const maxRow = Math.max(selection.startRow, selection.endRow);
    const minCol = Math.min(selection.startCol, selection.endCol);
    const maxCol = Math.max(selection.startCol, selection.endCol);

    setCells(prev =>
      prev.map((row, rIdx) =>
        row.map((cell, cIdx) => {
          if (rIdx < minRow || rIdx > maxRow || cIdx < minCol || cIdx > maxCol) return cell;
          return { ...cell, fontBackground };
        })
      )
    );
  }, [selection]);

  const toggleTextStyleToSelection = useCallback((style: 'bold' | 'italic' | 'strikeThrough') => {
    const minRow = Math.min(selection.startRow, selection.endRow);
    const maxRow = Math.max(selection.startRow, selection.endRow);
    const minCol = Math.min(selection.startCol, selection.endCol);
    const maxCol = Math.max(selection.startCol, selection.endCol);

    setCells(prev => {
      let shouldEnable = false;
      for (let r = minRow; r <= maxRow; r++) {
        for (let c = minCol; c <= maxCol; c++) {
          if (!prev[r]?.[c]?.[style]) {
            shouldEnable = true;
            break;
          }
        }
        if (shouldEnable) break;
      }

      return prev.map((row, rIdx) =>
        row.map((cell, cIdx) => {
          if (rIdx < minRow || rIdx > maxRow || cIdx < minCol || cIdx > maxCol) return cell;
          return { ...cell, [style]: shouldEnable };
        })
      );
    });
  }, [selection]);


  const handleElementClick = useCallback((e: React.MouseEvent, row: number, col: number, elementId: string) => {
    e.stopPropagation();
    const cell = cells[row]?.[col];
    const target = cell?.elements?.find((item) => item.id === elementId);
    if (!target) return;
    setInspectedElement({
      row,
      col,
      elementId: target.id,
      type: target.type,
      label: target.label || '',
      primaryKey: target.primaryKey || '',
      name: target.name || target.label || '',
      customId: target.customId || '',
      placeholder: target.placeholder || '',
    });
    setFocusedCell({ row, col });
    setSelection({ startRow: row, startCol: col, endRow: row, endCol: col });
  }, [cells]);

  const handleBackspaceElement = useCallback((row: number, col: number) => {
    setCells(prev => {
      const next = prev.map((r) => r.map((c) => ({ ...c })));
      const current = next[row]?.[col];
      if (!current) return prev;
      const currentElements = [...(current.elements || [])];
      if (currentElements.length === 0) return prev;
      const removed = currentElements.pop();
      next[row][col] = { ...current, elements: currentElements };
      if (
        removed &&
        inspectedElement &&
        inspectedElement.row === row &&
        inspectedElement.col === col &&
        inspectedElement.elementId === removed.id
      ) {
        setInspectedElement(null);
      }
      return next;
    });
  }, [inspectedElement]);

  // RNB 입력 변경은 임시 편집 상태(inspectedElement)에만 반영합니다.
  const handleRnbFieldChange = useCallback((field: 'label' | 'primaryKey' | 'name' | 'customId' | 'placeholder', value: string) => {
    setInspectedElement(prev => {
      if (!prev) return prev;
      return { ...prev, [field]: value };
    });
  }, []);

  // 저장 시에만 임시 편집값을 실제 셀 요소 데이터에 반영합니다.
  const handleRnbSave = useCallback(() => {
    if (!inspectedElement || !hasRnbChanges) return;
    setCells(prev =>
      prev.map((row, rIdx) =>
        row.map((cell, cIdx) => {
          if (rIdx !== inspectedElement.row || cIdx !== inspectedElement.col) return cell;
          const nextElements = (cell.elements || []).map((el) =>
                el.id === inspectedElement.elementId
                  ? {
                      ...el,
                      label: inspectedElement.label,
                      primaryKey: inspectedElement.primaryKey,
                      name: inspectedElement.name,
                      customId: inspectedElement.customId,
                  placeholder: inspectedElement.placeholder || '',
                }
              : el
          );
          const syncedHtml = syncElementNodesInHtml(cell.richTextHtml || buildDefaultRichTextHtml(cell), nextElements);
          const parsed = parseRichEditorPayload(syncedHtml, nextElements);
          return { ...cell, elements: parsed.elements, richTextHtml: parsed.html, value: parsed.plain };
        })
      )
    );
  }, [hasRnbChanges, inspectedElement]);

  // 취소 시 임시 편집값을 폐기하고 요소 선택 상태를 해제합니다.
  const handleRnbCancel = useCallback(() => {
    setInspectedElement(null);
  }, []);

  // 색상 버튼 위치를 기준으로 컬러 팔레트 팝업 좌표를 엽니다.
  const openColorMenu = useCallback((e: React.MouseEvent) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setColorMenu({ x: rect.left, y: rect.bottom + 4 });
  }, []);

  const openHeaderContextMenu = useCallback((e: React.MouseEvent, type: 'row' | 'col', index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setHeaderContextMenu({
      x: e.clientX,
      y: e.clientY,
      type,
      index,
    });
  }, []);

  // RNB 각 섹션의 열림/닫힘 상태를 토글합니다.
  const toggleRnbSection = useCallback((key: keyof typeof rnbOpenSections) => {
    setRnbOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // 색상 메뉴 바깥 클릭 시 팔레트를 닫습니다.
  useEffect(() => {
    if (!colorMenu) return;
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!colorMenuRef.current?.contains(target)) setColorMenu(null);
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [colorMenu]);

  useEffect(() => {
    if (!headerContextMenu) return;
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!headerContextMenuRef.current?.contains(target)) {
        setHeaderContextMenu(null);
      }
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [headerContextMenu]);

  // 행 헤더 렌더러(선택 상태/리사이즈 핸들 포함)입니다.
  const renderRowHeader = (rowIndex: number) => {
    const isRowSelected = selection.startCol === 0 && selection.endCol === Math.max(0, colCount - 1) && selection.startRow === rowIndex && selection.endRow === rowIndex;
    return (
      <th
        key={`row-header-${rowIndex}`}
        className={`row-header ${isRowSelected ? 'selected' : ''}`}
        style={{ height: rowHeights[rowIndex] }}
        onClick={() => handleRowHeaderClick(rowIndex)}
        onContextMenu={(e) => openHeaderContextMenu(e, 'row', rowIndex)}
      >
        <div className="row-header-content">{rowIndex + 1}</div>
        <div className="row-resize-handle" onMouseDown={(e) => handleRowResizeStart(e, rowIndex)} />
      </th>
    );
  };

  // 열 헤더 렌더러(알파벳 라벨/리사이즈 핸들 포함)입니다.
  const renderColHeader = (colIndex: number) => {
    const colLetter = String.fromCharCode(65 + (colIndex % 26));
    const colNumber = Math.floor(colIndex / 26);
    const colLabel = colNumber > 0 ? String.fromCharCode(64 + colNumber) + colLetter : colLetter;
    const isColSelected = selection.startRow === 0 && selection.endRow === Math.max(0, rowCount - 1) && selection.startCol === colIndex && selection.endCol === colIndex;
    return (
      <th
        key={`col-header-${colIndex}`}
        className={`col-header ${isColSelected ? 'selected' : ''}`}
        style={{ width: colWidths[colIndex] }}
        onClick={() => handleColHeaderClick(colIndex)}
        onContextMenu={(e) => openHeaderContextMenu(e, 'col', colIndex)}
      >
        <div className="col-header-content">{colLabel}</div>
        <div className="col-resize-handle" onMouseDown={(e) => handleColResizeStart(e, colIndex)} />
      </th>
    );
  };

  const minSelRow = Math.min(selection.startRow, selection.endRow);
  const maxSelRow = Math.max(selection.startRow, selection.endRow);
  const minSelCol = Math.min(selection.startCol, selection.endCol);
  const maxSelCol = Math.max(selection.startCol, selection.endCol);
  const isSingleSelection = minSelRow === maxSelRow && minSelCol === maxSelCol;
  const canMergeCells = !isSingleSelection;
  const canUnmergeCells = useMemo(() => {
    for (let row = minSelRow; row <= maxSelRow; row++) {
      for (let col = minSelCol; col <= maxSelCol; col++) {
        const cell = cells[row]?.[col];
        if (cell?.isMerged) return true;
      }
    }
    return false;
  }, [cells, minSelRow, maxSelRow, minSelCol, maxSelCol]);
  const toColLabel = (colIndex: number) => {
    const colLetter = String.fromCharCode(65 + (colIndex % 26));
    const colNumber = Math.floor(colIndex / 26);
    return colNumber > 0 ? String.fromCharCode(64 + colNumber) + colLetter : colLetter;
  };
  const selectedCell = cells[minSelRow]?.[minSelCol];
  const cellQuickMenu = {
    selectionLabel: `${minSelRow + 1}, ${toColLabel(minSelCol)}`,
    selectionInfo: `${minSelRow + 1}행 ${minSelCol + 1}열${
      minSelRow !== maxSelRow || minSelCol !== maxSelCol
        ? ` - ${maxSelRow + 1}행 ${maxSelCol + 1}열`
        : ''
    }`,
    bold: !!selectedCell?.bold,
    italic: !!selectedCell?.italic,
    strikeThrough: !!selectedCell?.strikeThrough,
    horizontalAlign: selectedCell?.horizontalAlign || 'left',
    verticalAlign: selectedCell?.verticalAlign || 'middle',
    background: selectedCell?.background ?? '',
    fontFamily: selectedCell?.fontFamily || 'Noto Sans KR',
    fontSize: selectedCell?.fontSize || '12px',
    fontColor: selectedCell?.fontColor || '#2f343b',
    fontBackground: selectedCell?.fontBackground || '#ffffff',
  };

  // 선택 범위 각 셀에 지정한 엘리먼트를 추가합니다.
  const addElementToSelection = useCallback((type: string, label: string) => {
    const minRow = Math.min(selection.startRow, selection.endRow);
    const maxRow = Math.max(selection.startRow, selection.endRow);
    const minCol = Math.min(selection.startCol, selection.endCol);
    const maxCol = Math.max(selection.startCol, selection.endCol);
    setCells(prev =>
        prev.map((row, rIdx) =>
            row.map((cell, cIdx) => {
              if (rIdx >= minRow && rIdx <= maxRow && cIdx >= minCol && cIdx <= maxCol) {
                const nextElements = [...(cell.elements || [])];
                const defaultToken = `${label}_${formatCurrentTimeToken()}`;
                const nextElement = {
                  id: `${rIdx}-${cIdx}-${Date.now()}-${nextElements.length}`,
                  type,
                  label,
                  primaryKey: defaultToken,
                  name: defaultToken,
                  customId: '',
                  placeholder: '',
                };
                nextElements.push(nextElement);
                const textHtml = plainTextToHtml(stripElementTokens(cell.value || ''));
                const baseHtml = cell.richTextHtml || textHtml;
                const nextHtml = baseHtml ? `${baseHtml} ${toElementHtml(nextElement)}` : toElementHtml(nextElement);
                const parsed = parseRichEditorPayload(nextHtml, nextElements);
                return { ...cell, elements: parsed.elements, richTextHtml: parsed.html, value: parsed.plain };
              }
              return cell;
            })
        )
    );
  }, [selection]);

  const lnbSelectGroups = useMemo(() => createLnbSelectGroups(addElementToSelection), [addElementToSelection]);
  const lnbCustomGroups = useMemo(() => createLnbCustomGroups(addElementToSelection), [addElementToSelection]);
  const lnbBaseGroups: LnbGroup[] = [];
  const lnbChoiceGroups: LnbGroup[] = [lnbSelectGroups[0], lnbSelectGroups[1], lnbSelectGroups[2], lnbSelectGroups[3]];
  const activeLnbGroups =
    lnbTab === '기본 설정'
      ? lnbBaseGroups
      : lnbTab === '자동 입력'
        ? lnbAutoGroups
        : lnbTab === '선택 입력'
          ? lnbChoiceGroups
          : lnbCustomGroups;

  return (
    <>
      <LayoutIndex
        onContextMenu={suppressContextMenu}
        header={<Header onOpenDoc={() => setIsDocOpen(true)} onContextMenu={suppressContextMenu} />}
        lnb={
          <LNB
            lnbTab={lnbTab}
            lnbGroups={activeLnbGroups}
            onChangeTab={setLnbTab}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        }
        mainTop={
          <div className="main-tabs-wrap">
            <div className="main-tabs">
              {sheets.map((sheet) => (
                <div
                  key={sheet.id}
                  className={`main-tab ${activeMainTab === sheet.id ? 'active' : ''} ${draggingMainTabId === sheet.id ? 'dragging' : ''} ${dragOverMainTabId === sheet.id ? 'drag-over' : ''}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => setActiveMainTab(sheet.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setActiveMainTab(sheet.id);
                    }
                  }}
                  draggable
                  onDragStart={(e) => {
                    setDraggingMainTabId(sheet.id);
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', sheet.id);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    if (dragOverMainTabId !== sheet.id) setDragOverMainTabId(sheet.id);
                  }}
                  onDragLeave={() => {
                    if (dragOverMainTabId === sheet.id) setDragOverMainTabId(null);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const sourceTabId = e.dataTransfer.getData('text/plain');
                    handleMainTabDrop(sheet.id, sourceTabId);
                  }}
                  onDragEnd={() => {
                    setDraggingMainTabId(null);
                    setDragOverMainTabId(null);
                  }}
                >
                  <span className="main-tab-label">{sheet.label}</span>
                  {activeMainTab === sheet.id && (
                    <span className="main-tab-inline-icons">
                      <button
                        type="button"
                        className="main-tab-inline-icon pen"
                        aria-label="탭 이름 수정"
                        title="탭 이름 수정"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMainTabLabelDraft(sheet.label);
                          setIsTabEditModalOpen(true);
                        }}
                      />
                      <button
                        type="button"
                        className="main-tab-inline-icon trash"
                        aria-label="탭 삭제"
                        title="탭 삭제"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsTabDeleteConfirmOpen(true);
                        }}
                      />
                    </span>
                  )}
                </div>
              ))}
              <button
                type="button"
                className="main-tab plus"
                onClick={() => setIsAddTabModalOpen(true)}
                aria-label="새 탭"
                title="추가"
              >
                <svg className="main-tab-plus-icon" viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M8 3.2v9.6" />
                  <path d="M3.2 8h9.6" />
                </svg>
              </button>
            </div>
            <div className="main-tabs-actions">
              <button
                type="button"
                className="main-tab-action"
                onClick={() => setIsShortcutOpen(true)}
                aria-label="단축키"
                title="단축키"
              >
                <svg className="main-tab-action-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
                  <rect x="1.8" y="3" width="12.4" height="9.8" rx="1.6" />
                  <line x1="4.2" y1="6.1" x2="6.2" y2="6.1" />
                  <line x1="7.2" y1="6.1" x2="9.2" y2="6.1" />
                  <line x1="10.2" y1="6.1" x2="12.2" y2="6.1" />
                  <line x1="4.2" y1="8.3" x2="6.2" y2="8.3" />
                  <line x1="7.2" y1="8.3" x2="9.2" y2="8.3" />
                  <line x1="10.2" y1="8.3" x2="12.2" y2="8.3" />
                  <line x1="4.2" y1="10.5" x2="11.8" y2="10.5" />
                </svg>
              </button>
              <button
                type="button"
                className="main-tab-action"
                onClick={() => setIsHelpOpen(true)}
                aria-label="정보"
                title="정보"
              >
                <span className="main-tab-help-badge" aria-hidden="true">i</span>
              </button>
            </div>
          </div>
        }
        main={
          <Main
            gridWidth={gridWidth}
            totalColWidth={totalColWidth}
            rulerMarks={rulerMarks}
            colCount={colCount}
            rowHeights={rowHeights}
            cells={cells}
            selection={selection}
            minSelRow={minSelRow}
            maxSelRow={maxSelRow}
            minSelCol={minSelCol}
            maxSelCol={maxSelCol}
            isSingleSelection={isSingleSelection}
            editingCell={editingCell}
            editingValue={editingValue}
            colorMenu={colorMenu}
            headerContextMenu={headerContextMenu}
            colorPalette={colorPalette}
            tableRef={tableRef}
            colorMenuRef={colorMenuRef}
            headerContextMenuRef={headerContextMenuRef}
            renderColHeader={renderColHeader}
            renderRowHeader={renderRowHeader}
            isCellSelected={isCellSelected}
            isCellFocused={isCellFocused}
            onAddRow={handleAddRow}
            onAddCol={handleAddCol}
            onMergeCells={handleMergeCells}
            onUnmergeCells={handleUnmergeCells}
            onOpenColorMenu={openColorMenu}
            onOpenShortcut={() => setIsShortcutOpen(true)}
            onOpenHelp={() => setIsHelpOpen(true)}
            onOpenDoc={() => setIsDocOpen(true)}
            onCellMouseDown={handleCellMouseDown}
            onCellClick={handleCellClick}
            onCellMouseEnter={handleCellMouseEnter}
            onCellDoubleClick={handleCellDoubleClick}
            onEditingValueChange={setEditingValue}
            onCellEditComplete={handleCellEditComplete}
            onCommitEditing={handleCommitEditing}
            onEditingCancel={() => setEditingCell(null)}
            onElementClick={handleElementClick}
            onBackspaceElement={handleBackspaceElement}
            onApplyBackground={applyBackgroundToSelection}
            onApplyBorder={applyBorderToSelection}
            onApplyAlignment={applyAlignmentToSelection}
            onApplyFontFamily={applyFontFamilyToSelection}
            onApplyFontSize={applyFontSizeToSelection}
            onApplyFontColor={applyFontColorToSelection}
            onApplyFontBackground={applyFontBackgroundToSelection}
            onToggleTextStyle={toggleTextStyleToSelection}
            onCloseHeaderContextMenu={() => setHeaderContextMenu(null)}
            isHelpOpen={isHelpOpen}
            isShortcutOpen={isShortcutOpen}
            isDocOpen={isDocOpen}
            isElementModalOpen={isElementModalOpen}
            isSettingsOpen={isSettingsOpen}
            onCloseHelp={() => setIsHelpOpen(false)}
            onCloseShortcut={() => setIsShortcutOpen(false)}
            onCloseDoc={() => setIsDocOpen(false)}
            onCloseElementModal={() => setIsElementModalOpen(false)}
            onCloseSettings={() => setIsSettingsOpen(false)}
          />
        }
        rnb={
          <RNB
            inspectedElement={inspectedElement}
            isCellEditing={!!editingCell}
            canMergeCells={canMergeCells}
            canUnmergeCells={canUnmergeCells}
            cellQuickMenu={cellQuickMenu}
            onCellToggleTextStyle={toggleTextStyleToSelection}
            onCellAlign={applyAlignmentToSelection}
            onCellBackground={applyBackgroundToSelection}
            onCellBorder={applyBorderToSelection}
            onCellFontFamily={applyFontFamilyToSelection}
            onCellFontSize={applyFontSizeToSelection}
            onCellFontColor={applyFontColorToSelection}
            onCellFontBackground={applyFontBackgroundToSelection}
            onAddRow={handleAddRow}
            onAddCol={handleAddCol}
            onDeleteRow={handleDeleteRow}
            onDeleteCol={handleDeleteCol}
            onMergeCells={handleMergeCells}
            onUnmergeCells={handleUnmergeCells}
            onClearSelectionContents={clearSelectionContents}
            rnbOpenSections={rnbOpenSections}
            onToggleSection={toggleRnbSection}
            onFieldChange={handleRnbFieldChange}
            onSave={handleRnbSave}
            canSave={hasRnbChanges}
            onCancel={handleRnbCancel}
          />
        }
      />
      {isAddTabModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddTabModalOpen(false)}>
          <div className="modal modal-square-actions" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">폼 영역 추가</h3>
              <button className="modal-close" onClick={() => setIsAddTabModalOpen(false)} aria-label="닫기">×</button>
            </div>
            <div className="modal-body">
              <div className="square-action-grid">
                <button
                  type="button"
                  className="square-action-button basic-form"
                  onClick={() => {
                    const activeIndex = sheets.findIndex((sheet) => sheet.id === activeMainTab);
                    const insertAt = activeIndex >= 0 ? activeIndex + 1 : sheets.length;
                    const nextNumber = sheets.length + 1;
                    const nextId = `sheet-${Date.now()}`;
                    const nextSheet: MainSheet = {
                      id: nextId,
                      label: `본문 ${nextNumber}`,
                      cells: createEmptyCells(INITIAL_ROWS, INITIAL_COLS),
                      rowHeights: Array(INITIAL_ROWS).fill(DEFAULT_ROW_HEIGHT),
                      colWidths: computeDistributedWidths(INITIAL_COLS),
                      selection: { startRow: 0, startCol: 0, endRow: 0, endCol: 0 },
                      focusedCell: { row: 0, col: 0 },
                    };
                    setSheets((prev) => [...prev.slice(0, insertAt), nextSheet, ...prev.slice(insertAt)]);
                    setActiveMainTab(nextId);
                    setIsAddTabModalOpen(false);
                  }}
                >
                  <svg viewBox="0 0 20 20" aria-hidden="true">
                    <rect x="3.5" y="2.5" width="13" height="15" rx="2" />
                    <line x1="6.2" y1="7" x2="13.8" y2="7" />
                    <line x1="6.2" y1="10.1" x2="13.8" y2="10.1" />
                    <line x1="6.2" y1="13.2" x2="11.8" y2="13.2" />
                  </svg>
                  <span>기본 양식</span>
                </button>
                <button type="button" className="square-action-button google-doc" onClick={() => window.alert('준비 중')}>
                  <svg viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M6.2 2.8h6.6l3 3v9.7a2 2 0 0 1-2 2H6.2a2 2 0 0 1-2-2V4.8a2 2 0 0 1 2-2z" />
                    <path d="M12.8 2.8v3h3" />
                    <line x1="7.2" y1="9.1" x2="12.8" y2="9.1" />
                    <line x1="7.2" y1="12" x2="12.8" y2="12" />
                  </svg>
                  <span>구글 문서</span>
                </button>
                <button type="button" className="square-action-button text-editor" onClick={() => window.alert('준비 중')}>
                  <svg viewBox="0 0 20 20" aria-hidden="true">
                    <rect x="2.8" y="3.2" width="14.4" height="13.6" rx="2.2" />
                    <line x1="6.2" y1="7" x2="13.8" y2="7" />
                    <line x1="6.2" y1="10.1" x2="12.2" y2="10.1" />
                    <path d="M11.1 13.9l3.3-3.3 1.6 1.6-3.3 3.3-2.1.5z" />
                  </svg>
                  <span>텍스트 에디터</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {isTabEditModalOpen && (
        <div className="modal-overlay" onClick={() => setIsTabEditModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">탭 이름 수정</h3>
              <button className="modal-close" onClick={() => setIsTabEditModalOpen(false)} aria-label="닫기">×</button>
            </div>
            <div className="modal-body">
              <input
                className="main-tab-modal-input"
                type="text"
                value={mainTabLabelDraft}
                onChange={(e) => setMainTabLabelDraft(e.target.value)}
                autoFocus
              />
              <div className="main-tab-modal-actions">
                <button
                  type="button"
                  className="main-tab-modal-button primary"
                  onClick={() => {
                    setSheets((prev) =>
                      prev.map((sheet) =>
                        sheet.id === activeMainTab
                          ? { ...sheet, label: mainTabLabelDraft.trim() || '본문' }
                          : sheet
                      )
                    );
                    setIsTabEditModalOpen(false);
                  }}
                >
                  확인
                </button>
                <button
                  type="button"
                  className="main-tab-modal-button"
                  onClick={() => setIsTabEditModalOpen(false)}
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {isTabDeleteConfirmOpen && (
        <div className="modal-overlay" onClick={() => setIsTabDeleteConfirmOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">확인</h3>
              <button className="modal-close" onClick={() => setIsTabDeleteConfirmOpen(false)} aria-label="닫기">×</button>
            </div>
            <div className="modal-body">
              <p className="modal-text">삭제하시겠습니까?</p>
              <div className="main-tab-modal-actions">
                <button
                  type="button"
                  className="main-tab-modal-button danger"
                  onClick={() => {
                    if (sheets.length <= 1) {
                      window.alert('최소 1개의 탭은 필요합니다.');
                      setIsTabDeleteConfirmOpen(false);
                      return;
                    }
                    const activeIndex = sheets.findIndex((sheet) => sheet.id === activeMainTab);
                    const remaining = sheets.filter((sheet) => sheet.id !== activeMainTab);
                    setSheets(remaining);
                    const nextActiveIndex = Math.max(0, activeIndex - 1);
                    setActiveMainTab(remaining[nextActiveIndex].id);
                    setIsTabDeleteConfirmOpen(false);
                  }}
                >
                  삭제
                </button>
                <button
                  type="button"
                  className="main-tab-modal-button"
                  onClick={() => setIsTabDeleteConfirmOpen(false)}
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <SheetPreview
        sheets={sheets.map((sheet) => ({
          id: sheet.id,
          label: sheet.label,
          cells: sheet.cells,
          colWidths: sheet.colWidths,
          rowHeights: sheet.rowHeights,
        }))}
      />
    </>
  );
};

export default SpreadsheetEditor;
