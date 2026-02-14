import React, { useEffect, useState } from 'react';
import { LnbGroup } from '../SpreadsheetEditor.types';

interface LNBProps {
  lnbTab: '선택' | '자동';
  lnbGroups: LnbGroup[];
  onChangeTab: (tab: '선택' | '자동') => void;
  onOpenSettings: () => void;
}

const LNB: React.FC<LNBProps> = ({ lnbTab, lnbGroups, onChangeTab, onOpenSettings }) => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

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

  return (
    <div className="lnb-panel">
      <div className="lnb-content">
        <div className="lnb-tabs">
          <button className={`lnb-tab ${lnbTab === '선택' ? 'active' : ''}`} type="button" onClick={() => onChangeTab('선택')}>선택</button>
          <button className={`lnb-tab ${lnbTab === '자동' ? 'active' : ''}`} type="button" onClick={() => onChangeTab('자동')}>자동</button>
        </div>

        {lnbGroups.map((group) => {
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
        })}
      </div>

      <div className="lnb-footer">
        <button type="button" className="lnb-settings-button" onClick={onOpenSettings}>
          레이아웃 설정
        </button>
        <button type="button" className="lnb-footer-square" aria-label="알림">
          <span aria-hidden="true">{"\u223F"}</span>
        </button>
        <button type="button" className="lnb-footer-square" aria-label="북마크">
          <span aria-hidden="true">{"\u25A3"}</span>
        </button>
      </div>
    </div>
  );
};

export default LNB;
