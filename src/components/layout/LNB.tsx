import React, { useEffect, useRef, useState } from 'react';
import { LnbGroup } from '../SpreadsheetEditor.types';
import { clearJsEditorPopupBridge, openJsEditorPopup } from './JsEditorPopup';

type LnbTabKey = '기본 설정' | '자동 입력' | '선택 입력' | '커스텀 항목';

interface LNBProps {
  lnbTab: LnbTabKey;
  lnbGroups: LnbGroup[];
  onChangeTab: (tab: LnbTabKey) => void;
  onOpenSettings: () => void;
}

const LNB: React.FC<LNBProps> = ({ lnbTab, lnbGroups, onChangeTab, onOpenSettings }) => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formEnabled, setFormEnabled] = useState<'yes' | 'no'>('yes');
  const [formType, setFormType] = useState<'normal' | 'linked'>('normal');
  const jsPopupRef = useRef<Window | null>(null);
  const jsEditorValueRef = useRef<string>('// JavaScript\n');

  useEffect(() => {
    setOpenSections((prev) => {
      const next: Record<string, boolean> = {};
      lnbGroups.forEach((group) => {
        next[group.title] = prev[group.title] ?? true;
      });
      return next;
    });
  }, [lnbGroups]);

  const toggleSection = (title: string) => {
    setOpenSections((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const openJsPopup = () => {
    openJsEditorPopup({
      popupRef: jsPopupRef,
      editorValueRef: jsEditorValueRef,
    });
  };
  const isClipButtonEnabled = lnbTab === '기본 설정' && formType === 'linked';

  useEffect(() => {
    return () => {
      clearJsEditorPopupBridge();
    };
  }, []);

  const tabButtons: { key: LnbTabKey; label: string; icon: React.ReactNode }[] = [
    {
      key: '기본 설정',
      label: '기본 설정',
      icon: (
        <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
          <rect x="4.5" y="4.5" width="15" height="15" rx="2.2" />
          <line x1="4.5" y1="9.2" x2="19.5" y2="9.2" />
          <line x1="10" y1="9.2" x2="10" y2="19.5" />
        </svg>
      ),
    },
    {
      key: '자동 입력',
      label: '자동 입력',
      icon: (
        <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
          <text x="12" y="12.2" textAnchor="middle" fontSize="7.8" fontWeight="900" fill="currentColor" stroke="none">
            AUTO
          </text>
          <line x1="3.8" y1="17" x2="20.2" y2="17" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      key: '선택 입력',
      label: '선택 입력',
      icon: (
        <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
          <rect x="4.5" y="5.5" width="15" height="13" rx="2" />
          <polyline points="15.2,10 12,13.2 8.8,10" />
        </svg>
      ),
    },
    {
      key: '커스텀 항목',
      label: '커스텀 항목',
      icon: (
        <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
          <rect x="5" y="5" width="6" height="6" rx="1.2" />
          <rect x="13" y="5" width="6" height="6" rx="1.2" />
          <rect x="5" y="13" width="6" height="6" rx="1.2" />
          <rect x="13" y="13" width="6" height="6" rx="1.2" />
        </svg>
      ),
    },
  ];

  return (
    <div className="lnb-panel">
      <div className="lnb-content">
        <div className="lnb-tabs">
          {tabButtons.map((tab) => (
            <button
              key={tab.key}
              className={`lnb-tab ${lnbTab === tab.key ? 'active' : ''}`}
              type="button"
              onClick={() => onChangeTab(tab.key)}
            >
              <span className="lnb-tab-icon" aria-hidden="true">{tab.icon}</span>
              <span className="lnb-tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        {lnbTab === '기본 설정' ? (
          <div className="lnb-section-card lnb-basic-card">
            <div className="lnb-basic-field">
              <label className="lnb-basic-label" htmlFor="lnb-form-name">양식명</label>
              <input
                id="lnb-form-name"
                type="text"
                className="lnb-basic-input"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div className="lnb-basic-field">
              <label className="lnb-basic-label" htmlFor="lnb-form-description">양식 설명</label>
              <textarea
                id="lnb-form-description"
                className="lnb-basic-textarea"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
            </div>
            <div className="lnb-basic-field">
              <span className="lnb-basic-label">사용 여부</span>
              <div className="lnb-basic-toggle-row">
                <button
                  type="button"
                  className={`lnb-basic-toggle ${formEnabled === 'yes' ? 'active' : ''}`}
                  onClick={() => setFormEnabled('yes')}
                >
                  예
                </button>
                <button
                  type="button"
                  className={`lnb-basic-toggle lnb-basic-toggle-negative ${formEnabled === 'no' ? 'active' : ''}`}
                  onClick={() => setFormEnabled('no')}
                >
                  아니오
                </button>
              </div>
            </div>
            <div className="lnb-basic-field">
              <span className="lnb-basic-label">양식 유형</span>
              <div className="lnb-basic-toggle-row">
                <button
                  type="button"
                  className={`lnb-basic-toggle ${formType === 'normal' ? 'active' : ''}`}
                  onClick={() => setFormType('normal')}
                >
                  일반
                </button>
                <button
                  type="button"
                  className={`lnb-basic-toggle lnb-basic-toggle-linked ${formType === 'linked' ? 'active' : ''}`}
                  onClick={() => setFormType('linked')}
                >
                  연동
                </button>
              </div>
            </div>
          </div>
        ) : (
          lnbGroups.map((group) => {
            const isOpen = openSections[group.title] ?? true;
            return (
              <div className="lnb-section-card" key={group.title}>
                <button className="lnb-section-toggle" type="button" onClick={() => toggleSection(group.title)}>
                  <span className="lnb-section-title">{group.title}</span>
                  <span className="lnb-chevron" aria-hidden="true">{isOpen ? '▾' : '▸'}</span>
                </button>
                {isOpen && (
                  <div className="lnb-grid">
                    {group.items.map((item) => (
                      <button
                        key={item.id}
                        className="lnb-button"
                        aria-label={`${group.title} ${item.label}`}
                        onClick={item.action}
                      >
                        <span className="lnb-button-icon">{item.icon}</span>
                        <span className="lnb-button-label">{item.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="lnb-footer">
        <button type="button" className="lnb-settings-button" onClick={() => window.alert('준비 중')}>
          기본 레이아웃 설정
        </button>
        <button type="button" className="lnb-footer-square" aria-label="클립" disabled={!isClipButtonEnabled}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M8.2 12.1 14.9 5.4a3 3 0 0 1 4.3 4.3l-8.1 8.1a4.6 4.6 0 1 1-6.5-6.5l8.2-8.2" />
          </svg>
        </button>
        <button type="button" className="lnb-footer-square" aria-label="자바스크립트" onClick={openJsPopup}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3.5" y="4.5" width="17" height="15" rx="2.2" />
            <text x="12" y="16" textAnchor="middle" fontSize="9.1" fontWeight="900" fill="currentColor" stroke="none">
              JS
            </text>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default LNB;
