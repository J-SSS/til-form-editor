import React from 'react';

interface LayoutIndexProps {
  onContextMenu: (e: React.MouseEvent) => void;
  header: React.ReactNode;
  lnb: React.ReactNode;
  main: React.ReactNode;
  rnb: React.ReactNode;
}

const LayoutIndex: React.FC<LayoutIndexProps> = ({ onContextMenu, header, lnb, main, rnb }) => {
  return (
    <>
      {header}
      <div className="spreadsheet-container" onContextMenu={onContextMenu}>
        <div className="spreadsheet-side-panel" aria-label="button-placeholder">
          {lnb}
        </div>
        {main}
        <div className="spreadsheet-right-panel" aria-label="button-placeholder-right">
          {rnb}
        </div>
      </div>
    </>
  );
};

export default LayoutIndex;

