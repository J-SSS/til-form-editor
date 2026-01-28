import React from 'react';
import FsFormStudio from './components/fsFormStudio';
import './App.scss';

// 앱 엔트리 컴포넌트: 편집기 화면을 루트에 렌더링한다.
function App() {
  return (
    <div className="App">
      <FsFormStudio />
    </div>
  );
}

export default App;
