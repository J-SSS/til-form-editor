import React from 'react';
import formStudioLogo from '../../formstudiologo.png';

interface HeaderProps {
  onOpenDoc: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

const FsHeader: React.FC<HeaderProps> = ({ onOpenDoc, onContextMenu }) => {
  return (
    <div className="page-header" onContextMenu={onContextMenu}>
      <div className="page-header-title">
        <img className="page-header-logo" src={formStudioLogo} alt="FsFormStudio" />
      </div>
      <button className="page-header-button" onClick={onOpenDoc} aria-label="����">
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

export default FsHeader;
