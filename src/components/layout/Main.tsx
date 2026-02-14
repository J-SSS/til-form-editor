import React from 'react';
import { BorderMode, Cell, HeaderContextMenuState, HorizontalAlign, Selection, VerticalAlign } from '../SpreadsheetEditor.types';

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
  onCloseHeaderContextMenu: () => void;
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

const Main: React.FC<MainProps> = ({
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
  onCloseHeaderContextMenu,
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
            <div className="ribbon-header-group">단락</div>
            <div className="ribbon-header-group">편집</div>
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
              <select className="ribbon-select" defaultValue="Hanjin Group Sans"><option>Hanjin Group Sans</option></select>
              <select className="ribbon-size" defaultValue="8pt"><option>8pt</option><option>10pt</option><option>12pt</option></select>
              <button className="ribbon-text-button" title="굵게">B</button>
              <button className="ribbon-text-button" title="기울임">I</button>
              <button className="ribbon-text-button" title="밑줄">U</button>
            </div>

            <div className="ribbon-group ribbon-group-paragraph">
              <button className="ribbon-icon-button" title="위쪽">↑</button>
              <button className="ribbon-icon-button" title="가운데">↕</button>
              <button className="ribbon-icon-button" title="아래쪽">↓</button>
            </div>

            <div className="ribbon-group ribbon-group-edit">
              <button className="ribbon-icon-button" onClick={onOpenShortcut} aria-label="단축키">?</button>
              <button className="ribbon-icon-button" onClick={onOpenHelp} aria-label="도움말">?</button>
            </div>
          </div>

          <div className="toolbar-info">
            <span className="toolbar-selection-info">
              선택: {Math.min(selection.startRow, selection.endRow) + 1}행 {Math.min(selection.startCol, selection.endCol) + 1}열
              {selection.startRow !== selection.endRow || selection.startCol !== selection.endCol
                ? ` - ${Math.max(selection.startRow, selection.endRow) + 1}행 ${Math.max(selection.startCol, selection.endCol) + 1}열`
                : ''}
            </span>
          </div>
          <div className="toolbar-actions">
            <button className="help-button" onClick={onOpenDoc} aria-label="문서">Doc</button>
          </div>
        </div>

        <div className="ruler-row" style={{ width: '100%' }}>
          <div className="ruler-corner">
            <button className="ruler-corner-button" aria-label="ruler-start"></button>
          </div>
          <div className="spreadsheet-ruler" style={{ width: `${totalColWidth}px` }}>
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
                    const contentAlignItems =
                      verticalAlign === 'top' ? 'flex-start' : verticalAlign === 'bottom' ? 'flex-end' : 'center';
                    const contentJustifyContent =
                      horizontalAlign === 'left' ? 'flex-start' : horizontalAlign === 'right' ? 'flex-end' : 'center';
                    const cellBorder = cell.border || {};
                    const hasCustomBorder = Boolean(
                      cellBorder.top || cellBorder.right || cellBorder.bottom || cellBorder.left
                    );
                    const edgeShadows: string[] = [];
                    if (edgeTop) edgeShadows.push('inset 0 2px 0 #1a73e8');
                    if (edgeBottom) edgeShadows.push('inset 0 -2px 0 #1a73e8');
                    if (edgeLeft) edgeShadows.push('inset 2px 0 0 #1a73e8');
                    if (edgeRight) edgeShadows.push('inset -2px 0 0 #1a73e8');
                    const edgeShadow = edgeShadows.join(', ');
                    return (
                      <td
                        key={cell.id}
                        className={
                          `spreadsheet-cell ` +
                          `${isSelected ? 'selected' : ''} ` +
                          `${isFocused && isSingleSelection ? 'focused' : ''} ` +
                          `${cell.isMerged ? 'merged' : ''}`
                        }
                        rowSpan={cell.rowSpan}
                        colSpan={cell.colSpan}
                        style={{
                          backgroundColor: cell.background,
                          borderTop: cellBorder.top ? '1px solid #000000' : undefined,
                          borderLeft: cellBorder.left ? '1px solid #000000' : undefined,
                          borderRight: cellBorder.right ? '1px solid #000000' : '1px solid #e0e0e0',
                          borderBottom: cellBorder.bottom ? '1px solid #000000' : '1px solid #e0e0e0',
                          boxShadow: edgeShadow || undefined,
                          height: rowHeights[rowIndex],
                          maxHeight: rowHeights[rowIndex],
                        }}
                        onMouseDown={(e) => onCellMouseDown(e, rowIndex, colIndex)}
                        onClick={() => onCellClick(rowIndex, colIndex)}
                        onMouseEnter={() => onCellMouseEnter(rowIndex, colIndex)}
                        onDoubleClick={() => onCellDoubleClick(rowIndex, colIndex)}
                      >
                        {isEditing ? (
                          <input
                            type="text"
                            className="cell-input"
                            value={editingValue}
                            onChange={(e) => onEditingValueChange(e.target.value)}
                            onBlur={onCellEditComplete}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') onCellEditComplete();
                              else if (e.key === 'Escape') onEditingCancel();
                            }}
                            style={
                              hasCustomBorder
                                ? {
                                    outline: 'none',
                                    boxShadow: 'inset 0 0 0 2px #1a73e8',
                                    textAlign: horizontalAlign,
                                  }
                                : { textAlign: horizontalAlign }
                            }
                            autoFocus
                          />
                        ) : (
                          <div
                            className="cell-content"
                            style={{
                              alignItems: contentAlignItems,
                              justifyContent: contentJustifyContent,
                              textAlign: horizontalAlign,
                            }}
                          >
                            {(cell.elements || []).length > 0 && (
                              <div className="cell-elements">
                                {(cell.elements || []).map((item) => (
                                  <button
                                    key={item.id}
                                    type="button"
                                    className="cell-element"
                                    onClick={(e) => onElementClick(e, rowIndex, colIndex, item.id)}
                                    onDoubleClick={(e) => e.stopPropagation()}
                                  >
                                    {item.label}
                                  </button>
                                ))}
                              </div>
                            )}
                            {cell.value ? <span className="cell-text">{cell.value}</span> : null}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
          <button type="button" className="header-context-menu-item" onClick={onCloseHeaderContextMenu}>
            선택 ROW
          </button>
        </div>
      )}

      {isHelpOpen && (
        <div className="modal-overlay" onClick={onCloseHelp}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">도움말</h3>
              <button className="modal-close" onClick={onCloseHelp} aria-label="닫기">×</button>
            </div>
            <div className="modal-body">
              <p className="modal-text">셀 선택/편집/병합 기능을 사용할 수 있습니다.</p>
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

export default Main;

