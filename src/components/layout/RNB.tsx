import React from 'react';
import { InspectedElement, RnbOpenSections } from '../SpreadsheetEditor.types';

interface RNBProps {
  inspectedElement: InspectedElement | null;
  rnbOpenSections: RnbOpenSections;
  onToggleSection: (key: keyof RnbOpenSections) => void;
  onFieldChange: (field: 'primaryKey' | 'name' | 'customId' | 'placeholder', value: string) => void;
  onSave: () => void;
  canSave: boolean;
  onCancel: () => void;
}

const RNB: React.FC<RNBProps> = ({
  inspectedElement,
  rnbOpenSections,
  onToggleSection,
  onFieldChange,
  onSave,
  canSave,
  onCancel,
}) => {
  if (!inspectedElement) {
    return <div className="rnb-empty">엘리먼트를 선택하면 속성이 표시됩니다.</div>;
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

