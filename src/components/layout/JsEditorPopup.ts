import type React from 'react';

type JsEditorBridgeWindow = Window & {
  __saveFormJsEditor?: (value: string) => void;
};

interface OpenJsEditorPopupParams {
  popupRef: React.MutableRefObject<Window | null>;
  editorValueRef: React.MutableRefObject<string>;
}

export const openJsEditorPopup = ({ popupRef, editorValueRef }: OpenJsEditorPopupParams) => {
  if (popupRef.current && !popupRef.current.closed) {
    popupRef.current.focus();
    return;
  }

  const popup = window.open('', 'js-popup', 'width=900,height=680,resizable=yes,scrollbars=yes');
  if (!popup) return;
  popupRef.current = popup;

  (window as JsEditorBridgeWindow).__saveFormJsEditor = (value: string) => {
    editorValueRef.current = value;
  };

  const initialValue = JSON.stringify(editorValueRef.current || '');
  popup.document.open();
  popup.document.write(`<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>JavaScript Editor</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: 'Consolas', 'Noto Sans KR', monospace;
      background: #f4f8ff;
      color: #1f3048;
      height: 100vh;
      display: flex;
      flex-direction: column;
    }
    .popup-header {
      height: 52px;
      padding: 0 16px;
      display: flex;
      align-items: center;
      border-bottom: 1px solid #d4deec;
      background: #ffffff;
      font-family: 'Noto Sans KR', sans-serif;
      font-weight: 700;
      font-size: 14px;
      color: #486283;
    }
    .editor-shell {
      flex: 1;
      min-height: 0;
      display: grid;
      grid-template-columns: 52px 1fr;
      border-bottom: 1px solid #d4deec;
      background: #ffffff;
    }
    .line-numbers {
      margin: 0;
      padding: 12px 8px;
      border-right: 1px solid #e3e9f3;
      background: #f7faff;
      color: #8aa0bc;
      font-size: 13px;
      line-height: 20px;
      text-align: right;
      overflow: hidden;
      white-space: pre;
      user-select: none;
    }
    .code-editor {
      border: none;
      outline: none;
      resize: none;
      width: 100%;
      height: 100%;
      padding: 12px 14px;
      font-size: 13px;
      line-height: 20px;
      color: #1f3048;
      background: #ffffff;
      overflow: auto;
      tab-size: 2;
      font-family: 'Consolas', 'Noto Sans KR', monospace;
    }
    .popup-actions {
      height: 58px;
      padding: 10px 14px;
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      background: #ffffff;
      font-family: 'Noto Sans KR', sans-serif;
    }
    .popup-button {
      min-width: 78px;
      height: 36px;
      border: 1px solid #c9d6ea;
      border-radius: 8px;
      background: #ffffff;
      color: #4f6480;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
    }
    .popup-button.primary {
      border-color: #2f7cff;
      background: #2f7cff;
      color: #ffffff;
    }
  </style>
</head>
<body>
  <div class="popup-header">양식 JavaScript 편집기</div>
  <div class="editor-shell">
    <pre id="line-numbers" class="line-numbers">1</pre>
    <textarea id="code-editor" class="code-editor" spellcheck="false"></textarea>
  </div>
  <div class="popup-actions">
    <button id="cancel-btn" class="popup-button" type="button">취소</button>
    <button id="save-btn" class="popup-button primary" type="button">저장</button>
  </div>
  <script>
    (function () {
      const initialValue = ${initialValue};
      const editor = document.getElementById('code-editor');
      const lines = document.getElementById('line-numbers');
      const saveBtn = document.getElementById('save-btn');
      const cancelBtn = document.getElementById('cancel-btn');

      const syncLines = () => {
        const count = (editor.value.match(/\\n/g)?.length || 0) + 1;
        lines.textContent = Array.from({ length: count }, (_, idx) => String(idx + 1)).join('\\n');
        lines.scrollTop = editor.scrollTop;
      };

      editor.value = initialValue;
      syncLines();
      editor.focus();

      editor.addEventListener('input', syncLines);
      editor.addEventListener('scroll', () => {
        lines.scrollTop = editor.scrollTop;
      });

      saveBtn.addEventListener('click', () => {
        if (window.opener && typeof window.opener.__saveFormJsEditor === 'function') {
          window.opener.__saveFormJsEditor(editor.value);
        }
        window.close();
      });

      cancelBtn.addEventListener('click', () => window.close());
    })();
  </script>
</body>
</html>`);
  popup.document.close();
  popup.focus();
};

export const clearJsEditorPopupBridge = () => {
  const win = window as JsEditorBridgeWindow;
  delete win.__saveFormJsEditor;
};
