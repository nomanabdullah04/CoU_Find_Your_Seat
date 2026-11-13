import React from 'react';
import Header from './Header';
import BottomNav from './BottomNav';
import FloatingHelpButton from './FloatingHelpButton';

const Layout = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header />
      <main className="flex-1 pb-20 md:pb-8">
        {children}
      </main>
      <FloatingHelpButton />
      <BottomNav />
    </div>
  );
};

export default Layout;
