import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Toaster } from '../ui/sonner';

export const Layout = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Toaster position="top-right" richColors />
    </div>
  );
};

export default Layout;
