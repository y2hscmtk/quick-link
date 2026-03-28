const starterSections = [
  {
    title: '프로젝트 방향',
    items: [
      '우측 패널에서 그룹별 바로가기 링크 관리',
      '사용자가 링크를 추가, 삭제, 정리할 수 있는 구조',
      '빠르게 열어 쓰는 개인용 링크 허브'
    ]
  },
  {
    title: '현재 상태',
    items: [
      '기능 구현 전 메타데이터와 기본 골격만 정리됨',
      'React 사이드패널과 아이콘 클릭 토글만 활성화됨',
      '링크 CRUD 및 그룹 관리 기능은 아직 미구현'
    ]
  }
];

function App() {
  return (
    <main className="app">
      <section className="app__panel">
        <header className="app__brand">
          <img className="app__logo" src="/icons/logo-mark.png" alt="퀵링크 로고" />
          <div className="app__brand-copy">
            <span className="app__eyebrow">QuickLink</span>
            <h1 className="app__title">퀵링크</h1>
          </div>
        </header>
        <p className="app__description">
          그룹별 바로가기 링크를 우측 패널에서 관리하는 새 확장 프로그램을 위한 기본 메타데이터와
          최소 구조만 준비해 둔 상태다.
        </p>

        <div className="app__callout">
          <strong>준비된 범위</strong>
          <p>브라우저 툴바의 확장 프로그램 아이콘을 클릭하면 이 우측 패널이 열리고, 다시 클릭하면 닫힌다.</p>
        </div>

        <div className="app__grid">
          {starterSections.map((section) => (
            <section key={section.title} className="app__card">
              <h2>{section.title}</h2>
              <ul>
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </section>
    </main>
  );
}

export default App;
