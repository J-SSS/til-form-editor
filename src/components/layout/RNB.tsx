import React from 'react';
import { BorderMode, HorizontalAlign, InspectedElement, RnbOpenSections, VerticalAlign } from '../SpreadsheetEditor.types';

interface CellQuickMenuState {
  selectionLabel: string;
  bold: boolean;
  italic: boolean;
  strikeThrough: boolean;
  horizontalAlign: HorizontalAlign;
  verticalAlign: VerticalAlign;
  background: string;
  fontSize: string;
  fontColor: string;
  fontBackground: string;
}

interface RNBProps {
  inspectedElement: InspectedElement | null;
  cellQuickMenu: CellQuickMenuState;
  onCellToggleTextStyle: (style: 'bold' | 'italic' | 'strikeThrough') => void;
  onCellAlign: (axis: 'horizontal' | 'vertical', value: HorizontalAlign | VerticalAlign) => void;
  onCellBackground: (color: string) => void;
  onCellBorder: (mode: BorderMode) => void;
  onCellFontSize: (fontSize: string) => void;
  onCellFontColor: (fontColor: string) => void;
  onCellFontBackground: (fontBackground: string) => void;
  onAddRow: () => void;
  onAddCol: () => void;
  onDeleteRow: () => void;
  onDeleteCol: () => void;
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
  cellQuickMenu,
  onCellToggleTextStyle,
  onCellAlign,
  onCellBackground,
  onCellBorder,
  onCellFontSize,
  onCellFontColor,
  onCellFontBackground,
  onAddRow,
  onAddCol,
  onDeleteRow,
  onDeleteCol,
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
          <span className="rnb-cell-header-icon" aria-hidden="true">⚙</span>
          <span className="rnb-cell-header-title">셀 속성 ({cellQuickMenu.selectionLabel})</span>
        </div>

        <div className="rnb-cell-block">
          <label className="rnb-label">셀 추가, 삭제</label>
          <div className="rnb-mini-actions">
            <button type="button" className="rnb-mini-btn" onClick={onAddRow}>행 +</button>
            <button type="button" className="rnb-mini-btn" onClick={onAddCol}>열 +</button>
            <button type="button" className="rnb-mini-btn" onClick={onDeleteRow}>행 -</button>
            <button type="button" className="rnb-mini-btn" onClick={onDeleteCol}>열 -</button>
          </div>
        </div>

        <div className="rnb-cell-block">
          <label className="rnb-label">셀  테두리</label>
          <div className="rnb-border-stack">
            <div className="rnb-border-row rnb-border-row-2">
              <button type="button" className="rnb-border-btn" onClick={() => onCellBorder('all')} title="전체 테두리">
                <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2" y="2" width="12" height="12" /><line x1="8" y1="2" x2="8" y2="14" /><line x1="2" y1="8" x2="14" y2="8" /></svg>
              </button>
              <button type="button" className="rnb-border-btn" onClick={() => onCellBorder('outer')} title="외곽 테두리">
                <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2" y="2" width="12" height="12" /></svg>
              </button>
            </div>
            <div className="rnb-border-row rnb-border-row-4">
              <button type="button" className="rnb-border-btn" onClick={() => onCellBorder('top')} title="상단 테두리">
                <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2" y="2" width="12" height="12" strokeOpacity="0.35" /><line x1="2" y1="2" x2="14" y2="2" /></svg>
              </button>
              <button type="button" className="rnb-border-btn" onClick={() => onCellBorder('bottom')} title="하단 테두리">
                <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2" y="2" width="12" height="12" strokeOpacity="0.35" /><line x1="2" y1="14" x2="14" y2="14" /></svg>
              </button>
              <button type="button" className="rnb-border-btn" onClick={() => onCellBorder('left')} title="왼쪽 테두리">
                <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2" y="2" width="12" height="12" strokeOpacity="0.35" /><line x1="2" y1="2" x2="2" y2="14" /></svg>
              </button>
              <button type="button" className="rnb-border-btn" onClick={() => onCellBorder('right')} title="오른쪽 테두리">
                <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2" y="2" width="12" height="12" strokeOpacity="0.35" /><line x1="14" y1="2" x2="14" y2="14" /></svg>
              </button>
            </div>
            <div className="rnb-border-row rnb-border-row-1">
              <button type="button" className="rnb-border-btn" onClick={() => onCellBorder('none')} title="테두리 제거">
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
              className="rnb-font-size"
              value={cellQuickMenu.fontSize}
              onChange={(e) => onCellFontSize(e.target.value)}
            >
              {['8px', '9px', '10px', '11px', '12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px'].map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
            <button
              type="button"
              className="rnb-font-color-btn"
              onClick={() => fontColorInputRef.current?.click()}
              style={{ color: cellQuickMenu.fontColor }}
              title="글자색"
            >
              A
            </button>
            <button
              type="button"
              className="rnb-font-bg-btn"
              onClick={() => fontBgInputRef.current?.click()}
              style={{ backgroundColor: cellQuickMenu.fontBackground }}
              title="글자 배경"
            />
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
      <div className="rnb-tabs">
        <button className="rnb-tab active" type="button">Properties</button>
        <button className="rnb-tab" type="button">Events</button>
      </div>

      <div className="rnb-section">
        <button className="rnb-section-toggle" type="button" onClick={() => onToggleSection('propertiesMain')}>
          <span className="rnb-section-title">Properties</span>
          <span className="rnb-chevron" aria-hidden="true">{rnbOpenSections.propertiesMain ? 'v' : '>'}</span>
        </button>
        {rnbOpenSections.propertiesMain && (
          <>
            <label className="rnb-label">LABEL</label>
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
        <button className="rnb-section-toggle" type="button" onClick={() => onToggleSection('events')}>
          <span className="rnb-section-title">Events</span>
          <span className="rnb-chevron" aria-hidden="true">{rnbOpenSections.events ? 'v' : '>'}</span>
        </button>
        {rnbOpenSections.events && <div className="rnb-placeholder">No events</div>}
      </div>
      <div className="rnb-section">
        <button className="rnb-section-toggle" type="button" onClick={() => onToggleSection('action')}>
          <span className="rnb-section-title">Action</span>
          <span className="rnb-chevron" aria-hidden="true">{rnbOpenSections.action ? 'v' : '>'}</span>
        </button>
        {rnbOpenSections.action && <div className="rnb-placeholder">No action</div>}
      </div>
      <div className="rnb-section">
        <button className="rnb-section-toggle" type="button" onClick={() => onToggleSection('identification')}>
          <span className="rnb-section-title">Identification</span>
          <span className="rnb-chevron" aria-hidden="true">{rnbOpenSections.identification ? 'v' : '>'}</span>
        </button>
        {rnbOpenSections.identification && <div className="rnb-placeholder">No identification</div>}
      </div>

      <div className="rnb-actions">
        <button type="button" className="rnb-action-button primary" onClick={onSave} disabled={!canSave}>속성 저장</button>
        <button type="button" className="rnb-action-button" onClick={onCancel}>취소</button>
      </div>
    </div>
  );
};

export default RNB;
