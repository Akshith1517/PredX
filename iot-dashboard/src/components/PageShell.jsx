import Topbar from './Topbar';

export default function PageShell({ title, subtitle, connected, anomaly, dataSource, children }) {
  return (
    <div className="flex-col" style={{ minHeight: '100vh' }}>
      <Topbar
        title={title}
        subtitle={subtitle}
        connected={connected}
        anomaly={anomaly}
        dataSource={dataSource}
      />
      <main className="page-body page-enter">
        {children}
      </main>
    </div>
  );
}
