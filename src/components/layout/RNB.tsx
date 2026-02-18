import React from 'react';
import { BorderMode, HorizontalAlign, InspectedElement, RnbOpenSections, VerticalAlign } from '../SpreadsheetEditor.types';

interface CellQuickMenuState {
  selectionLabel: string;
  selectionInfo: string;
  bold: boolean;
  italic: boolean;
  strikeThrough: boolean;
  horizontalAlign: HorizontalAlign;
  verticalAlign: VerticalAlign;
  background: string;
  fontFamily: string;
  fontSize: string;
  fontColor: string;
  fontBackground: string;
}

interface RNBProps {
  inspectedElement: InspectedElement | null;
  isCellEditing: boolean;
  canMergeCells: boolean;
  canUnmergeCells: boolean;
  cellQuickMenu: CellQuickMenuState;
  onCellToggleTextStyle: (style: 'bold' | 'italic' | 'strikeThrough') => void;
  onCellAlign: (axis: 'horizontal' | 'vertical', value: HorizontalAlign | VerticalAlign) => void;
  onCellBackground: (color: string) => void;
  onCellBorder: (mode: BorderMode) => void;
  onCellFontFamily: (fontFamily: string) => void;
  onCellFontSize: (fontSize: string) => void;
  onCellFontColor: (fontColor: string) => void;
  onCellFontBackground: (fontBackground: string) => void;
  onAddRow: () => void;
  onAddCol: () => void;
  onDeleteRow: () => void;
  onDeleteCol: () => void;
  onMergeCells: () => void;
  onUnmergeCells: () => void;
  onClearSelectionContents: () => void;
  rnbOpenSections: RnbOpenSections;
  onToggleSection: (key: keyof RnbOpenSections) => void;
  onFieldChange: (field: 'label' | 'primaryKey' | 'name' | 'customId' | 'placeholder', value: string) => void;
  onSave: () => void;
  canSave: boolean;
  onCancel: () => void;
}

const RNB: React.FC<RNBProps> = ({
  inspectedElement,
  isCellEditing,
  canMergeCells,
  canUnmergeCells,
  cellQuickMenu,
  onCellToggleTextStyle,
  onCellAlign,
  onCellBackground,
  onCellBorder,
  onCellFontFamily,
  onCellFontSize,
  onCellFontColor,
  onCellFontBackground,
  onAddRow,
  onAddCol,
  onDeleteRow,
  onDeleteCol,
  onMergeCells,
  onUnmergeCells,
  onClearSelectionContents,
  rnbOpenSections,
  onToggleSection,
  onFieldChange,
  onSave,
  canSave,
  onCancel,
}) => {
  const fontColorInputRef = React.useRef<HTMLInputElement | null>(null);
  const fontBgInputRef = React.useRef<HTMLInputElement | null>(null);
  const quickColors = ['#ffffff', '#eef1f5', '#dce4f2', '#cfe8dc', '#ece4a8', '#ffe3e3', '#fff3bf', '#d3f9d8'];

  if (!inspectedElement) {
    return (
      <div className="rnb-panel rnb-cell-panel">
        <div className="rnb-cell-header">
          <span className="rnb-cell-header-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="3.1" />
              <path d="M12 3.7v2.2" />
              <path d="M12 18.1v2.2" />
              <path d="m5.8 6 1.6 1.6" />
              <path d="m16.6 16.8 1.6 1.6" />
              <path d="M3.7 12h2.2" />
              <path d="M18.1 12h2.2" />
              <path d="m5.8 18 1.6-1.6" />
              <path d="m16.6 7.2 1.6-1.6" />
            </svg>
          </span>
          <div className="rnb-cell-header-text">
            <span className="rnb-cell-header-title">셀 속성 ({cellQuickMenu.selectionLabel})</span>
            <span className="rnb-cell-header-selection">{cellQuickMenu.selectionInfo}</span>
          </div>
        </div>

        <div className="rnb-cell-block">
          <label className="rnb-label">셀 병합</label>
          <div className="rnb-mini-actions">
            <button type="button" className="rnb-mini-btn" onClick={onMergeCells} title="셀 병합" disabled={isCellEditing || !canMergeCells}>
              병합
            </button>
            <button type="button" className="rnb-mini-btn" onClick={onUnmergeCells} title="셀 병합 해제" disabled={isCellEditing || !canUnmergeCells}>
              해제
            </button>
          </div>
        </div>

        <div className="rnb-cell-block">
          <label className="rnb-label">셀 추가, 삭제</label>
          <div className="rnb-mini-actions">
            <button type="button" className="rnb-mini-btn" onClick={onAddRow} disabled={isCellEditing}>행 +</button>
            <button type="button" className="rnb-mini-btn" onClick={onAddCol} disabled={isCellEditing}>열 +</button>
            <button type="button" className="rnb-mini-btn" onClick={onDeleteRow} disabled={isCellEditing}>행 -</button>
            <button type="button" className="rnb-mini-btn" onClick={onDeleteCol} disabled={isCellEditing}>열 -</button>
          </div>
        </div>

        <div className="rnb-cell-block">
          <label className="rnb-label">셀  테두리</label>
          <div className="rnb-border-stack">
            <div className="rnb-border-row rnb-border-row-2">
              <button type="button" className="rnb-border-btn" onClick={() => onCellBorder('all')} title="전체 테두리" disabled={isCellEditing}>
                <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2" y="2" width="12" height="12" /><line x1="8" y1="2" x2="8" y2="14" /><line x1="2" y1="8" x2="14" y2="8" /></svg>
              </button>
              <button type="button" className="rnb-border-btn" onClick={() => onCellBorder('outer')} title="외곽 테두리" disabled={isCellEditing}>
                <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2" y="2" width="12" height="12" /></svg>
              </button>
            </div>
            <div className="rnb-border-row rnb-border-row-4">
              <button type="button" className="rnb-border-btn" onClick={() => onCellBorder('top')} title="상단 테두리" disabled={isCellEditing}>
                <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2" y="2" width="12" height="12" strokeOpacity="0.35" /><line x1="2" y1="2" x2="14" y2="2" /></svg>
              </button>
              <button type="button" className="rnb-border-btn" onClick={() => onCellBorder('bottom')} title="하단 테두리" disabled={isCellEditing}>
                <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2" y="2" width="12" height="12" strokeOpacity="0.35" /><line x1="2" y1="14" x2="14" y2="14" /></svg>
              </button>
              <button type="button" className="rnb-border-btn" onClick={() => onCellBorder('left')} title="왼쪽 테두리" disabled={isCellEditing}>
                <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2" y="2" width="12" height="12" strokeOpacity="0.35" /><line x1="2" y1="2" x2="2" y2="14" /></svg>
              </button>
              <button type="button" className="rnb-border-btn" onClick={() => onCellBorder('right')} title="오른쪽 테두리" disabled={isCellEditing}>
                <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2" y="2" width="12" height="12" strokeOpacity="0.35" /><line x1="14" y1="2" x2="14" y2="14" /></svg>
              </button>
            </div>
            <div className="rnb-border-row rnb-border-row-1">
              <button type="button" className="rnb-border-btn" onClick={() => onCellBorder('none')} title="테두리 제거" disabled={isCellEditing}>
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <rect x="2" y="2" width="12" height="12" stroke="#b8c2ce" />
                  <line x1="3" y1="13" x2="13" y2="3" stroke="#e03131" strokeWidth="1.7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="rnb-cell-block">
          <label className="rnb-label">셀 배경색</label>
          <div className="rnb-color-row">
            <button
              type="button"
              className={`rnb-color-chip rnb-color-chip-none ${cellQuickMenu.background === '' ? 'active' : ''}`}
              onClick={() => onCellBackground('')}
              title="색 없음"
              aria-label="색 없음"
            >
              <span className="rnb-color-chip-none-slash" aria-hidden="true" />
            </button>
            {quickColors.map((color) => (
              <button
                key={color}
                type="button"
                className={`rnb-color-chip ${cellQuickMenu.background === color ? 'active' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => onCellBackground(color)}
                title={color}
              />
            ))}
          </div>
        </div>

        <div className="rnb-divider" aria-hidden="true" />

        <div className="rnb-cell-block">
          <label className="rnb-label">폰트</label>
          <div className="rnb-font-row">
            <select
              className="rnb-font-family"
              value={cellQuickMenu.fontFamily}
              onChange={(e) => onCellFontFamily(e.target.value)}
            >
              {['Noto Sans KR', 'Malgun Gothic', 'Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Courier New'].map((family) => (
                <option key={family} value={family}>{family}</option>
              ))}
            </select>
            <select
              className="rnb-font-size"
              value={cellQuickMenu.fontSize}
              onChange={(e) => onCellFontSize(e.target.value)}
            >
              {['8px', '9px', '10px', '11px', '12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px'].map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>
          <div className="rnb-font-row">
            <button
              type="button"
              className="rnb-font-color-btn"
              onClick={() => fontColorInputRef.current?.click()}
              title="글자색"
            >
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="M5.2 12.4L8 4.4L10.8 12.4" />
                <line x1="6.1" y1="10" x2="9.9" y2="10" />
                <line x1="3.2" y1="14" x2="12.8" y2="14" style={{ stroke: cellQuickMenu.fontColor, strokeWidth: 2 }} />
              </svg>
            </button>
            <button
              type="button"
              className="rnb-font-bg-btn"
              onClick={() => fontBgInputRef.current?.click()}
              title="글자 배경"
            >
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="M5.2 8.4L8 3.6L10.8 8.4" />
                <line x1="6.1" y1="7.2" x2="9.9" y2="7.2" />
                <rect x="2.8" y="10.2" width="10.4" height="3.4" rx="0.8" fill={cellQuickMenu.fontBackground} stroke="#8da0b3" />
              </svg>
            </button>
            <input
              ref={fontColorInputRef}
              type="color"
              className="rnb-hidden-color-input"
              value={cellQuickMenu.fontColor}
              onChange={(e) => onCellFontColor(e.target.value)}
            />
            <input
              ref={fontBgInputRef}
              type="color"
              className="rnb-hidden-color-input"
              value={cellQuickMenu.fontBackground}
              onChange={(e) => onCellFontBackground(e.target.value)}
            />
          </div>
        </div>

        <div className="rnb-cell-block">
          <label className="rnb-label">서식</label>
          <div className="rnb-segment">
            <button
              type="button"
              className={`rnb-segment-btn ${cellQuickMenu.bold ? 'active' : ''}`}
              onClick={() => onCellToggleTextStyle('bold')}
              title="굵게"
            >
              B
            </button>
            <button
              type="button"
              className={`rnb-segment-btn ${cellQuickMenu.italic ? 'active' : ''}`}
              onClick={() => onCellToggleTextStyle('italic')}
              title="이탤릭"
            >
              I
            </button>
            <button
              type="button"
              className={`rnb-segment-btn ${cellQuickMenu.strikeThrough ? 'active' : ''}`}
              onClick={() => onCellToggleTextStyle('strikeThrough')}
              title="취소선"
            >
              U
            </button>
          </div>
        </div>

        <div className="rnb-cell-block">
          <label className="rnb-label">정렬</label>
          <div className="rnb-segment">
            <button
              type="button"
              className={`rnb-segment-btn ${cellQuickMenu.verticalAlign === 'top' ? 'active' : ''}`}
              onClick={() => onCellAlign('vertical', 'top')}
              title="상단 정렬"
            >
              ⤒
            </button>
            <button
              type="button"
              className={`rnb-segment-btn ${cellQuickMenu.verticalAlign === 'middle' ? 'active' : ''}`}
              onClick={() => onCellAlign('vertical', 'middle')}
              title="중단 정렬"
            >
              ↕
            </button>
            <button
              type="button"
              className={`rnb-segment-btn ${cellQuickMenu.verticalAlign === 'bottom' ? 'active' : ''}`}
              onClick={() => onCellAlign('vertical', 'bottom')}
              title="하단 정렬"
            >
              ⤓
            </button>
          </div>
          <div className="rnb-segment">
            <button
              type="button"
              className={`rnb-segment-btn ${cellQuickMenu.horizontalAlign === 'left' ? 'active' : ''}`}
              onClick={() => onCellAlign('horizontal', 'left')}
              title="왼쪽 정렬"
            >
              ☰
            </button>
            <button
              type="button"
              className={`rnb-segment-btn ${cellQuickMenu.horizontalAlign === 'center' ? 'active' : ''}`}
              onClick={() => onCellAlign('horizontal', 'center')}
              title="가운데 정렬"
            >
              ☷
            </button>
            <button
              type="button"
              className={`rnb-segment-btn ${cellQuickMenu.horizontalAlign === 'right' ? 'active' : ''}`}
              onClick={() => onCellAlign('horizontal', 'right')}
              title="오른쪽 정렬"
            >
              ☰
            </button>
          </div>
        </div>

        <div className="rnb-danger-zone">
          <div className="rnb-danger-title">위험 구역</div>
          <button type="button" className="rnb-danger-button" onClick={onClearSelectionContents}>
            선택된 내용 삭제
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rnb-panel">
      <div className="rnb-section">
        <button className="rnb-section-toggle" type="button" onClick={() => onToggleSection('propertiesMain')}>
          <span className="rnb-section-title">속성</span>
          <span className="rnb-chevron" aria-hidden="true">{rnbOpenSections.propertiesMain ? 'v' : '>'}</span>
        </button>
        {rnbOpenSections.propertiesMain && (
          <>
            <label className="rnb-label">이름</label>
            <input
              className="rnb-input"
              value={inspectedElement.label}
              onChange={(e) => onFieldChange('label', e.target.value)}
            />
            <label className="rnb-label">DESCRPITON</label>
            <input
              className="rnb-input"
              value={inspectedElement.primaryKey}
              onChange={(e) => onFieldChange('primaryKey', e.target.value)}
            />
            <label className="rnb-label">NAME</label>
            <input
              className="rnb-input"
              value={inspectedElement.name}
              onChange={(e) => onFieldChange('name', e.target.value)}
            />
            <label className="rnb-label">ID</label>
            <input
              className="rnb-input"
              value={inspectedElement.customId}
              onChange={(e) => onFieldChange('customId', e.target.value)}
            />
            {inspectedElement.type === 'text' && (
              <>
                <label className="rnb-label">PLACEHOLDER</label>
                <input
                  className="rnb-input"
                  value={inspectedElement.placeholder || ''}
                  onChange={(e) => onFieldChange('placeholder', e.target.value)}
                />
              </>
            )}
          </>
        )}
      </div>

      <div className="rnb-section">
        <button className="rnb-section-toggle" type="button" onClick={() => onToggleSection('action')}>
          <span className="rnb-section-title">스타일</span>
          <span className="rnb-chevron" aria-hidden="true">{rnbOpenSections.action ? 'v' : '>'}</span>
        </button>
        {rnbOpenSections.action && <div className="rnb-placeholder">스타일 옵션 준비 중</div>}
      </div>

      <div className="rnb-actions">
        <button type="button" className="rnb-action-button primary" onClick={onSave} disabled={!canSave}>속성 저장</button>
        <button type="button" className="rnb-action-button" onClick={onCancel}>취소</button>
      </div>
    </div>
  );
};

export default RNB;
