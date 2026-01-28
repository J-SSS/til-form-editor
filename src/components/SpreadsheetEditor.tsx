import React, { useState, useRef, useCallback, useEffect } from 'react';
import './SpreadsheetEditor.css';

interface Cell {
  id: string;
  value: string;
  rowSpan?: number;
  colSpan?: number;
  isMerged?: boolean;
  mergedFrom?: { row: number; col: number };
}

interface CellPosition {
  row: number;
  col: number;
}

interface Selection {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}

const DEFAULT_ROW_HEIGHT = 25;
const DEFAULT_COL_WIDTH = 100;
const INITIAL_ROWS = 50;
const INITIAL_COLS = 20;

const SpreadsheetEditor: React.FC = () => {
  const [cells, setCells] = useState<Cell[][]>(() => 
    Array(INITIAL_ROWS).fill(null).map((_, row) =>
      Array(INITIAL_COLS).fill(null).map((_, col) => ({
        id: `${row}-${col}`,
        value: '',
        rowSpan: 1,
        colSpan: 1,
        isMerged: false,
      }))
    )
  );
  
  const [rowHeights, setRowHeights] = useState<number[]>(
    Array(INITIAL_ROWS).fill(DEFAULT_ROW_HEIGHT)
  );
  
  const [colWidths, setColWidths] = useState<number[]>(
    Array(INITIAL_COLS).fill(DEFAULT_COL_WIDTH)
  );
  
  const [selection, setSelection] = useState<Selection>({ startRow: 0, startCol: 0, endRow: 0, endCol: 0 });
  const [isSelecting, setIsSelecting] = useState(false);
  const [editingCell, setEditingCell] = useState<CellPosition | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [focusedCell, setFocusedCell] = useState<CellPosition>({ row: 0, col: 0 });
  
  const tableRef = useRef<HTMLTableElement>(null);
  
  const isResizingRow = useRef<number | null>(null);
  const isResizingCol = useRef<number | null>(null);
  const resizeStartY = useRef<number>(0);
  const resizeStartX = useRef<number>(0);
  const resizeStartHeight = useRef<number>(0);
  const resizeStartWidth = useRef<number>(0);

  // 셀 값 업데이트
  const updateCellValue = useCallback((row: number, col: number, value: string) => {
    setCells(prev => {
      const newCells = prev.map(r => [...r]);
      newCells[row][col].value = value;
      return newCells;
    });
  }, []);

  // 행 높이 조절 핸들러
  const handleRowResizeStart = useCallback((e: React.MouseEvent, rowIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    isResizingRow.current = rowIndex;
    resizeStartY.current = e.clientY;
    resizeStartHeight.current = rowHeights[rowIndex];
    document.addEventListener('mousemove', handleRowResize);
    document.addEventListener('mouseup', handleRowResizeEnd);
  }, [rowHeights]);

  const handleRowResize = useCallback((e: MouseEvent) => {
    if (isResizingRow.current === null) return;
    const deltaY = e.clientY - resizeStartY.current;
    const newHeight = Math.max(20, resizeStartHeight.current + deltaY);
    setRowHeights(prev => {
      const newHeights = [...prev];
      newHeights[isResizingRow.current!] = newHeight;
      return newHeights;
    });
  }, []);

  const handleRowResizeEnd = useCallback(() => {
    isResizingRow.current = null;
    document.removeEventListener('mousemove', handleRowResize);
    document.removeEventListener('mouseup', handleRowResizeEnd);
  }, [handleRowResize]);

  // 열 너비 조절 핸들러
  const handleColResizeStart = useCallback((e: React.MouseEvent, colIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    isResizingCol.current = colIndex;
    resizeStartX.current = e.clientX;
    resizeStartWidth.current = colWidths[colIndex];
    document.addEventListener('mousemove', handleColResize);
    document.addEventListener('mouseup', handleColResizeEnd);
  }, [colWidths]);

  const handleColResize = useCallback((e: MouseEvent) => {
    if (isResizingCol.current === null) return;
    const deltaX = e.clientX - resizeStartX.current;
    const newWidth = Math.max(50, resizeStartWidth.current + deltaX);
    setColWidths(prev => {
      const newWidths = [...prev];
      newWidths[isResizingCol.current!] = newWidth;
      return newWidths;
    });
  }, []);

  const handleColResizeEnd = useCallback(() => {
    isResizingCol.current = null;
    document.removeEventListener('mousemove', handleColResize);
    document.removeEventListener('mouseup', handleColResizeEnd);
  }, [handleColResize]);

  // 실제 셀 위치 찾기 (병합된 셀 고려)
  const getActualCell = useCallback((row: number, col: number): CellPosition => {
    const cell = cells[row]?.[col];
    if (cell?.mergedFrom) {
      return cell.mergedFrom;
    }
    return { row, col };
  }, [cells]);

  // 셀 선택 핸들러
  const handleCellMouseDown = useCallback((e: React.MouseEvent, row: number, col: number) => {
    e.preventDefault();
    const actualPos = getActualCell(row, col);
    setIsSelecting(true);
    setSelection({ 
      startRow: actualPos.row, 
      startCol: actualPos.col, 
      endRow: actualPos.row, 
      endCol: actualPos.col 
    });
    setFocusedCell(actualPos);
    setEditingCell(null);
  }, [getActualCell]);

  const handleCellMouseEnter = useCallback((row: number, col: number) => {
    if (isSelecting) {
      const actualPos = getActualCell(row, col);
      setSelection(prev => ({
        ...prev,
        endRow: actualPos.row,
        endCol: actualPos.col,
      }));
    }
  }, [isSelecting, getActualCell]);

  useEffect(() => {
    const handleMouseUp = () => {
      setIsSelecting(false);
    };
    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, []);

  // 셀 더블클릭으로 편집 시작
  const handleCellDoubleClick = useCallback((row: number, col: number) => {
    const actualPos = getActualCell(row, col);
    setEditingCell(actualPos);
    setEditingValue(cells[actualPos.row][actualPos.col].value);
  }, [cells, getActualCell]);

  // 셀 클릭으로 편집 시작 (F2 또는 더블클릭)
  const handleCellClick = useCallback((row: number, col: number) => {
    const actualPos = getActualCell(row, col);
    setFocusedCell(actualPos);
    if (selection.startRow !== actualPos.row || 
        selection.startCol !== actualPos.col ||
        selection.endRow !== actualPos.row || 
        selection.endCol !== actualPos.col) {
      setSelection({ 
        startRow: actualPos.row, 
        startCol: actualPos.col, 
        endRow: actualPos.row, 
        endCol: actualPos.col 
      });
    }
  }, [getActualCell, selection]);

  // 편집 완료
  const handleCellEditComplete = useCallback(() => {
    if (editingCell) {
      updateCellValue(editingCell.row, editingCell.col, editingValue);
      setEditingCell(null);
    }
  }, [editingCell, editingValue, updateCellValue]);

  // 셀이 선택 영역에 포함되는지 확인
  const isCellSelected = useCallback((row: number, col: number): boolean => {
    const minRow = Math.min(selection.startRow, selection.endRow);
    const maxRow = Math.max(selection.startRow, selection.endRow);
    const minCol = Math.min(selection.startCol, selection.endCol);
    const maxCol = Math.max(selection.startCol, selection.endCol);
    
    // 병합된 셀의 경우, 병합된 영역 전체가 선택되었는지 확인
    const cell = cells[row]?.[col];
    if (cell?.isMerged && !cell.mergedFrom) {
      // 병합의 주 셀인 경우
      const cellEndRow = row + (cell.rowSpan || 1) - 1;
      const cellEndCol = col + (cell.colSpan || 1) - 1;
      return !(cellEndRow < minRow || row > maxRow || cellEndCol < minCol || col > maxCol);
    } else if (cell?.mergedFrom) {
      // 병합된 셀의 일부인 경우 - 렌더링되지 않으므로 여기서는 false
      return false;
    }
    
    return row >= minRow && row <= maxRow && col >= minCol && col <= maxCol;
  }, [selection, cells]);

  // 포커스된 셀인지 확인
  const isCellFocused = useCallback((row: number, col: number): boolean => {
    if (!focusedCell) return false;
    return focusedCell.row === row && focusedCell.col === col;
  }, [focusedCell]);

  // 셀 병합
  const handleMergeCells = useCallback(() => {
    const minRow = Math.min(selection.startRow, selection.endRow);
    const maxRow = Math.max(selection.startRow, selection.endRow);
    const minCol = Math.min(selection.startCol, selection.endCol);
    const maxCol = Math.max(selection.startCol, selection.endCol);
    
    if (minRow === maxRow && minCol === maxCol) return; // 단일 셀은 병합 불가
    
    setCells(prev => {
      const newCells = prev.map(r => r.map(c => ({ ...c })));
      const rowSpan = maxRow - minRow + 1;
      const colSpan = maxCol - minCol + 1;
      
      // 병합된 셀 설정
      newCells[minRow][minCol] = {
        ...newCells[minRow][minCol],
        rowSpan,
        colSpan,
        isMerged: true,
      };
      
      // 나머지 셀들을 숨김 처리
      for (let row = minRow; row <= maxRow; row++) {
        for (let col = minCol; col <= maxCol; col++) {
          if (row !== minRow || col !== minCol) {
            newCells[row][col] = {
              ...newCells[row][col],
              isMerged: true,
              mergedFrom: { row: minRow, col: minCol },
            };
          }
        }
      }
      
      return newCells;
    });
  }, [selection]);

  // 셀 병합 해제
  const handleUnmergeCells = useCallback(() => {
    const minRow = Math.min(selection.startRow, selection.endRow);
    const maxRow = Math.max(selection.startRow, selection.endRow);
    const minCol = Math.min(selection.startCol, selection.endCol);
    const maxCol = Math.max(selection.startCol, selection.endCol);
    
    setCells(prev => {
      const newCells = prev.map(r => r.map(c => ({ ...c })));
      
      for (let row = minRow; row <= maxRow; row++) {
        for (let col = minCol; col <= maxCol; col++) {
          const cell = newCells[row][col];
          if (cell.isMerged) {
            if (cell.mergedFrom) {
              // 병합된 셀의 일부인 경우
              newCells[row][col] = {
                ...cell,
                isMerged: false,
                rowSpan: 1,
                colSpan: 1,
                mergedFrom: undefined,
              };
            } else {
              // 병합의 주 셀인 경우
              newCells[row][col] = {
                ...cell,
                isMerged: false,
                rowSpan: 1,
                colSpan: 1,
              };
            }
          }
        }
      }
      
      return newCells;
    });
  }, [selection]);

  // 키보드 네비게이션
  const moveSelection = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (!focusedCell) {
      setFocusedCell({ row: 0, col: 0 });
      setSelection({ startRow: 0, startCol: 0, endRow: 0, endCol: 0 });
      return;
    }

    let newRow = focusedCell.row;
    let newCol = focusedCell.col;

    switch (direction) {
      case 'up':
        newRow = Math.max(0, newRow - 1);
        break;
      case 'down':
        newRow = Math.min(INITIAL_ROWS - 1, newRow + 1);
        break;
      case 'left':
        newCol = Math.max(0, newCol - 1);
        break;
      case 'right':
        newCol = Math.min(INITIAL_COLS - 1, newCol + 1);
        break;
    }

    setFocusedCell({ row: newRow, col: newCol });
    setSelection({ startRow: newRow, startCol: newCol, endRow: newRow, endCol: newCol });
  }, [focusedCell]);

  // 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 편집 중일 때는 특정 키만 처리
      if (editingCell) {
        if (e.key === 'Escape') {
          e.preventDefault();
          setEditingCell(null);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          handleCellEditComplete();
        }
        return;
      }

      // Ctrl/Cmd 단축키
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

      // 화살표 키로 이동
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        moveSelection('up');
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        moveSelection('down');
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        moveSelection('left');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        moveSelection('right');
      } else if (e.key === 'Tab') {
        e.preventDefault();
        if (e.shiftKey) {
          moveSelection('left');
        } else {
          moveSelection('right');
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (focusedCell) {
          setEditingCell(focusedCell);
          setEditingValue(cells[focusedCell.row][focusedCell.col].value);
        }
      } else if (e.key === 'F2') {
        e.preventDefault();
        if (focusedCell) {
          setEditingCell(focusedCell);
          setEditingValue(cells[focusedCell.row][focusedCell.col].value);
        }
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // 일반 문자 입력 시 편집 시작
        if (focusedCell) {
          setEditingCell(focusedCell);
          setEditingValue(e.key);
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleMergeCells, handleUnmergeCells, editingCell, handleCellEditComplete, moveSelection, focusedCell, cells]);

  // 행 헤더 클릭 핸들러 (전체 행 선택)
  const handleRowHeaderClick = useCallback((rowIndex: number) => {
    setSelection({ 
      startRow: rowIndex, 
      startCol: 0, 
      endRow: rowIndex, 
      endCol: INITIAL_COLS - 1 
    });
    setFocusedCell({ row: rowIndex, col: 0 });
  }, []);

  // 열 헤더 클릭 핸들러 (전체 열 선택)
  const handleColHeaderClick = useCallback((colIndex: number) => {
    setSelection({ 
      startRow: 0, 
      startCol: colIndex, 
      endRow: INITIAL_ROWS - 1, 
      endCol: colIndex 
    });
    setFocusedCell({ row: 0, col: colIndex });
  }, []);

  // 행/열 헤더 렌더링
  const renderRowHeader = (rowIndex: number) => {
    const isRowSelected = 
      selection.startCol === 0 && 
      selection.endCol === INITIAL_COLS - 1 &&
      selection.startRow === rowIndex && 
      selection.endRow === rowIndex;
    
    return (
      <th
        key={`row-header-${rowIndex}`}
        className={`row-header ${isRowSelected ? 'selected' : ''}`}
        style={{ height: rowHeights[rowIndex] }}
        onClick={() => handleRowHeaderClick(rowIndex)}
      >
        <div className="row-header-content">{rowIndex + 1}</div>
        <div
          className="row-resize-handle"
          onMouseDown={(e) => handleRowResizeStart(e, rowIndex)}
        />
      </th>
    );
  };

  const renderColHeader = (colIndex: number) => {
    const colLetter = String.fromCharCode(65 + (colIndex % 26));
    const colNumber = Math.floor(colIndex / 26);
    const colLabel = colNumber > 0 ? String.fromCharCode(64 + colNumber) + colLetter : colLetter;
    
    const isColSelected = 
      selection.startRow === 0 && 
      selection.endRow === INITIAL_ROWS - 1 &&
      selection.startCol === colIndex && 
      selection.endCol === colIndex;
    
    return (
      <th
        key={`col-header-${colIndex}`}
        className={`col-header ${isColSelected ? 'selected' : ''}`}
        style={{ width: colWidths[colIndex] }}
        onClick={() => handleColHeaderClick(colIndex)}
      >
        <div className="col-header-content">{colLabel}</div>
        <div
          className="col-resize-handle"
          onMouseDown={(e) => handleColResizeStart(e, colIndex)}
        />
      </th>
    );
  };

  return (
    <div className="spreadsheet-container">
      <div className="spreadsheet-toolbar">
        <button onClick={handleMergeCells} className="toolbar-button">
          셀 병합
        </button>
        <button onClick={handleUnmergeCells} className="toolbar-button">
          병합 해제
        </button>
        <div className="toolbar-separator"></div>
        <div className="toolbar-info">
          <span className="toolbar-selection-info">
            선택: {Math.min(selection.startRow, selection.endRow) + 1}행 {Math.min(selection.startCol, selection.endCol) + 1}열
            {selection.startRow !== selection.endRow || selection.startCol !== selection.endCol
              ? ` - ${Math.max(selection.startRow, selection.endRow) + 1}행 ${Math.max(selection.startCol, selection.endCol) + 1}열`
              : ''}
          </span>
        </div>
        <div className="toolbar-hint">
          단축키: Ctrl+M (병합), Ctrl+U (병합 해제), F2 (편집), 화살표 키 (이동)
        </div>
      </div>
      <div className="spreadsheet-wrapper">
        <table ref={tableRef} className="spreadsheet-table">
          <thead>
            <tr>
              <th className="corner-header"></th>
              {Array(INITIAL_COLS).fill(null).map((_, colIndex) =>
                renderColHeader(colIndex)
              )}
            </tr>
          </thead>
          <tbody>
            {cells.map((row, rowIndex) => (
              <tr key={`row-${rowIndex}`} style={{ height: rowHeights[rowIndex] }}>
                {renderRowHeader(rowIndex)}
                {row.map((cell, colIndex) => {
                  // 병합된 셀의 일부인 경우 렌더링하지 않음
                  if (cell.isMerged && cell.mergedFrom) {
                    return null;
                  }
                  
                  const isSelected = isCellSelected(rowIndex, colIndex);
                  const isFocused = isCellFocused(rowIndex, colIndex);
                  const isEditing = editingCell?.row === rowIndex && editingCell?.col === colIndex;
                  
                  return (
                    <td
                      key={cell.id}
                      className={`spreadsheet-cell ${isSelected ? 'selected' : ''} ${isFocused ? 'focused' : ''} ${cell.isMerged ? 'merged' : ''}`}
                      rowSpan={cell.rowSpan}
                      colSpan={cell.colSpan}
                      onMouseDown={(e) => handleCellMouseDown(e, rowIndex, colIndex)}
                      onClick={() => handleCellClick(rowIndex, colIndex)}
                      onMouseEnter={() => handleCellMouseEnter(rowIndex, colIndex)}
                      onDoubleClick={() => handleCellDoubleClick(rowIndex, colIndex)}
                    >
                      {isEditing ? (
                        <input
                          type="text"
                          className="cell-input"
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onBlur={handleCellEditComplete}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleCellEditComplete();
                            } else if (e.key === 'Escape') {
                              setEditingCell(null);
                            }
                          }}
                          autoFocus
                        />
                      ) : (
                        <div className="cell-content">{cell.value || '\u00A0'}</div>
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
  );
};

export default SpreadsheetEditor;
