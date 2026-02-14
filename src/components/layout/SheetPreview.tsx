import React, { useEffect, useMemo, useState } from 'react';
import { Cell } from '../SpreadsheetEditor.types';

interface SheetPreviewProps {
  cells: Cell[][];
  colWidths: number[];
  rowHeights: number[];
}

// srcDoc HTML에 삽입하기 전에 텍스트를 이스케이프합니다.
const escapeHtml = (value: string) => {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

// 미리보기 칩 스타일 매핑에 사용하는 요소 타입 판별 함수입니다.
const isSelectElementType = (type: string) => {
  return type === 'select' || type === 'checkbox' || type === 'radio';
};

const isViewElementType = (type: string) => {
  return type === 'label' || type === 'url' || type === 'image';
};

const isActionElementType = (type: string) => {
  return type === 'button'
    || type === 'user-select'
    || type === 'department-select'
    || type === 'file-upload'
    || type === 'repeat-button'
    || type === 'repeat-list-number';
};

// 요소 타입에 따라 미리보기 HTML 태그(또는 칩)를 생성합니다.
const renderElementPreviewHtml = (type: string, label: string, placeholder?: string) => {
  const safeLabel = escapeHtml(label);
  const safePlaceholder = escapeHtml(placeholder || label);
  if (isActionElementType(type)) {
    return `<button type="button" class="element-control element-action-button">버튼</button>`;
  }
  if (type === 'text') {
    return `<input class="element-control element-input" type="text" placeholder="${safePlaceholder}" />`;
  }
  if (type === 'textarea') {
    return `<textarea class="element-control element-textarea" placeholder="${safePlaceholder}"></textarea>`;
  }
  if (type === 'number') {
    return `<input class="element-control element-input" type="number" placeholder="${safePlaceholder}" />`;
  }
  if (type === 'select') {
    return `<select class="element-control element-select"><option>${safeLabel}</option></select>`;
  }
  if (type === 'checkbox') {
    return `<label class="element-check-wrap"><input type="checkbox" class="element-check" /><span>${safeLabel}</span></label>`;
  }
  if (type === 'radio') {
    return `<label class="element-check-wrap"><input type="radio" class="element-check" name="preview-radio-${safeLabel}" /><span>${safeLabel}</span></label>`;
  }
  const tone = isSelectElementType(type)
    ? 'chip-select'
    : isViewElementType(type)
      ? 'chip-view'
      : isActionElementType(type)
        ? 'chip-action'
        : 'chip-default';
  return `<span class="chip ${tone}">${safeLabel}</span>`;
};

// 현재 시트 상태로 iframe 미리보기에 사용할 독립 HTML 문서를 생성합니다.
const buildPreviewHtml = (cells: Cell[][], colWidths: number[], rowHeights: number[]) => {
  const tableRows = cells
    .map((row, rowIndex) => {
      const rowCells = row
        .map((cell, colIndex) => {
          if (cell.isMerged && cell.mergedFrom) return '';

          const spanCols = cell.colSpan || 1;
          const spanRows = cell.rowSpan || 1;
          const width = colWidths.slice(colIndex, colIndex + spanCols).reduce((sum, value) => sum + value, 0);
          const height = rowHeights.slice(rowIndex, rowIndex + spanRows).reduce((sum, value) => sum + value, 0);
          const horizontalAlign = cell.horizontalAlign || 'left';
          const verticalAlign = cell.verticalAlign || 'middle';
          const alignItems =
            horizontalAlign === 'left' ? 'flex-start' : horizontalAlign === 'right' ? 'flex-end' : 'center';
          const justifyContent =
            verticalAlign === 'top' ? 'flex-start' : verticalAlign === 'bottom' ? 'flex-end' : 'center';

          const styleParts = [
            `width:${width}px`,
            `min-width:${width}px`,
            `height:${height}px`,
            `background:${cell.background || '#ffffff'}`,
            `border-top:${cell.border?.top === true ? '1px solid #000000' : 'none'}`,
            `border-right:${cell.border?.right === true ? '1px solid #000000' : 'none'}`,
            `border-bottom:${cell.border?.bottom === true ? '1px solid #000000' : 'none'}`,
            `border-left:${cell.border?.left === true ? '1px solid #000000' : 'none'}`,
          ];

          const rowSpanAttr = spanRows > 1 ? ` rowspan="${spanRows}"` : '';
          const colSpanAttr = spanCols > 1 ? ` colspan="${spanCols}"` : '';
          const text = escapeHtml(cell.value || '').replace(/\n/g, '<br />');

          const elementsHtml = (cell.elements || [])
            .map((element) => renderElementPreviewHtml(element.type, element.label, element.placeholder))
            .join('');

          return `<td${rowSpanAttr}${colSpanAttr} style="${styleParts.join(';')}"><div class="cell-inner" style="align-items:${alignItems};justify-content:${justifyContent};text-align:${horizontalAlign}"><div class="chip-row" style="justify-content:${alignItems}">${elementsHtml}</div><div class="text">${text || '&nbsp;'}</div></div></td>`;
        })
        .join('');
      return `<tr>${rowCells}</tr>`;
    })
    .join('');

  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Sheet Preview</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 24px;
      font-family: Arial, Helvetica, sans-serif;
      background: #f4f7fb;
      color: #2f343b;
      display: flex;
      justify-content: center;
      align-items: flex-start;
    }
    .doc-wrap {
      display: inline-block;
      border: 1px solid #cfd8e3;
      background: #fff;
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.08);
    }
    table {
      border-collapse: collapse;
      border-spacing: 0;
    }
    td {
      vertical-align: top;
      padding: 0;
    }
    .cell-inner {
      height: 100%;
      min-height: 100%;
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 6px 8px;
    }
    .chip-row {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      min-height: 18px;
      align-items: center;
    }
    .element-control {
      height: 24px;
      border-radius: 4px;
      border: 1px solid #9fb0c3;
      padding: 0 8px;
      font-size: 12px;
      line-height: 1;
      background: #ffffff;
      color: #2f343b;
    }
    .element-input {
      width: 120px;
    }
    .element-textarea {
      width: 160px;
      min-height: 56px;
      resize: vertical;
      padding: 6px 8px;
      line-height: 1.3;
    }
    .element-select {
      width: 140px;
    }
    .element-check-wrap {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #2f343b;
      min-height: 24px;
    }
    .element-check {
      margin: 0;
    }
    .element-action-button {
      border-color: #cfd8e3;
      background: #ffffff;
      color: #2f343b;
      font-weight: 600;
      cursor: pointer;
    }
    .chip {
      display: inline-flex;
      align-items: center;
      padding: 1px 8px;
      border-radius: 4px;
      border: 1px solid #7f92ab;
      background: linear-gradient(180deg, #6a7f9b 0%, #5a6e88 100%);
      color: #f4f8ff;
      font-size: 12px;
      line-height: 1.3;
      white-space: nowrap;
    }
    .chip-select {
      border-color: #5c9b6d;
      background: linear-gradient(180deg, #5fae78 0%, #4a9361 100%);
    }
    .chip-view {
      border-color: #c3a143;
      background: linear-gradient(180deg, #d7b757 0%, #c6a44a 100%);
      color: #2f2a18;
    }
    .chip-action {
      border-color: #2f66c8;
      background: linear-gradient(180deg, #4e86ea 0%, #376fce 100%);
      color: #f3f8ff;
    }
    .text {
      font-size: 13px;
      line-height: 1.4;
      white-space: pre-wrap;
      word-break: break-word;
      min-height: 17px;
    }
  </style>
</head>
<body>
  <div class="doc-wrap">
    <table>
      <tbody>
        ${tableRows}
      </tbody>
    </table>
  </div>
</body>
</html>`;
};

const SheetPreview: React.FC<SheetPreviewProps> = ({ cells, colWidths, rowHeights }) => {
  const [isOpen, setIsOpen] = useState(false);
  // 시트 데이터가 바뀔 때만 미리보기 HTML을 다시 계산합니다.
  const htmlDocument = useMemo(() => buildPreviewHtml(cells, colWidths, rowHeights), [cells, colWidths, rowHeights]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        className="sheet-preview-fab"
        onClick={() => setIsOpen(true)}
        aria-label="HTML 미리보기 열기"
      >
        미리보기
      </button>

      {isOpen && (
        <div className="sheet-preview-overlay" onClick={() => setIsOpen(false)}>
          <div className="sheet-preview-modal" onClick={(event) => event.stopPropagation()}>
            <div className="sheet-preview-header">
              <h3 className="sheet-preview-title">결재 양식 미리보기</h3>
              <button
                type="button"
                className="sheet-preview-close"
                onClick={() => setIsOpen(false)}
                aria-label="미리보기 닫기"
              >
                ×
              </button>
            </div>
            <div className="sheet-preview-body">
              <iframe title="sheet-html-preview" className="sheet-preview-frame" srcDoc={htmlDocument} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SheetPreview;
