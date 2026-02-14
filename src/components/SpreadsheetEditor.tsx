import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import Header from './layout/Header';
import LayoutIndex from './layout';
import LNB from './layout/LNB';
import Main from './layout/Main';
import RNB from './layout/RNB';
import SheetPreview from './layout/SheetPreview';
import { BorderMode, Cell, CellPosition, HeaderContextMenuState, HorizontalAlign, InspectedElement, LnbGroup, Selection, VerticalAlign } from './SpreadsheetEditor.types';
import './SpreadsheetEditor.css';

const GRID_CELL_WIDTH = 1024;
const HEADER_SIDE_WIDTH = 50;
const DEFAULT_ROW_HEIGHT = 25;
const INITIAL_ROWS = 3;
const INITIAL_COLS = 3;
const MIN_COL_WIDTH = 50;

// ??媛쒖닔??留욎떠 ?꾩껜 1024px瑜?洹좊벑 遺꾨같?쒕떎.
const computeDistributedWidths = (count: number) => {
  const safe = Math.max(1, count);
  const base = Math.floor(GRID_CELL_WIDTH / safe);
  const rem = GRID_CELL_WIDTH % safe;
  return Array.from({ length: safe }, (_, i) => base + (i < rem ? 1 : 0));
};

// ?섎━癒쇳듃 湲곕낯媛믪뿉 遺숈씪 ?꾩옱 ?쒓컖 ?좏겙(YYYYMMDDHHmmss)??留뚮뱺??
const formatCurrentTimeToken = () => {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
};

const SpreadsheetEditor: React.FC = () => {
  // ?쒗듃 ?듭떖 ?곹깭: ? ?곗씠?곗? ?덉씠?꾩썐(???믪씠/???덈퉬), ?좏깮/?몄쭛 ?곹깭瑜?愿由ы븳??
  const [cells, setCells] = useState<Cell[][]>(() =>
    Array.from({ length: INITIAL_ROWS }, (_, row) =>
      Array.from({ length: INITIAL_COLS }, (_, col) => ({
        id: `${row}-${col}`,
        value: '',
        rowSpan: 1,
        colSpan: 1,
        isMerged: false,
        background: undefined,
        elements: [],
      }))
    )
  );

  const [rowHeights, setRowHeights] = useState<number[]>(Array(INITIAL_ROWS).fill(DEFAULT_ROW_HEIGHT));
  const [colWidths, setColWidths] = useState<number[]>(computeDistributedWidths(INITIAL_COLS));
  const [selection, setSelection] = useState<Selection>({ startRow: 0, startCol: 0, endRow: 0, endCol: 0 });
  const [isSelecting, setIsSelecting] = useState(false);
  const [editingCell, setEditingCell] = useState<CellPosition | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [focusedCell, setFocusedCell] = useState<CellPosition>({ row: 0, col: 0 });
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isShortcutOpen, setIsShortcutOpen] = useState(false);
  const [isDocOpen, setIsDocOpen] = useState(false);
  const [isElementModalOpen, setIsElementModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [colorMenu, setColorMenu] = useState<{ x: number; y: number } | null>(null);
  const [headerContextMenu, setHeaderContextMenu] = useState<HeaderContextMenuState | null>(null);
  const [inspectedElement, setInspectedElement] = useState<InspectedElement | null>(null);
  const [lnbTab, setLnbTab] = useState<'선택' | '자동'>('선택');
  const [rnbOpenSections, setRnbOpenSections] = useState({
    propertiesMain: true,
    events: true,
    action: true,
    identification: true,
  });

  // ?쒕옒洹?由ъ궗?댁쫰? 硫붾돱 ?몃? ?대┃ 泥섎━瑜??꾪븳 DOM 李몄“媛믪씠??
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

  // ?고겢由?湲곕낯 硫붾돱瑜?留됱븘 而ㅼ뒪? ?몄쭛湲?UX瑜??좎??쒕떎.
  const suppressContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  // ?⑥씪 ? ?띿뒪??媛믪쓣 媛깆떊?쒕떎.
  const updateCellValue = useCallback((row: number, col: number, value: string) => {
    setCells(prev => {
      const next = prev.map(r => r.map(c => ({ ...c })));
      next[row][col].value = value;
      return next;
    });
  }, []);

  // ?됱쓣 n媛?異붽??섍퀬 ?믪씠 ?곹깭???④퍡 ?뺤옣?쒕떎.
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
            elements: [],
          }))
        );
      }
      return next;
    });
    setRowHeights(prev => [...prev, ...Array(count).fill(DEFAULT_ROW_HEIGHT)]);
  }, []);

  // ?댁쓣 n媛?異붽??섍퀬 1024px 怨좎젙 ??湲곗??쇰줈 ???덈퉬瑜??щ텇諛고븳??
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
          elements: [],
        }));
        return [...row, ...additions];
      })
    );
    setColWidths(prev => computeDistributedWidths(prev.length + count));
  }, []);

  // ?대컮 ?⑥씪 ??異붽? ?≪뀡?대떎.
  const handleAddRow = useCallback(() => handleAddRows(1), [handleAddRows]);
  // ?대컮 ?⑥씪 ??異붽? ?≪뀡?대떎.
  const handleAddCol = useCallback(() => handleAddCols(1), [handleAddCols]);

  // ??由ъ궗?댁쫰 ?쒖옉??留덉슦??湲곗? ?믪씠)????ν븯怨??꾩뿭 move/up 由ъ뒪?덈? 嫄대떎.
  const handleRowResizeStart = useCallback((e: React.MouseEvent, rowIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    resizeStartY.current = e.clientY;
    resizeStartHeight.current = rowHeights[rowIndex];
    isResizingRow.current = rowIndex;
    document.addEventListener('mousemove', handleRowResize);
    document.addEventListener('mouseup', handleRowResizeEnd);
  }, [rowHeights]);

  // ??由ъ궗?댁쫰 以?留덉슦???대룞?됱쓣 ?ㅼ젣 ?믪씠 蹂寃쎌쑝濡?諛섏쁺?쒕떎.
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

  // ??由ъ궗?댁쫰 醫낅즺 ???꾩뿭 由ъ뒪?덈? ?댁젣?쒕떎.
  const handleRowResizeEnd = useCallback(() => {
    isResizingRow.current = null;
    document.removeEventListener('mousemove', handleRowResize);
    document.removeEventListener('mouseup', handleRowResizeEnd);
  }, [handleRowResize]);

  // ??由ъ궗?댁쫰 ?쒖옉 ???댁썐 ?댁쓣 怨꾩궛???꾩껜 ??1024px) 怨좎젙??以鍮꾪븳??
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

  // ??由ъ궗?댁쫰 以??꾩옱 ???댁썐 ???덈퉬瑜??숈떆??議곗젙??珥앺빀 ??쓣 ?좎??쒕떎.
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
      // ?⑥씪 ?댁씪 ?뚮뒗 ?꾩껜 ??쓣 ??긽 怨좎젙
      setColWidths([GRID_CELL_WIDTH]);
    }
  }, []);

  // ??由ъ궗?댁쫰 醫낅즺 ???꾩뿭 由ъ뒪???꾩떆 李몄“瑜??뺣━?쒕떎.
  const handleColResizeEnd = useCallback(() => {
    isResizingCol.current = null;
    resizeNeighborIndex.current = null;
    document.removeEventListener('mousemove', handleColResize);
    document.removeEventListener('mouseup', handleColResizeEnd);
  }, [handleColResize]);

  // 蹂묓빀 ? 醫뚰몴瑜??ㅼ젣 ?듭빱 ? 醫뚰몴濡??뺢퇋?뷀븳??
  const getActualCell = useCallback((row: number, col: number): CellPosition => {
    const cell = cells[row]?.[col];
    if (cell?.mergedFrom) return cell.mergedFrom;
    return { row, col };
  }, [cells]);

  // ? ?쒕옒洹??좏깮 ?쒖옉 吏?먯쓣 ?ㅼ젙?쒕떎.
  const handleCellMouseDown = useCallback((e: React.MouseEvent, row: number, col: number) => {
    e.preventDefault();
    const actual = getActualCell(row, col);
    setIsSelecting(true);
    setSelection({ startRow: actual.row, startCol: actual.col, endRow: actual.row, endCol: actual.col });
    setFocusedCell(actual);
    setEditingCell(null);
  }, [getActualCell]);

  // ?쒕옒洹?以??ъ씤?곌? 吏?섍컙 ?源뚯? ?좏깮 踰붿쐞瑜??뺤옣?쒕떎.
  const handleCellMouseEnter = useCallback((row: number, col: number) => {
    if (!isSelecting) return;
    const actual = getActualCell(row, col);
    setSelection(prev => ({ ...prev, endRow: actual.row, endCol: actual.col }));
  }, [isSelecting, getActualCell]);

  // 留덉슦???????쒕옒洹??좏깮 紐⑤뱶瑜?醫낅즺?쒕떎.
  useEffect(() => {
    const up = () => setIsSelecting(false);
    document.addEventListener('mouseup', up);
    return () => document.removeEventListener('mouseup', up);
  }, []);

  // ?몄쭛 ?낅젰 ?꾨뱶瑜??쒖쇅???꾩껜 ?붾㈃ ?쒕옒洹??띿뒪???좏깮??李⑤떒?쒕떎.
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

  // ?붾툝?대┃??????몄쭛 紐⑤뱶濡??꾪솚?쒕떎.
  const handleCellDoubleClick = useCallback((row: number, col: number) => {
    const actual = getActualCell(row, col);
    setEditingCell(actual);
    setEditingValue(cells[actual.row][actual.col].value);
  }, [cells, getActualCell]);

  // ?⑥씪 ?대┃ ???ъ빱???좏깮??留욎텛怨?RNB ?좏깮 ?곹깭瑜??댁젣?쒕떎.
  const handleCellClick = useCallback((row: number, col: number) => {
    const actual = getActualCell(row, col);
    setFocusedCell(actual);
    setSelection({ startRow: actual.row, startCol: actual.col, endRow: actual.row, endCol: actual.col });
    setInspectedElement(null);
  }, [getActualCell]);

  // ? ?몄쭛???뺤젙??媛믪쓣 ??ν븯怨??몄쭛 紐⑤뱶瑜?醫낅즺?쒕떎.
  const handleCellEditComplete = useCallback(() => {
    if (editingCell) {
      updateCellValue(editingCell.row, editingCell.col, editingValue);
      setEditingCell(null);
    }
  }, [editingCell, editingValue, updateCellValue]);

  const handleCommitEditing = useCallback((row: number, col: number, value: string) => {
    updateCellValue(row, col, value);
    setEditingValue(value);
    setEditingCell(null);
  }, [updateCellValue]);

  // ?꾩옱 ????좏깮 踰붿쐞???ы븿?섎뒗吏(蹂묓빀 踰붿쐞 ?ы븿) ?먮퀎?쒕떎.
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

  // ?꾩옱 ????ㅻ낫???ъ빱????몄? ?뺤씤?쒕떎.
  const isCellFocused = useCallback((row: number, col: number) => {
    return focusedCell.row === row && focusedCell.col === col;
  }, [focusedCell]);

  // ?좏깮 ?ш컖?뺤쓣 醫뚯긽???듭빱 湲곗? 蹂묓빀 ?濡?留뚮뱺??
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

  // ?좏깮 踰붿쐞??嫄몃┛ 蹂묓빀 ?듭빱?ㅼ쓣 李얠븘 蹂묓빀 ?곸뿭 ?꾩껜瑜??댁젣?쒕떎.
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

  // ?붿궡????諛⑺뼢?쇰줈 ?ъ빱???좏깮 ????대룞?쒕떎.
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

  // ?좏깮 踰붿쐞??? ?띿뒪??諛곌꼍/?섎━癒쇳듃瑜?珥덇린?뷀븳??
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
            elements: [],
          };
        })
      )
    );
    setInspectedElement(null);
  }, [selection, getActualCell]);

  // ?꾩뿭 ?ㅻ낫???⑥텞???대룞/?몄쭛/蹂묓빀/??젣/紐⑤떖 ?リ린)瑜?泥섎━?쒕떎.
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
          const nextValue = active?.isContentEditable ? (active.textContent || '') : editingValue;
          updateCellValue(editingCell.row, editingCell.col, nextValue);
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
        if (e.key === 'm') {
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
        setEditingValue(cells[focusedCell.row][focusedCell.col].value);
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        setEditingCell(focusedCell);
        setEditingValue(e.key);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    editingCell,
    handleCellEditComplete,
    moveSelection,
    focusedCell,
    cells,
    handleMergeCells,
    handleUnmergeCells,
    isHelpOpen,
    isShortcutOpen,
    isDocOpen,
    isElementModalOpen,
    isSettingsOpen,
    headerContextMenu,
    clearSelectionContents,
  ]);

  // ???ㅻ뜑 ?대┃ ???대떦 ???꾩껜瑜??좏깮?쒕떎.
  const handleRowHeaderClick = useCallback((rowIndex: number) => {
    setSelection({ startRow: rowIndex, startCol: 0, endRow: rowIndex, endCol: Math.max(0, colCount - 1) });
    setFocusedCell({ row: rowIndex, col: 0 });
  }, [colCount]);

  // ???ㅻ뜑 ?대┃ ???대떦 ???꾩껜瑜??좏깮?쒕떎.
  const handleColHeaderClick = useCallback((colIndex: number) => {
    setSelection({ startRow: 0, startCol: colIndex, endRow: Math.max(0, rowCount - 1), endCol: colIndex });
    setFocusedCell({ row: 0, col: colIndex });
  }, [rowCount]);

  // ?좏깮 踰붿쐞 ???諛곌꼍?됱쓣 ?쇨큵 ?곸슜?쒕떎.
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

  // ?좏깮 踰붿쐞 媛????吏???섎━癒쇳듃瑜?異붽??쒕떎.
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
            nextElements.push({
              id: `${rIdx}-${cIdx}-${Date.now()}-${nextElements.length}`,
              type,
              label,
              primaryKey: defaultToken,
              name: defaultToken,
              customId: '',
              placeholder: '',
            });
            return { ...cell, elements: nextElements };
          }
          return cell;
        })
      )
    );
  }, [selection]);

  // ? ?대? ?섎━癒쇳듃瑜??대┃?섎㈃ ?대떦 ?섎━癒쇳듃 ?뺣낫瑜?RNB??濡쒕뱶?쒕떎.
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
      label: target.label,
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
  const handleRnbFieldChange = useCallback((field: 'primaryKey' | 'name' | 'customId' | 'placeholder', value: string) => {
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
                  primaryKey: inspectedElement.primaryKey,
                  name: inspectedElement.name,
                  customId: inspectedElement.customId,
                  placeholder: inspectedElement.placeholder || '',
                }
              : el
          );
          return { ...cell, elements: nextElements };
        })
      )
    );
  }, [hasRnbChanges, inspectedElement]);

  // 취소 시 임시 편집값을 폐기하고 요소 선택 상태를 해제합니다.
  const handleRnbCancel = useCallback(() => {
    setInspectedElement(null);
  }, []);

  // ?됱긽 踰꾪듉 ?꾩튂 湲곗??쇰줈 ?붾젅???앹뾽 醫뚰몴瑜??곕떎.
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

  // RNB ?묒씠???뱀뀡???대┝/?ロ옒 ?곹깭瑜??좉??쒕떎.
  const toggleRnbSection = useCallback((key: keyof typeof rnbOpenSections) => {
    setRnbOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // ?됱긽 硫붾돱 諛붽묑 ?대┃ ???붾젅?몃? ?ル뒗??
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

  // ???ㅻ뜑 ? ?뚮뜑留??좏깮 ?곹깭/由ъ궗?댁쫰 ?몃뱾 ?ы븿).
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

  // ???ㅻ뜑 ? ?뚮뜑留??뚰뙆踰??쇰꺼/由ъ궗?댁쫰 ?몃뱾 ?ы븿).
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
  const lnbSelectGroups: LnbGroup[] = [
    {
      title: 'Input Elements',
      items: [
        { id: 'input', icon: 'T', label: '입력 박스', action: () => { addElementToSelection('text', 'INP'); } },
        { id: 'table', icon: '\u2263', label: '텍스트 영역', action: () => { addElementToSelection('textarea', 'TXT'); } },
        { id: 'select', icon: '1', label: '숫자', action: () => { addElementToSelection('number', 'NUB'); } },
      ],
    },
    {
      title: 'Select Elements',
      items: [
        { id: 'listbox', icon: '\u25BE', label: '셀렉트 박스', action: () => { addElementToSelection('select', 'SLT'); } },
        { id: 'check', icon: '\u2611', label: '체크 박스', action: () => { addElementToSelection('checkbox', 'CHK'); } },
        { id: 'radio', icon: '\u25C9', label: '라디오 버튼', action: () => { addElementToSelection('radio', 'RDO'); } },
      ],
    },
    {
      title: 'View Elements',
      items: [
        { id: 'view-label', icon: 'L', label: '라벨', action: () => { addElementToSelection('label', 'LBL'); } },
        { id: 'view-url', icon: '\uD83D\uDD17', label: 'URL', action: () => { addElementToSelection('url', 'URL'); } },
        { id: 'view-image', icon: '\u25A3', label: '이미지', action: () => { addElementToSelection('image', 'IMG'); } },
      ],
    },
    {
      title: 'Action Elements',
      items: [
        { id: 'action-button', icon: '\u25A3', label: '버튼', action: () => { addElementToSelection('button', 'BTN'); } },
        { id: 'action-user-select', icon: '\u25C9', label: '사용자선택', action: () => { addElementToSelection('user-select', 'USR'); } },
        { id: 'action-department-select', icon: '\u25A6', label: '부서선택', action: () => { addElementToSelection('department-select', 'DPT'); } },
        { id: 'action-file-upload', icon: '\u21E7', label: '파일업로드', action: () => { addElementToSelection('file-upload', 'FILE'); } },
        { id: 'action-repeat-button', icon: '\u21BB', label: '반복버튼', action: () => { addElementToSelection('repeat-button', 'RPB'); } },
        { id: 'action-repeat-list-number', icon: '\u2263', label: '반복 목록 번호', action: () => { addElementToSelection('repeat-list-number', 'RPN'); } },
      ],
    },
  ];
  const lnbAutoGroups: LnbGroup[] = [
    {
      title: 'Auto Fill',
      items: [
        { id: 'auto-name', icon: '\u2699', label: '이름 규칙' },
        { id: 'auto-id', icon: '\u2317', label: 'ID 생성' },
        { id: 'auto-bind', icon: '\u223F', label: '데이터 연결' },
      ],
    },
    {
      title: 'Auto Layout',
      items: [
        { id: 'auto-align', icon: '\u25A6', label: '정렬 맞춤' },
        { id: 'auto-gap', icon: '\u21F5', label: '간격 정리' },
        { id: 'auto-size', icon: '\u2194', label: '크기 정규화' },
      ],
    },
    {
      title: 'Validation',
      items: [
        { id: 'auto-required', icon: '\u2713', label: '필수값' },
        { id: 'auto-type', icon: '\u25C8', label: '타입 검사' },
        { id: 'auto-range', icon: '\u2261', label: '범위 검사' },
      ],
    },
  ];
  const activeLnbGroups = lnbTab === '선택' ? lnbSelectGroups : lnbAutoGroups;

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
            rnbOpenSections={rnbOpenSections}
            onToggleSection={toggleRnbSection}
            onFieldChange={handleRnbFieldChange}
            onSave={handleRnbSave}
            canSave={hasRnbChanges}
            onCancel={handleRnbCancel}
          />
        }
      />
      <SheetPreview cells={cells} colWidths={colWidths} rowHeights={rowHeights} />
    </>
  );
};

export default SpreadsheetEditor;









