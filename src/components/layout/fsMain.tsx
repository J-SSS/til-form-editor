import React from 'react';
import { BorderMode, Cell, HeaderContextMenuState, HorizontalAlign, Selection, VerticalAlign } from '../fsFormStudio.types';

interface MainProps {
  gridWidth: number;
  totalColWidth: number;
  rulerMarks: number[];
  colCount: number;
  rowHeights: number[];
  cells: Cell[][];
  selection: Selection;
  minSelRow: number;
  maxSelRow: number;
  minSelCol: number;
  maxSelCol: number;
  isSingleSelection: boolean;
  editingCell: { row: number; col: number } | null;
  editingValue: string;
  colorMenu: { x: number; y: number } | null;
  headerContextMenu: HeaderContextMenuState | null;
  colorPalette: string[][];
  tableRef: React.RefObject<HTMLTableElement | null>;
  colorMenuRef: React.RefObject<HTMLDivElement | null>;
  headerContextMenuRef: React.RefObject<HTMLDivElement | null>;
  renderColHeader: (colIndex: number) => React.ReactNode;
  renderRowHeader: (rowIndex: number) => React.ReactNode;
  isCellSelected: (row: number, col: number) => boolean;
  isCellFocused: (row: number, col: number) => boolean;
  onAddRow: () => void;
  onAddCol: () => void;
  onMergeCells: () => void;
  onUnmergeCells: () => void;
  onOpenColorMenu: (e: React.MouseEvent) => void;
  onOpenShortcut: () => void;
  onOpenHelp: () => void;
  onOpenDoc: () => void;
  onCellMouseDown: (e: React.MouseEvent, row: number, col: number) => void;
  onCellClick: (row: number, col: number) => void;
  onCellMouseEnter: (row: number, col: number) => void;
  onCellDoubleClick: (row: number, col: number) => void;
  onEditingValueChange: (value: string) => void;
  onCellEditComplete: () => void;
  onCommitEditing: (row: number, col: number, value: string) => void;
  onEditingCancel: () => void;
  onElementClick: (e: React.MouseEvent, row: number, col: number, elementId: string) => void;
  onBackspaceElement: (row: number, col: number) => void;
  onApplyBackground: (color: string) => void;
  onApplyBorder: (mode: BorderMode) => void;
  onApplyAlignment: (axis: 'horizontal' | 'vertical', value: HorizontalAlign | VerticalAlign) => void;
  onApplyFontFamily: (fontFamily: string) => void;
  onApplyFontSize: (fontSize: string) => void;
  onApplyFontColor: (fontColor: string) => void;
  onApplyFontBackground: (fontBackground: string) => void;
  onToggleTextStyle: (style: 'bold' | 'italic' | 'strikeThrough') => void;
  onCloseHeaderContextMenu: () => void;
  onHeaderAddRowAbove: (rowIndex: number) => void;
  onHeaderAddRowBelow: (rowIndex: number) => void;
  onHeaderSetRowHeight: (rowIndex: number) => void;
  onHeaderDeleteRow: (rowIndex: number) => void;
  onHeaderAddColLeft: (colIndex: number) => void;
  onHeaderAddColRight: (colIndex: number) => void;
  onHeaderSetColWidth: (colIndex: number) => void;
  onHeaderDeleteCol: (colIndex: number) => void;
  isHelpOpen: boolean;
  isShortcutOpen: boolean;
  isDocOpen: boolean;
  isElementModalOpen: boolean;
  isSettingsOpen: boolean;
  onCloseHelp: () => void;
  onCloseShortcut: () => void;
  onCloseDoc: () => void;
  onCloseElementModal: () => void;
  onCloseSettings: () => void;
}

const FsMain: React.FC<MainProps> = ({
  gridWidth,
  totalColWidth,
  rulerMarks,
  colCount,
  rowHeights,
  cells,
  selection,
  minSelRow,
  maxSelRow,
  minSelCol,
  maxSelCol,
  isSingleSelection,
  editingCell,
  editingValue,
  colorMenu,
  headerContextMenu,
  colorPalette,
  tableRef,
  colorMenuRef,
  headerContextMenuRef,
  renderColHeader,
  renderRowHeader,
  isCellSelected,
  isCellFocused,
  onAddRow,
  onAddCol,
  onMergeCells,
  onUnmergeCells,
  onOpenColorMenu,
  onOpenShortcut,
  onOpenHelp,
  onOpenDoc,
  onCellMouseDown,
  onCellClick,
  onCellMouseEnter,
  onCellDoubleClick,
  onEditingValueChange,
  onCellEditComplete,
  onCommitEditing,
  onEditingCancel,
  onElementClick,
  onBackspaceElement,
  onApplyBackground,
  onApplyBorder,
  onApplyAlignment,
  onApplyFontFamily,
  onApplyFontSize,
  onApplyFontColor,
  onApplyFontBackground,
  onToggleTextStyle,
  onCloseHeaderContextMenu,
  onHeaderAddRowAbove,
  onHeaderAddRowBelow,
  onHeaderSetRowHeight,
  onHeaderDeleteRow,
  onHeaderAddColLeft,
  onHeaderAddColRight,
  onHeaderSetColWidth,
  onHeaderDeleteCol,
  isHelpOpen,
  isShortcutOpen,
  isDocOpen,
  isElementModalOpen,
  isSettingsOpen,
  onCloseHelp,
  onCloseShortcut,
  onCloseDoc,
  onCloseElementModal,
  onCloseSettings,
}) => {
  const RULER_SCROLLBAR_GUTTER = 16;
  const rulerContentWidth = Math.max(0, totalColWidth - RULER_SCROLLBAR_GUTTER);
  const focusCell = cells[minSelRow]?.[minSelCol];
  const selectedFontFamily = focusCell?.fontFamily || 'Hanjin Group Sans';
  const selectedFontSize = focusCell?.fontSize || '12px';
  const selectedFontColor = focusCell?.fontColor || '#2f343b';
  const selectedFontBackground = focusCell?.fontBackground || '#ffffff';
  const fontColorInputRef = React.useRef<HTMLInputElement | null>(null);
  const fontBgInputRef = React.useRef<HTMLInputElement | null>(null);
  const activeEditorRef = React.useRef<HTMLDivElement | null>(null);
  const savedRangeRef = React.useRef<Range | null>(null);
  const skipBlurCommitRef = React.useRef(false);

  React.useEffect(() => {
    if (!editingCell) return;
    const onSelectionChange = () => {
      const editor = activeEditorRef.current;
      if (!editor) return;
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      const range = sel.getRangeAt(0);
      if (!editor.contains(range.commonAncestorContainer)) return;
      savedRangeRef.current = range.cloneRange();
    };
    document.addEventListener('selectionchange', onSelectionChange);
    return () => document.removeEventListener('selectionchange', onSelectionChange);
  }, [editingCell]);

  const restoreEditorSelection = () => {
    const editor = activeEditorRef.current;
    if (!editor) return false;
    editor.focus();
    const sel = window.getSelection();
    if (!sel) return false;
    sel.removeAllRanges();
    if (savedRangeRef.current) {
      sel.addRange(savedRangeRef.current);
      return true;
    }
    const range = document.createRange();
    range.selectNodeContents(editor);
    range.collapse(false);
    sel.addRange(range);
    return true;
  };

  const resolveElementIdFromTarget = (target: EventTarget | null) => {
    if (!(target instanceof Element)) return null;
    const elementNode = target.closest('[data-element-id]') as HTMLElement | null;
    return elementNode?.dataset.elementId || null;
  };

  const applyInlineCommand = (command: 'bold' | 'italic' | 'strikeThrough') => {
    if (!restoreEditorSelection()) return false;
    document.execCommand(command, false);
    if (activeEditorRef.current) onEditingValueChange(activeEditorRef.current.innerHTML);
    return true;
  };

  const applyInlineCssStyle = (styleName: keyof CSSStyleDeclaration, styleValue: string) => {
    const editor = activeEditorRef.current;
    if (!editor) return false;
    if (!restoreEditorSelection()) return false;
    const selectionObj = window.getSelection();
    if (!selectionObj || selectionObj.rangeCount === 0) return false;
    const range = selectionObj.getRangeAt(0);
    if (!editor.contains(range.commonAncestorContainer)) return false;

    const wrapper = document.createElement('span');
    (wrapper.style[styleName] as unknown as string) = styleValue;
    if (range.collapsed) {
      wrapper.appendChild(document.createTextNode('\u200B'));
      range.insertNode(wrapper);
      range.setStart(wrapper.firstChild as Node, 1);
      range.collapse(true);
    } else {
      wrapper.appendChild(range.extractContents());
      range.insertNode(wrapper);
      selectionObj.removeAllRanges();
      const nextRange = document.createRange();
      nextRange.selectNodeContents(wrapper);
      selectionObj.addRange(nextRange);
    }
    onEditingValueChange(editor.innerHTML);
    return true;
  };

  const renderBorderIcon = (mode: BorderMode) => {
    const common = { width: 16, height: 16, viewBox: '0 0 16 16', fill: 'none', stroke: '#1f2a38', strokeWidth: 1.6 };
    if (mode === 'all') {
      return (
        <svg {...common} className="border-tool-icon" aria-hidden="true">
          <rect x="2" y="2" width="12" height="12" />
          <line x1="8" y1="2" x2="8" y2="14" />
          <line x1="2" y1="8" x2="14" y2="8" />
        </svg>
      );
    }
    if (mode === 'outer') {
      return (
        <svg {...common} className="border-tool-icon" aria-hidden="true">
          <rect x="2" y="2" width="12" height="12" />
        </svg>
      );
    }
    if (mode === 'top') {
      return (
        <svg {...common} className="border-tool-icon" aria-hidden="true">
          <rect x="2" y="2" width="12" height="12" stroke="#b8c2ce" />
          <line x1="2" y1="2" x2="14" y2="2" />
        </svg>
      );
    }
    if (mode === 'bottom') {
      return (
        <svg {...common} className="border-tool-icon" aria-hidden="true">
          <rect x="2" y="2" width="12" height="12" stroke="#b8c2ce" />
          <line x1="2" y1="14" x2="14" y2="14" />
        </svg>
      );
    }
    if (mode === 'left') {
      return (
        <svg {...common} className="border-tool-icon" aria-hidden="true">
          <rect x="2" y="2" width="12" height="12" stroke="#b8c2ce" />
          <line x1="2" y1="2" x2="2" y2="14" />
        </svg>
      );
    }
    if (mode === 'right') {
      return (
        <svg {...common} className="border-tool-icon" aria-hidden="true">
          <rect x="2" y="2" width="12" height="12" stroke="#b8c2ce" />
          <line x1="14" y1="2" x2="14" y2="14" />
        </svg>
      );
    }
    return (
      <svg {...common} className="border-tool-icon" aria-hidden="true">
        <rect x="2" y="2" width="12" height="12" stroke="#b8c2ce" />
        <line x1="3" y1="13" x2="13" y2="3" />
      </svg>
    );
  };

  const renderTableToolIcon = (type: 'add-row' | 'add-col' | 'merge' | 'unmerge' | 'fill') => {
    const common = { width: 16, height: 16, viewBox: '0 0 16 16', fill: 'none', stroke: '#1f2a38', strokeWidth: 1.4 };
    if (type === 'add-row') {
      return (
        <svg {...common} className="table-tool-icon" aria-hidden="true">
          <rect x="2" y="3" width="12" height="8" />
          <line x1="2" y1="7" x2="14" y2="7" />
          <line x1="6" y1="3" x2="6" y2="11" />
          <line x1="10" y1="3" x2="10" y2="11" />
          <line x1="8" y1="12.2" x2="8" y2="15" />
          <line x1="6.6" y1="13.6" x2="9.4" y2="13.6" />
        </svg>
      );
    }
    if (type === 'add-col') {
      return (
        <svg {...common} className="table-tool-icon" aria-hidden="true">
          <rect x="2" y="3" width="8" height="10" />
          <line x1="6" y1="3" x2="6" y2="13" />
          <line x1="2" y1="8" x2="10" y2="8" />
          <line x1="12.2" y1="8" x2="15" y2="8" />
          <line x1="13.6" y1="6.6" x2="13.6" y2="9.4" />
        </svg>
      );
    }
    if (type === 'merge') {
      return (
        <svg {...common} className="table-tool-icon" aria-hidden="true">
          <rect x="2" y="3" width="12" height="10" />
          <line x1="8" y1="3" x2="8" y2="13" stroke="#b8c2ce" />
          <line x1="2" y1="8" x2="14" y2="8" stroke="#b8c2ce" />
          <line x1="5" y1="8" x2="11" y2="8" />
          <polyline points="9.6,6.8 11,8 9.6,9.2" />
          <polyline points="6.4,6.8 5,8 6.4,9.2" />
        </svg>
      );
    }
    if (type === 'unmerge') {
      return (
        <svg {...common} className="table-tool-icon" aria-hidden="true">
          <rect x="2" y="3" width="12" height="10" />
          <line x1="8" y1="3" x2="8" y2="13" />
          <line x1="2" y1="8" x2="14" y2="8" />
          <line x1="4.4" y1="5.4" x2="11.6" y2="10.6" />
        </svg>
      );
    }
    return (
      <svg {...common} className="table-tool-icon" aria-hidden="true">
        <rect x="3" y="3" width="10" height="10" />
        <path d="M4.5 11.5L8 7.2L11.5 11.5Z" fill="#4e86ea" stroke="#376fce" />
      </svg>
    );
  };

  return (
    <div className="spreadsheet-main">
      <div
        className="sheet-unified-area"
        style={{ width: `${gridWidth}px`, minWidth: `${gridWidth}px`, maxWidth: `${gridWidth}px` }}
      >
        <div className="spreadsheet-toolbar">
          <div className="ribbon-header">
            <div className="ribbon-header-group">테이블</div>
            <div className="ribbon-header-group">정렬</div>
            <div className="ribbon-header-group">글꼴</div>
            <div className="ribbon-header-group">정보</div>
          </div>

          <div className="ribbon-body">
            <div className="ribbon-group ribbon-group-table">
              <div className="ribbon-table-row">
                <button onClick={onAddRow} className="ribbon-icon-button" title="행 추가">{renderTableToolIcon('add-row')}</button>
                <button onClick={onAddCol} className="ribbon-icon-button" title="열 추가">{renderTableToolIcon('add-col')}</button>
                <button onClick={onMergeCells} className="ribbon-icon-button" title="병합">{renderTableToolIcon('merge')}</button>
                <button onClick={onUnmergeCells} className="ribbon-icon-button" title="병합 해제">{renderTableToolIcon('unmerge')}</button>
                <button onClick={onOpenColorMenu} className="ribbon-icon-button" title="채우기">{renderTableToolIcon('fill')}</button>
              </div>
              <div className="ribbon-table-row">
                <button onClick={() => onApplyBorder('all')} className="ribbon-icon-button" title="전체 테두리">{renderBorderIcon('all')}</button>
                <button onClick={() => onApplyBorder('outer')} className="ribbon-icon-button" title="외곽 테두리">{renderBorderIcon('outer')}</button>
                <button onClick={() => onApplyBorder('top')} className="ribbon-icon-button" title="상단 테두리">{renderBorderIcon('top')}</button>
                <button onClick={() => onApplyBorder('bottom')} className="ribbon-icon-button" title="하단 테두리">{renderBorderIcon('bottom')}</button>
                <button onClick={() => onApplyBorder('left')} className="ribbon-icon-button" title="왼쪽 테두리">{renderBorderIcon('left')}</button>
                <button onClick={() => onApplyBorder('right')} className="ribbon-icon-button" title="우측 테두리">{renderBorderIcon('right')}</button>
                <button onClick={() => onApplyBorder('none')} className="ribbon-icon-button" title="제거 테두리">{renderBorderIcon('none')}</button>
              </div>
            </div>

            <div className="ribbon-group ribbon-group-align">
              <button className="ribbon-icon-button" title="위쪽 정렬" onClick={() => onApplyAlignment('vertical', 'top')}><svg className="align-tool-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#1f2a38" strokeWidth="1.4" aria-hidden="true"><line x1="2" y1="2.5" x2="14" y2="2.5" /><rect x="4" y="4.5" width="8" height="8" rx="1.2" /></svg></button>
              <button className="ribbon-icon-button" title="중간 정렬" onClick={() => onApplyAlignment('vertical', 'middle')}><svg className="align-tool-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#1f2a38" strokeWidth="1.4" aria-hidden="true"><line x1="2" y1="8" x2="14" y2="8" /><rect x="4" y="4" width="8" height="8" rx="1.2" /></svg></button>
              <button className="ribbon-icon-button" title="아래 정렬" onClick={() => onApplyAlignment('vertical', 'bottom')}><svg className="align-tool-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#1f2a38" strokeWidth="1.4" aria-hidden="true"><line x1="2" y1="13.5" x2="14" y2="13.5" /><rect x="4" y="3.5" width="8" height="8" rx="1.2" /></svg></button>
              <button className="ribbon-icon-button" title="좌측 정렬" onClick={() => onApplyAlignment('horizontal', 'left')}><svg className="align-tool-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#1f2a38" strokeWidth="1.4" aria-hidden="true"><line x1="2.5" y1="2" x2="2.5" y2="14" /><rect x="4.5" y="4" width="8" height="8" rx="1.2" /></svg></button>
              <button className="ribbon-icon-button" title="중앙 정렬" onClick={() => onApplyAlignment('horizontal', 'center')}><svg className="align-tool-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#1f2a38" strokeWidth="1.4" aria-hidden="true"><line x1="8" y1="2" x2="8" y2="14" /><rect x="4" y="4" width="8" height="8" rx="1.2" /></svg></button>
              <button className="ribbon-icon-button" title="우측 정렬" onClick={() => onApplyAlignment('horizontal', 'right')}><svg className="align-tool-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#1f2a38" strokeWidth="1.4" aria-hidden="true"><line x1="13.5" y1="2" x2="13.5" y2="14" /><rect x="3.5" y="4" width="8" height="8" rx="1.2" /></svg></button>
            </div>

            <div className="ribbon-group ribbon-group-font">
              <div className="font-controls-row">
                <select
                  className="ribbon-select"
                  value={selectedFontFamily}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (!applyInlineCssStyle('fontFamily', value)) onApplyFontFamily(value);
                  }}
                >
                  <option>Hanjin Group Sans</option>
                  <option>Malgun Gothic</option>
                  <option>Nanum Gothic</option>
                  <option>Noto Sans KR</option>
                  <option>Arial</option>
                  <option>Times New Roman</option>
                </select>
                <select
                  className="ribbon-size"
                  value={selectedFontSize}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (!applyInlineCssStyle('fontSize', value)) onApplyFontSize(value);
                  }}
                >
                  {['8px', '9px', '10px', '11px', '12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px', '48px', '64px', '72px', '96px'].map((size) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>
              <div className="font-controls-row">
                <button className="ribbon-text-button" title="굵게" onClick={() => { if (!applyInlineCommand('bold')) onToggleTextStyle('bold'); }}>B</button>
                <button className="ribbon-icon-button" title="이탤릭" onClick={() => { if (!applyInlineCommand('italic')) onToggleTextStyle('italic'); }}>
                  <svg className="text-style-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#1f2a38" strokeWidth="1.6" aria-hidden="true">
                    <line x1="10.5" y1="2.5" x2="5.5" y2="13.5" />
                    <line x1="4.5" y1="2.5" x2="12.5" y2="2.5" />
                    <line x1="3.5" y1="13.5" x2="11.5" y2="13.5" />
                  </svg>
                </button>
                <button className="ribbon-icon-button" title="취소선" onClick={() => { if (!applyInlineCommand('strikeThrough')) onToggleTextStyle('strikeThrough'); }}>
                  <svg className="text-style-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#1f2a38" strokeWidth="1.4" aria-hidden="true">
                    <path d="M12.6 4.8C12 3.9 10.8 3.4 9.3 3.4C7.2 3.4 5.8 4.3 5.8 5.6C5.8 6.8 7 7.3 8.8 7.7C10.7 8.1 12.2 8.7 12.2 10.3C12.2 12 10.5 13 8 13C6 13 4.4 12.2 3.6 10.8" />
                    <line x1="2.2" y1="8" x2="13.8" y2="8" />
                  </svg>
                </button>
                <button
                  className="ribbon-icon-button"
                  title="폰트 색상"
                  onClick={() => fontColorInputRef.current?.click()}
                >
                  <svg className="text-style-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#1f2a38" strokeWidth="1.4" aria-hidden="true">
                    <path d="M5.2 12.5L8 4.5L10.8 12.5" />
                    <line x1="6" y1="10" x2="10" y2="10" />
                    <line x1="3" y1="14" x2="13" y2="14" stroke={selectedFontColor} strokeWidth="2.4" />
                  </svg>
                </button>
                <button
                  className="ribbon-icon-button"
                  title="폰트 배경"
                  onClick={() => fontBgInputRef.current?.click()}
                >
                  <svg className="text-style-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#1f2a38" strokeWidth="1.4" aria-hidden="true">
                    <rect x="2.5" y="9.5" width="11" height="4" rx="1" fill={selectedFontBackground} stroke="#8da0b3" />
                    <path d="M5.2 8.4L8 3.6L10.8 8.4" />
                    <line x1="6.1" y1="7.2" x2="9.9" y2="7.2" />
                  </svg>
                </button>
                <input
                  ref={fontColorInputRef}
                  type="color"
                  className="hidden-color-input"
                  value={selectedFontColor}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (!applyInlineCssStyle('color', value)) onApplyFontColor(value);
                  }}
                />
                <input
                  ref={fontBgInputRef}
                  type="color"
                  className="hidden-color-input"
                  value={selectedFontBackground}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (!applyInlineCssStyle('backgroundColor', value)) onApplyFontBackground(value);
                  }}
                />
              </div>
            </div>

            <div className="ribbon-group ribbon-group-edit">
              <button className="ribbon-icon-button" onClick={onOpenShortcut} aria-label="단축키" title="단축키">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#1f2a38" strokeWidth="1.3" aria-hidden="true">
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
              <button className="ribbon-icon-button" onClick={onOpenHelp} aria-label="정보" title="정보">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#1f2a38" strokeWidth="1.4" aria-hidden="true">
                  <circle cx="8" cy="8" r="6" />
                  <line x1="8" y1="7" x2="8" y2="11.2" />
                  <circle cx="8" cy="4.8" r="0.75" fill="#1f2a38" stroke="none" />
                </svg>
              </button>
            </div>
          </div>
          <div className="toolbar-actions">
            <button className="help-button" onClick={onOpenDoc} aria-label="문서">Doc</button>
          </div>
        </div>

        <div className="ruler-row" style={{ width: '100%' }}>
          <div className="ruler-corner">
          </div>
          <div className="spreadsheet-ruler" style={{ width: `${rulerContentWidth}px` }}>
            <div className="ruler-left-boundary"></div>
            {rulerMarks.map((mark) => {
              const isMajor = mark % 10 === 0;
              const showLabel = isMajor && mark !== 0 && mark !== 100;
              return (
                <div
                  key={`ruler-${mark}`}
                  className={`ruler-tick ${isMajor ? 'major' : 'minor'}`}
                  style={{ left: `${mark}%` }}
                >
                  {showLabel && <span className="ruler-label">{mark}%</span>}
                </div>
              );
            })}
            <div className="ruler-right-boundary"></div>
          </div>
          <div className="ruler-scrollbar-gutter" style={{ width: `${RULER_SCROLLBAR_GUTTER}px` }}></div>
        </div>
        <div className="spreadsheet-wrapper" style={{ width: '100%', minWidth: '100%', maxWidth: '100%' }}>
          <table ref={tableRef} className="spreadsheet-table">
            <thead>
              <tr>
                <th className="corner-header"></th>
                {Array.from({ length: colCount }).map((_, colIndex) => renderColHeader(colIndex))}
              </tr>
            </thead>
            <tbody>
              {cells.map((row, rowIndex) => (
                <tr key={`row-${rowIndex}`} style={{ height: rowHeights[rowIndex] }}>
                  {renderRowHeader(rowIndex)}
                  {row.map((cell, colIndex) => {
                    if (cell.isMerged && cell.mergedFrom) return null;
                    const isSelected = isCellSelected(rowIndex, colIndex);
                    const isFocused = isCellFocused(rowIndex, colIndex);
                    const isEditing = editingCell?.row === rowIndex && editingCell?.col === colIndex;
                    const edgeTop = isSelected && rowIndex === minSelRow;
                    const edgeBottom = isSelected && rowIndex === maxSelRow;
                    const edgeLeft = isSelected && colIndex === minSelCol;
                    const edgeRight = isSelected && colIndex === maxSelCol;
                    const horizontalAlign = cell.horizontalAlign || 'left';
                    const verticalAlign = cell.verticalAlign || 'middle';
                    const fontFamily = cell.fontFamily || 'Noto Sans KR';
                    const fontSize = cell.fontSize || '12px';
                    const fontColor = cell.fontColor || '#2f343b';
                    const fontBackground = cell.fontBackground;
                    const fontWeight = cell.bold ? 700 : 400;
                    const fontStyle = cell.italic ? 'italic' : 'normal';
                    const textDecoration = cell.strikeThrough ? 'line-through' : 'none';
                    const contentAlignItems =
                      verticalAlign === 'top' ? 'flex-start' : verticalAlign === 'bottom' ? 'flex-end' : 'center';
                    const contentJustifyContent =
                      horizontalAlign === 'left' ? 'flex-start' : horizontalAlign === 'right' ? 'flex-end' : 'center';
                    const cellBorder = cell.border || {};
                    const hasCustomBorder = Boolean(
                      cellBorder.top || cellBorder.right || cellBorder.bottom || cellBorder.left
                    );
                    const borderStyleWidth = cell.borderWidth || '1px';
                    const borderStyleType = cell.borderStyle || 'solid';
                    const borderStyleColor = cell.borderColor || '#c8d5e8';
                    return (
                      <td
                        key={cell.id}
                        className={[
                          'spreadsheet-cell',
                          isSelected ? 'selected' : '',
                          isFocused && isSingleSelection ? 'focused' : '',
                          cell.isMerged ? 'merged' : '',
                          edgeTop ? 'selection-edge-top' : '',
                          edgeBottom ? 'selection-edge-bottom' : '',
                          edgeLeft ? 'selection-edge-left' : '',
                          edgeRight ? 'selection-edge-right' : '',
                        ].filter(Boolean).join(' ')}
                        rowSpan={cell.rowSpan}
                        colSpan={cell.colSpan}
                        style={{
                          backgroundColor: cell.background,
                          height: rowHeights[rowIndex],
                          maxHeight: rowHeights[rowIndex],
                          borderTop: cellBorder.top ? `${borderStyleWidth} ${borderStyleType} ${borderStyleColor}` : undefined,
                          borderRight: cellBorder.right ? `${borderStyleWidth} ${borderStyleType} ${borderStyleColor}` : undefined,
                          borderBottom: cellBorder.bottom ? `${borderStyleWidth} ${borderStyleType} ${borderStyleColor}` : undefined,
                          borderLeft: cellBorder.left ? `${borderStyleWidth} ${borderStyleType} ${borderStyleColor}` : undefined,
                        }}
                        onMouseDown={(e) => {
                          if (isEditing) return;
                          if (editingCell && (editingCell.row !== rowIndex || editingCell.col !== colIndex)) {
                            onCellEditComplete();
                          }
                          const elementId = resolveElementIdFromTarget(e.target);
                          if (elementId) return;
                          onCellMouseDown(e, rowIndex, colIndex);
                        }}
                        onClick={(e) => {
                          if (isEditing) return;
                          const elementId = resolveElementIdFromTarget(e.target);
                          if (elementId) {
                            onElementClick(e, rowIndex, colIndex, elementId);
                            return;
                          }
                          onCellClick(rowIndex, colIndex);
                        }}
                        onMouseEnter={() => {
                          if (isEditing) return;
                          onCellMouseEnter(rowIndex, colIndex);
                        }}
                        onDoubleClick={() => onCellDoubleClick(rowIndex, colIndex)}
                      >
                        {isEditing ? (
                          <div
                            className="cell-editor"
                            contentEditable
                            suppressContentEditableWarning
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              const elementId = resolveElementIdFromTarget(e.target);
                              if (!elementId) return;
                              onElementClick(e, rowIndex, colIndex, elementId);
                            }}
                            onInput={(e) => onEditingValueChange(e.currentTarget.innerHTML)}
                            onBlur={() => {
                              if (skipBlurCommitRef.current) {
                                skipBlurCommitRef.current = false;
                                activeEditorRef.current = null;
                                return;
                              }
                              activeEditorRef.current = null;
                              onCellEditComplete();
                            }}
                            onFocus={(e) => {
                              activeEditorRef.current = e.currentTarget;
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                e.stopPropagation();
                                onCellEditComplete();
                              } else if (e.key === 'Escape') {
                                e.preventDefault();
                                e.stopPropagation();
                                skipBlurCommitRef.current = true;
                                onEditingCancel();
                              }
                            }}
                            ref={(el) => {
                              if (!el) return;
                              const editKey = `${rowIndex}-${colIndex}`;
                              if (el.dataset.editKey === editKey && el.innerHTML === editingValue) return;
                              if (el.innerHTML !== editingValue) el.innerHTML = editingValue;
                              el.dataset.editKey = editKey;
                              activeEditorRef.current = el;
                              requestAnimationFrame(() => {
                                el.focus();
                                const range = document.createRange();
                                range.selectNodeContents(el);
                                range.collapse(false);
                                const sel = window.getSelection();
                                sel?.removeAllRanges();
                                sel?.addRange(range);
                              });
                            }}
                            style={
                              hasCustomBorder
                                ? {
                                    outline: 'none',
                                    boxShadow: 'inset 0 0 0 2px #1a73e8',
                                    textAlign: horizontalAlign,
                                    fontFamily,
                                    fontSize,
                                    color: fontColor,
                                    fontWeight,
                                    fontStyle,
                                    textDecoration,
                                  }
                                : { textAlign: horizontalAlign, fontFamily, fontSize, color: fontColor, fontWeight, fontStyle, textDecoration }
                            }
                          />
                        ) : cell.richTextHtml ? (
                          <span
                            className="cell-text"
                            style={{
                              alignItems: contentAlignItems,
                              justifyContent: contentJustifyContent,
                              textAlign: horizontalAlign,
                              fontFamily,
                              fontSize,
                              color: fontColor,
                              backgroundColor: fontBackground,
                              fontWeight,
                              fontStyle,
                              textDecoration,
                            }}
                            dangerouslySetInnerHTML={{ __html: cell.richTextHtml }}
                          />
                        ) : (cell.value || '').trim() ? (
                          <span
                            className="cell-text"
                            style={{
                              alignItems: contentAlignItems,
                              justifyContent: contentJustifyContent,
                              textAlign: horizontalAlign,
                              fontFamily,
                              fontSize,
                              color: fontColor,
                              backgroundColor: fontBackground,
                              fontWeight,
                              fontStyle,
                              textDecoration,
                            }}
                          >
                            {(cell.value || '').trim()}
                          </span>
                        ) : null}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="editor-status-bar" aria-hidden="true"></div>
      </div>

      {colorMenu && (
        <div className="color-menu" ref={colorMenuRef} style={{ top: colorMenu.y, left: colorMenu.x }}>
          <div className="color-menu-grid">
            {colorPalette.map((row, rowIdx) => (
              <div key={`palette-row-${rowIdx}`} className="color-menu-row">
                {row.map((color) => (
                  <button
                    key={color}
                    className="color-swatch"
                    style={{ backgroundColor: color }}
                    onClick={() => onApplyBackground(color)}
                  />
                ))}
              </div>
            ))}
          </div>
          <button className="color-clear" onClick={() => onApplyBackground('')}>초기화</button>
        </div>
      )}

      {headerContextMenu && (
        <div
          className="header-context-menu"
          ref={headerContextMenuRef}
          style={{ left: headerContextMenu.x, top: headerContextMenu.y }}
        >
          {headerContextMenu.type === 'row' ? (
            <>
              <button
                type="button"
                className="header-context-menu-item"
                onClick={() => onHeaderAddRowAbove(headerContextMenu.index)}
              >
                상단에 행 추가
              </button>
              <button
                type="button"
                className="header-context-menu-item"
                onClick={() => onHeaderAddRowBelow(headerContextMenu.index)}
              >
                하단에 행 추가
              </button>
              <button
                type="button"
                className="header-context-menu-item"
                onClick={() => onHeaderSetRowHeight(headerContextMenu.index)}
              >
                행 높이 설정
              </button>
              <div className="header-context-menu-divider" aria-hidden="true" />
              <button
                type="button"
                className="header-context-menu-item header-context-menu-item-danger"
                onClick={() => onHeaderDeleteRow(headerContextMenu.index)}
              >
                행 삭제
              </button>
            </>
          ) : headerContextMenu.type === 'col' ? (
            <>
              <button
                type="button"
                className="header-context-menu-item"
                onClick={() => onHeaderAddColLeft(headerContextMenu.index)}
              >
                좌측에 열 추가
              </button>
              <button
                type="button"
                className="header-context-menu-item"
                onClick={() => onHeaderAddColRight(headerContextMenu.index)}
              >
                우측에 열 추가
              </button>
              <button
                type="button"
                className="header-context-menu-item"
                onClick={() => onHeaderSetColWidth(headerContextMenu.index)}
              >
                열 너비 설정
              </button>
              <div className="header-context-menu-divider" aria-hidden="true" />
              <button
                type="button"
                className="header-context-menu-item header-context-menu-item-danger"
                onClick={() => onHeaderDeleteCol(headerContextMenu.index)}
              >
                열 삭제
              </button>
            </>
          ) : null}
          {headerContextMenu.type !== 'row' && headerContextMenu.type !== 'col' ? (
            <button type="button" className="header-context-menu-item" onClick={onCloseHeaderContextMenu}>
              닫기
            </button>
          ) : null}
        </div>
      )}

      {isHelpOpen && (
        <div className="modal-overlay" onClick={onCloseHelp}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">정보</h3>
              <button className="modal-close" onClick={onCloseHelp} aria-label="닫기">×</button>
            </div>
            <div className="modal-body">
              <p className="modal-text">결재 양식 메이커입니다. v0.1</p>
              <p className="modal-text">기능 문의 및 의견 : test@test.com</p>
            </div>
          </div>
        </div>
      )}

      {isShortcutOpen && (
        <div className="modal-overlay" onClick={onCloseShortcut}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">단축키</h3>
              <button className="modal-close" onClick={onCloseShortcut} aria-label="닫기">×</button>
            </div>
            <div className="modal-body">
              <p className="modal-text">Ctrl+M: 병합</p>
              <p className="modal-text">Ctrl+U: 병합 해제</p>
            </div>
          </div>
        </div>
      )}

      {isDocOpen && (
        <div className="modal-overlay" onClick={onCloseDoc}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">저장</h3>
              <button className="modal-close" onClick={onCloseDoc} aria-label="닫기">×</button>
            </div>
            <div className="modal-body">
              <p className="modal-text">저장되었습니다.</p>
            </div>
          </div>
        </div>
      )}

      {isElementModalOpen && (
        <div className="modal-overlay" onClick={onCloseElementModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">엘리먼트</h3>
              <button className="modal-close" onClick={onCloseElementModal} aria-label="닫기">×</button>
            </div>
            <div className="modal-body">
              <p className="modal-text">이 셀에는 엘리먼트가 배치되어 있습니다.</p>
            </div>
          </div>
        </div>
      )}

      {isSettingsOpen && (
        <div className="modal-overlay" onClick={onCloseSettings}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">설정</h3>
              <button className="modal-close" onClick={onCloseSettings} aria-label="닫기">×</button>
            </div>
            <div className="modal-body">
              <p className="modal-text">편집기 설정을 관리할 수 있습니다.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FsMain;

