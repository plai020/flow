import { Outlet, NavLink } from 'react-router-dom';
import { Home, Calendar, BarChart3, FileDown } from 'lucide-react';

export default function AppLayout() {
  const navItems = [
    { path: '/', label: '首頁', icon: Home },
    { path: '/calendar', label: '月曆', icon: Calendar },
    { path: '/statistics', label: '統計', icon: BarChart3 },
    { path: '/export', label: '匯出', icon: FileDown },
  ];

  return (
    <div className="app-container">
      <div className="content-area">
        <Outlet />
      </div>
      
      <nav className="bottom-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            end={item.path === '/'}
          >
            <div className="icon-container">
              <item.icon size={24} strokeWidth={2.5} />
            </div>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
