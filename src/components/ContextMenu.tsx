import { useEffect, useRef, useState } from 'react';
import { Icon } from './Icon';

export interface MenuItem {
  label?: string;
  icon?: string;
  danger?: boolean;
  disabled?: boolean;
  shortcut?: string;
  separator?: boolean;
  onClick?: () => void;
}

export interface MenuState {
  x: number;
  y: number;
  items: MenuItem[];
}

export function useContextMenu() {
  const [menu, setMenu] = useState<MenuState | null>(null);
  const open = (e: React.MouseEvent, items: MenuItem[]) => {
    e.preventDefault();
    e.stopPropagation();
    setMenu({ x: e.clientX, y: e.clientY, items });
  };
  const close = () => setMenu(null);
  return { menu, open, close };
}

export function ContextMenu({ menu, onClose }: { menu: MenuState | null; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!menu) return;
    setIndex(0);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setIndex((i) => (i + 1) % menu.items.length);
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setIndex((i) => (i - 1 + menu.items.length) % menu.items.length);
      }
      if (e.key === 'Enter') {
        const it = menu.items[index];
        if (it && !it.disabled) {
          e.preventDefault();
          onClose();
          it.onClick?.();
        }
      }
    };
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onScroll = () => onClose();
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onDown);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [menu, index, onClose]);

  if (!menu) return null;
  const h = menu.items.length * 34 + 12;
  const x = Math.min(menu.x, window.innerWidth - 224);
  const y = Math.min(menu.y, window.innerHeight - Math.min(h, 340));

  return (
    <div className="ctx-menu" ref={ref} style={{ left: x, top: y }} role="menu" onClick={(e) => e.stopPropagation()}>
      {menu.items.map((it, i) =>
        it.separator ? (
          <div key={i} className="ctx-sep" />
        ) : (
          <button
            key={i}
            role="menuitem"
            className={`ctx-item ${it.danger ? 'danger' : ''} ${i === index ? 'sel' : ''}`}
            disabled={it.disabled}
            onClick={() => {
              onClose();
              it.onClick?.();
            }}
            onMouseEnter={() => setIndex(i)}
          >
            <span className="ctx-item-icon">{it.icon && <Icon name={it.icon} size={15} />}</span>
            <span className="ctx-item-label">{it.label}</span>
            {it.shortcut && <kbd className="ctx-item-kbd">{it.shortcut}</kbd>}
          </button>
        )
      )}
    </div>
  );
}