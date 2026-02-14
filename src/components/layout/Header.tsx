import React from 'react';

interface HeaderProps {
  onOpenDoc: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenDoc, onContextMenu }) => {
  return (
    <div className="page-header" onContextMenu={onContextMenu}>
      <div className="page-header-title">
        <span className="page-header-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false">
            <path d="M21 7.5a5.5 5.5 0 0 1-7.94 4.9l-6.44 6.44a2.2 2.2 0 1 1-3.11-3.11l6.44-6.44A5.5 5.5 0 0 1 16.5 2l-2.2 2.2.7 2.1 2.1.7L19.3 4.8A5.48 5.48 0 0 1 21 7.5Z" />
          </svg>
        </span>
        FORM MAKER
      </div>
      <button className="page-header-button" onClick={onOpenDoc} aria-label="저장">
        <svg className="page-header-save-icon" viewBox="0 0 24 24" focusable="false" aria-hidden="true">
          <path d="M4 3h12l4 4v14H4V3z" />
          <path d="M7 3h8v6H7V3z" />
          <rect x="7" y="13" width="10" height="6" rx="1.5" />
          <rect x="9" y="5" width="4" height="2" rx="0.5" />
        </svg>
      </button>
    </div>
  );
};

export default Header;
