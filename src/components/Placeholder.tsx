import { Icon } from "./Icon";

interface PlaceholderProps {
  icon: string;
  title: string;
  subtitle: string;
  sections: string[];
}

export function Placeholder({ icon, title, subtitle, sections }: PlaceholderProps) {
  return (
    <div className="page ph">
      <header className="ph-head">
        <div className="ph-icon">
          <Icon name={icon} size={24} />
        </div>
        <h1 className="ph-title">{title}</h1>
        <p className="ph-subtitle">{subtitle}</p>
      </header>
      <div className="ph-grid">
        {sections.map((s) => (
          <div key={s} className="ph-card">
            <div className="ph-card-label">{s}</div>
            <div className="ph-bars">
              <div className="ph-bar w" />
              <div className="ph-bar n" />
            </div>
            <div className="ph-status">
              <span className="dot" />
              In progress
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
