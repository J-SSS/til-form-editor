import { LnbGroup } from '../SpreadsheetEditor.types';

export const createLnbSelectGroups = (
  addElementToSelection: (type: string, label: string) => void
): LnbGroup[] => [
  {
    title: '입력 항목',
    items: [
      { id: 'input', icon: 'T', label: '입력 박스', action: () => { addElementToSelection('text', 'IPT'); } },
      { id: 'table', icon: '≣', label: '텍스트 영역', action: () => { addElementToSelection('textarea', 'TXT'); } },
      { id: 'select', icon: '1', label: '숫자', action: () => { addElementToSelection('number', 'NUB'); } },
    ],
  },
  {
    title: '선택 항목',
    items: [
      { id: 'listbox', icon: '▾', label: '셀렉트 박스', action: () => { addElementToSelection('select', 'SLT'); } },
      { id: 'check', icon: '☑', label: '체크 박스', action: () => { addElementToSelection('checkbox', 'CHK'); } },
      { id: 'radio', icon: '◉', label: '라디오 버튼', action: () => { addElementToSelection('radio', 'RDO'); } },
    ],
  },
  {
    title: '표시 항목',
    items: [
      { id: 'view-label', icon: 'L', label: '라벨', action: () => { addElementToSelection('label', 'LBL'); } },
      { id: 'view-url', icon: '🔗', label: 'URL', action: () => { addElementToSelection('url', 'URL'); } },
      { id: 'view-image', icon: '▣', label: '이미지', action: () => { addElementToSelection('image', 'IMG'); } },
    ],
  },
  {
    title: '액션 항목',
    items: [
      { id: 'action-button', icon: '▣', label: '버튼', action: () => { addElementToSelection('button', 'BTN'); } },
      { id: 'action-user-select', icon: '◉', label: '사용자선택', action: () => { addElementToSelection('user-select', 'USR'); } },
      { id: 'action-department-select', icon: '▦', label: '부서선택', action: () => { addElementToSelection('department-select', 'DPT'); } },
      { id: 'action-file-upload', icon: '⇧', label: '파일업로드', action: () => { addElementToSelection('file-upload', 'FILE'); } },
      { id: 'action-repeat-button', icon: '↻', label: '반복버튼', action: () => { addElementToSelection('repeat-button', 'RPB'); } },
      { id: 'action-repeat-list-number', icon: '≣', label: '반복 목록 번호', action: () => { addElementToSelection('repeat-list-number', 'RPN'); } },
    ],
  },
];

export const lnbAutoGroups: LnbGroup[] = [
  {
    title: '기안자 정보',
    items: [
      {
        id: 'drafter-name',
        icon: <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.2" /><path d="M6 19c0-3.2 2.7-5.4 6-5.4s6 2.2 6 5.4" /></svg>,
        label: '이름',
      },
      {
        id: 'drafter-dept',
        icon: <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="5" width="14" height="14" rx="1.6" /><line x1="9" y1="9" x2="9" y2="9.1" /><line x1="12" y1="9" x2="12" y2="9.1" /><line x1="15" y1="9" x2="15" y2="9.1" /><line x1="9" y1="12" x2="9" y2="12.1" /><line x1="12" y1="12" x2="12" y2="12.1" /><line x1="15" y1="12" x2="15" y2="12.1" /><line x1="11" y1="19" x2="11" y2="15.5" /><line x1="13" y1="19" x2="13" y2="15.5" /></svg>,
        label: '부서명',
      },
      {
        id: 'drafter-title',
        icon: <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4.5" y="7.5" width="15" height="10.5" rx="1.8" /><path d="M9 7.5v-1a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" /><line x1="4.5" y1="11.2" x2="19.5" y2="11.2" /></svg>,
        label: '직책',
      },
      {
        id: 'drafter-empno',
        icon: <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4.5" y="5.5" width="15" height="13" rx="1.8" /><circle cx="9" cy="10" r="1.6" /><line x1="12" y1="9" x2="16.5" y2="9" /><line x1="12" y1="12" x2="16.5" y2="12" /><line x1="7.5" y1="15.2" x2="16.5" y2="15.2" /></svg>,
        label: '사번',
      },
      {
        id: 'drafter-company-phone',
        icon: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7.5h10a1.5 1.5 0 0 1 1.5 1.5v6.5a1.5 1.5 0 0 1-1.5 1.5H7a1.5 1.5 0 0 1-1.5-1.5V9A1.5 1.5 0 0 1 7 7.5Z" /><path d="M9.2 7.5V6.2a2.8 2.8 0 1 1 5.6 0v1.3" /><line x1="9.3" y1="11.1" x2="14.7" y2="11.1" /><line x1="9.3" y1="13.8" x2="14.7" y2="13.8" /></svg>,
        label: '회사전화',
      },
      {
        id: 'drafter-mobile-phone',
        icon: <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="3.8" width="8" height="16.4" rx="1.8" /><line x1="10.4" y1="6.4" x2="13.6" y2="6.4" /><circle cx="12" cy="17.1" r="0.9" /></svg>,
        label: '휴대전화',
      },
      {
        id: 'drafter-fax',
        icon: <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="4.5" width="12" height="5.5" rx="0.8" /><rect x="4.5" y="10" width="15" height="9.5" rx="1.4" /><line x1="8" y1="13.5" x2="16" y2="13.5" /><line x1="8" y1="16.2" x2="13.5" y2="16.2" /><line x1="17.2" y1="12.6" x2="17.2" y2="12.7" /></svg>,
        label: '팩스번호',
      },
    ],
  },
  {
    title: '회사 정보',
    items: [
      {
        id: 'company-name',
        icon: <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4.5" y="5" width="15" height="14" rx="1.7" /><line x1="8.2" y1="9" x2="8.3" y2="9" /><line x1="11.2" y1="9" x2="11.3" y2="9" /><line x1="14.2" y1="9" x2="14.3" y2="9" /><line x1="8.2" y1="12.2" x2="8.3" y2="12.2" /><line x1="11.2" y1="12.2" x2="11.3" y2="12.2" /><line x1="14.2" y1="12.2" x2="14.3" y2="12.2" /><line x1="10.8" y1="19" x2="10.8" y2="15.4" /><line x1="13.2" y1="19" x2="13.2" y2="15.4" /></svg>,
        label: '회사명',
      },
      {
        id: 'company-ceo',
        icon: <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.1" /><path d="M6 19c0-3.2 2.7-5.3 6-5.3s6 2.1 6 5.3" /><path d="M15.7 5.6l1 1.6 1.8.4-1.2 1.4.1 1.9-1.7-.7-1.7.7.1-1.9-1.2-1.4 1.8-.4z" /></svg>,
        label: '대표이사명',
      },
      {
        id: 'company-main-phone',
        icon: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.8 5.2h6.4a1.8 1.8 0 0 1 1.8 1.8v10a1.8 1.8 0 0 1-1.8 1.8H8.8A1.8 1.8 0 0 1 7 17V7a1.8 1.8 0 0 1 1.8-1.8Z" /><line x1="10.4" y1="8.3" x2="13.6" y2="8.3" /><line x1="10.4" y1="11.4" x2="13.6" y2="11.4" /><circle cx="12" cy="15.7" r="0.9" /></svg>,
        label: '대표 전화',
      },
      {
        id: 'company-address',
        icon: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s5-5.2 5-9A5 5 0 1 0 7 11c0 3.8 5 9 5 9Z" /><circle cx="12" cy="11" r="1.7" /></svg>,
        label: '회사 주소',
      },
    ],
  },
  {
    title: '문서 정보',
    items: [
      {
        id: 'doc-number',
        icon: <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="4.8" width="14" height="14.4" rx="1.8" /><line x1="8.2" y1="9.2" x2="15.8" y2="9.2" /><line x1="8.2" y1="12.4" x2="15.8" y2="12.4" /><line x1="8.2" y1="15.6" x2="13.6" y2="15.6" /></svg>,
        label: '문서 번호',
      },
      {
        id: 'doc-registered-date',
        icon: <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4.8" y="5.5" width="14.4" height="13.7" rx="1.6" /><line x1="4.8" y1="9.2" x2="19.2" y2="9.2" /><line x1="9" y1="3.9" x2="9" y2="7" /><line x1="15" y1="3.9" x2="15" y2="7" /><line x1="9" y1="13.2" x2="12.2" y2="13.2" /></svg>,
        label: '등록일',
      },
      {
        id: 'doc-closed-date',
        icon: <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4.8" y="5.5" width="14.4" height="13.7" rx="1.6" /><line x1="4.8" y1="9.2" x2="19.2" y2="9.2" /><line x1="9" y1="3.9" x2="9" y2="7" /><line x1="15" y1="3.9" x2="15" y2="7" /><line x1="8.6" y1="14.6" x2="11.1" y2="17.1" /><line x1="11.1" y1="17.1" x2="15.2" y2="13" /></svg>,
        label: '종결 일자',
      },
    ],
  },
];

export const createLnbCustomGroups = (
  addElementToSelection: (type: string, label: string) => void
): LnbGroup[] => [
  {
    title: '옵션 연동',
    items: [
      { id: 'custom-body-html', icon: '</>', label: '본문 HTML', action: () => { addElementToSelection('body-html', 'HTML'); } },
    ],
  },
];
