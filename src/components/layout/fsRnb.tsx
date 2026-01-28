import React from 'react';
import { BorderMode, HorizontalAlign, InspectedElement, VerticalAlign } from '../fsFormStudio.types';

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
  autoHelpElement: { label: string; categoryLabel: string; category: 'drafter' | 'company' | 'document' } | null;
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
  borderLineWidth: string;
  borderLineStyle: string;
  borderLineColor: string;
  onBorderLineWidthChange: (value: string) => void;
  onBorderLineStyleChange: (value: string) => void;
  onBorderLineColorChange: (value: string) => void;
  onFieldChange: (field: 'label' | 'primaryKey' | 'name' | 'customId' | 'placeholder', value: string) => void;
  onSyncSelectItems: (items: Array<{ id: string; label: string; isDefault: boolean }>) => void;
  onSave: () => void;
  canSave: boolean;
  onCancel: () => void;
}

const FsRnb: React.FC<RNBProps> = ({
  inspectedElement,
  autoHelpElement,
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
  borderLineWidth,
  borderLineStyle,
  borderLineColor,
  onBorderLineWidthChange,
  onBorderLineStyleChange,
  onBorderLineColorChange,
  onFieldChange,
  onSyncSelectItems,
  onSave,
  canSave,
  onCancel,
}) => {
  const fontColorInputRef = React.useRef<HTMLInputElement | null>(null);
  const fontBgInputRef = React.useRef<HTMLInputElement | null>(null);
  const borderColorMenuRef = React.useRef<HTMLDivElement | null>(null);
  const quickColors = ['#ffffff', '#eef1f5', '#dce4f2', '#cfe8dc', '#ece4a8', '#ffe3e3', '#fff3bf', '#d3f9d8'];
  const showGroupSection = inspectedElement?.type === 'select' || inspectedElement?.type === 'radio';
  const [isBorderColorMenuOpen, setIsBorderColorMenuOpen] = React.useState(false);
  const [itemRows, setItemRows] = React.useState<Array<{ rowId: string; itemId: string; label: string; isDefault: boolean }>>([
    { rowId: 'item-1', itemId: '', label: '', isDefault: true },
  ]);
  const borderStyleOptions = [
    { value: 'solid', sample: '──────' },
    { value: 'dotted', sample: '······' },
    { value: 'dashed', sample: '— — —' },
    { value: 'double', sample: '══════' },
  ];

  React.useEffect(() => {
    const fromElement = (inspectedElement?.options || []).map((opt, idx) => ({
      rowId: `item-${inspectedElement?.elementId || 'x'}-${idx}`,
      itemId: opt.id || '',
      label: opt.label || '',
      isDefault: !!opt.isDefault,
    }));
    if (fromElement.length > 0) {
      const hasDefault = fromElement.some((item) => item.isDefault);
      setItemRows(hasDefault ? fromElement : fromElement.map((item, idx) => ({ ...item, isDefault: idx === 0 })));
      return;
    }
    setItemRows([{ rowId: 'item-1', itemId: '', label: '', isDefault: true }]);
  }, [inspectedElement?.elementId]);

  React.useEffect(() => {
    if (inspectedElement?.type !== 'select') return;
    onSyncSelectItems(
      itemRows.map((row, idx) => ({
        id: row.itemId.trim() || `option_${idx + 1}`,
        label: row.label.trim(),
        isDefault: !!row.isDefault,
      }))
    );
  }, [inspectedElement?.type, itemRows, onSyncSelectItems]);

  React.useEffect(() => {
    if (!isBorderColorMenuOpen) return;
    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!borderColorMenuRef.current?.contains(target)) setIsBorderColorMenuOpen(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [isBorderColorMenuOpen]);

  if (autoHelpElement) {
    return (
      <div className="rnb-panel">
        <div className="rnb-section">
          <div className="rnb-auto-help-title">자동 입력 도움말</div>
          <div className={`rnb-auto-help-chip rnb-auto-help-chip-${autoHelpElement.category}`}>
            {autoHelpElement.categoryLabel} &nbsp; → &nbsp; {autoHelpElement.label}
          </div>
          <p className="rnb-auto-help-text">
            자동 입력 요소는 기안 시 해당하는 값으로 치환되는 요소로서, 속성 편집은 제공되지 않습니다.
          </p>
          <p className="rnb-auto-help-text">
            위치를 변경하려면 셀 편집에서 삭제 후 원하는 셀에 다시 추가하세요.
          </p>
        </div>
      </div>
    );
  }

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
          <label className="rnb-label">셀 테두리 스타일</label>
          <div className="rnb-border-style-row">
            <select
              className="rnb-border-style-select"
              value={borderLineWidth}
              onChange={(e) => onBorderLineWidthChange(e.target.value)}
              title="선 두께"
            >
              {['1px', '2px', '3px', '4px', '5px'].map((width) => (
                <option key={width} value={width}>{width}</option>
              ))}
            </select>
            <select
              className="rnb-border-style-select"
              value={borderLineStyle}
              onChange={(e) => onBorderLineStyleChange(e.target.value)}
              title="선 스타일"
            >
              {borderStyleOptions.map((style) => (
                <option key={style.value} value={style.value}>{style.sample}</option>
              ))}
            </select>
            <div className="rnb-border-color-wrap" ref={borderColorMenuRef}>
              <button
                type="button"
                className="rnb-border-color-trigger"
                onClick={() => setIsBorderColorMenuOpen((prev) => !prev)}
                title="선 색상"
              >
                <span className="rnb-border-color-dot" style={{ backgroundColor: borderLineColor }} />
              </button>
              {isBorderColorMenuOpen && (
                <div className="rnb-border-color-menu">
                  <button
                    type="button"
                    className="rnb-border-color-default-btn"
                    onClick={() => {
                      onBorderLineColorChange('#c8d5e8');
                      setIsBorderColorMenuOpen(false);
                    }}
                  >
                    기본값
                  </button>
                  <div className="rnb-border-color-grid">
                    {['#eef1f5', '#dce4f2', '#cfe8dc', '#ece4a8', '#ffe3e3', '#fff3bf'].map((color) => (
                      <button
                        key={color}
                        type="button"
                        className="rnb-border-color-chip"
                        style={{ backgroundColor: color }}
                        onClick={() => {
                          onBorderLineColorChange(color);
                          setIsBorderColorMenuOpen(false);
                        }}
                        title={color}
                      />
                    ))}
                  </div>
                  <input
                    type="color"
                    className="rnb-border-color-input"
                    value={borderLineColor}
                    onChange={(e) => onBorderLineColorChange(e.target.value)}
                  />
                </div>
              )}
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
        <div className="rnb-section-title">속성</div>
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
      </div>

      <div className="rnb-section">
        <div className="rnb-section-title">스타일</div>
        <div className="rnb-placeholder">스타일 옵션 준비 중</div>
      </div>

      {showGroupSection && (
        <div className="rnb-section">
          <div className="rnb-section-header">
            <div className="rnb-section-title">그룹 항목</div>
            <button
              type="button"
              className="rnb-mini-btn"
              onClick={() =>
                setItemRows((prev) => [
                  ...prev,
                  {
                    rowId: `item-${Date.now()}-${prev.length}`,
                    itemId: '',
                    label: '',
                    isDefault: false,
                  },
                ])
              }
            >
              추가
            </button>
          </div>
          <div className="rnb-item-wrap">
            <table className="rnb-item-table">
              <thead>
                <tr>
                  {inspectedElement.type === 'select' ? (
                    <>
                      <th>ID</th>
                      <th>항목명</th>
                      <th aria-label="기본값" />
                    </>
                  ) : (
                    <>
                      <th>ID</th>
                      <th>항목명</th>
                    </>
                  )}
                  <th aria-label="삭제" />
                </tr>
              </thead>
              <tbody>
                {itemRows.map((row) => (
                  <tr key={row.rowId}>
                    <td>
                      <input
                        className="rnb-item-input"
                        value={row.itemId}
                        onChange={(e) =>
                          setItemRows((prev) =>
                            prev.map((item) => (item.rowId === row.rowId ? { ...item, itemId: e.target.value } : item))
                          )
                        }
                      />
                    </td>
                    <td>
                      <input
                        className="rnb-item-input"
                        value={row.label}
                        onChange={(e) =>
                          setItemRows((prev) =>
                            prev.map((item) => (item.rowId === row.rowId ? { ...item, label: e.target.value } : item))
                          )
                        }
                      />
                    </td>
                    {inspectedElement.type === 'select' && (
                      <td className="rnb-item-default-cell">
                        <input
                          type="radio"
                          name={`select-default-${inspectedElement.elementId}`}
                          checked={row.isDefault}
                          title="기본값"
                          aria-label="기본값"
                          onChange={() =>
                            setItemRows((prev) =>
                              prev.map((item) => ({ ...item, isDefault: item.rowId === row.rowId }))
                            )
                          }
                        />
                      </td>
                    )}
                    <td className="rnb-item-delete-cell">
                      <button
                        type="button"
                        className="rnb-item-delete-btn"
                        onClick={() => {
                          setItemRows((prev) => {
                            const next = prev.filter((item) => item.rowId !== row.rowId);
                            if (next.length === 0) return prev;
                            if (inspectedElement.type !== 'select') return next;
                            const hasDefault = next.some((item) => item.isDefault);
                            if (hasDefault) return next;
                            return next.map((item, idx) => ({ ...item, isDefault: idx === 0 }));
                          });
                        }}
                        aria-label="항목 삭제"
                        title="항목 삭제"
                      >
                          <svg viewBox="0 0 16 16" aria-hidden="true">
                            <path d="M3.2 4.4h9.6" />
                            <path d="M6.1 4.4V3.2h3.8v1.2" />
                            <rect x="4.7" y="4.9" width="6.6" height="8" rx="1" fill="none" />
                            <line x1="7" y1="6.6" x2="7" y2="11.3" />
                            <line x1="9" y1="6.6" x2="9" y2="11.3" />
                          </svg>
                        </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="rnb-actions">
        <button
          type="button"
          className="rnb-action-button primary"
          onClick={onSave}
          disabled={!canSave}
        >
          속성 저장
        </button>
        <button type="button" className="rnb-action-button" onClick={onCancel}>취소</button>
      </div>
    </div>
  );
};

export default FsRnb;
