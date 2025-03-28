
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Receipt,
  ImageIcon,
  Settings,
  LogOut,
  Menu,
  Camera,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

interface SidebarItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick?: () => void;
}

const SidebarItem = ({ to, icon, label, isActive, onClick }: SidebarItemProps) => (
  <Link
    to={to}
    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
      isActive
        ? 'bg-studio-brown text-white'
        : 'text-gray-700 hover:bg-studio-brown/10'
    }`}
    onClick={onClick}
  >
    <span>{icon}</span>
    <span>{label}</span>
  </Link>
);

interface AdminSidebarProps {
  isMobile?: boolean;
}

const AdminSidebar = ({ isMobile = false }: AdminSidebarProps) => {
  const location = useLocation();
  const { signOut, profile } = useAuth();

  const routes = [
    {
      path: '/admin',
      label: 'Dashboard',
      icon: <LayoutDashboard size={20} />,
    },
    {
      path: '/admin/clientes',
      label: 'Clientes',
      icon: <Users size={20} />,
    },
    {
      path: '/admin/ordenes',
      label: 'Órdenes',
      icon: <Receipt size={20} />,
    },
    {
      path: '/admin/fotografias',
      label: 'Fotografías',
      icon: <ImageIcon size={20} />,
    },
    {
      path: '/admin/ajustes',
      label: 'Ajustes',
      icon: <Settings size={20} />,
    },
  ];

  const isAdmin = profile?.role === 'admin';

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 flex items-center space-x-2">
        <Camera size={24} className="text-studio-brown" />
        <span className="font-playfair font-bold text-xl text-studio-brown">FotoLeón</span>
      </div>
      
      <div className="px-3 py-2">
        <div className="bg-studio-beige/20 rounded-lg p-3 mb-6">
          <p className="text-sm text-gray-600">Conectado como</p>
          <p className="font-medium text-studio-brown">
            {profile?.first_name} {profile?.last_name}
          </p>
          <p className="text-xs text-gray-500 capitalize">{profile?.role || 'Usuario'}</p>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {routes.map((route) => {
          // Si la ruta es de ajustes y el usuario no es admin, no mostrarla
          if (route.path === '/admin/ajustes' && !isAdmin) {
            return null;
          }
          
          return (
            <SidebarItem
              key={route.path}
              to={route.path}
              icon={route.icon}
              label={route.label}
              isActive={location.pathname === route.path}
            />
          );
        })}
      </nav>

      <div className="p-4 mt-auto">
        <Button
          variant="outline"
          className="w-full flex items-center justify-center space-x-2 border-gray-300"
          onClick={signOut}
        >
          <LogOut size={16} />
          <span>Cerrar sesión</span>
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0">
          <SheetHeader className="text-left px-4 py-2 border-b">
            <SheetTitle>Menú</SheetTitle>
          </SheetHeader>
          <SidebarContent />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div className="hidden md:flex h-screen w-64 bg-white border-r flex-col">
      <SidebarContent />
    </div>
  );
};

export default AdminSidebar;
