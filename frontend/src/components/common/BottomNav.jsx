import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, ListOrdered, PhoneCall, Info } from 'lucide-react';

const BottomNav = () => {
  const { t } = useTranslation();
  const location = useLocation();

  if (location.pathname === '/') {
    return null;
  }

  const navItems = [
    { to: '/home', icon: Home, label: t('nav.home') },
    { to: '/steps', icon: ListOrdered, label: t('nav.steps') },
    { to: '/help', icon: PhoneCall, label: t('nav.help') },
    { to: '/about', icon: Info, label: t('nav.about') },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg pb-safe">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center w-full h-full py-1 text-xs font-medium transition-colors ${
                  isActive
                    ? 'text-primary font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`
              }
            >
              <Icon className="w-5 h-5 mb-1" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;

