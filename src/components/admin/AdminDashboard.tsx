import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Users, Receipt, ImageIcon, PieChart, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import NuevaOrdenDialog from '@/components/admin/ordenes/NuevaOrdenDialog';

const AdminDashboard = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    totalClientes: 0,
    totalOrdenes: 0,
    ordenesPendientes: 0,
    totalFotos: 0,
    loading: true
  });
  const [showNuevaOrdenDialog, setShowNuevaOrdenDialog] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { count: clientesCount, error: clientesError } = await supabase
          .from('customers')
          .select('*', { count: 'exact', head: true });

        const { count: ordenesCount, error: ordenesError } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true });

        const { count: ordenesPendientesCount, error: ordenesPendientesError } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pendiente');

        const { count: fotosCount, error: fotosError } = await supabase
          .from('photo_files')
          .select('*', { count: 'exact', head: true });

        if (clientesError || ordenesError || ordenesPendientesError || fotosError) {
          console.error("Error al cargar estadísticas:", { clientesError, ordenesError, ordenesPendientesError, fotosError });
        }

        setStats({
          totalClientes: clientesCount || 0,
          totalOrdenes: ordenesCount || 0,
          ordenesPendientes: ordenesPendientesCount || 0,
          totalFotos: fotosCount || 0,
          loading: false
        });
      } catch (error) {
        console.error("Error en fetchStats:", error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchStats();
  }, []);

  if (stats.loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-studio-brown" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            Bienvenido, {profile?.first_name || 'Usuario'}
          </h2>
          <p className="text-gray-500">
            Aquí puedes ver un resumen de la actividad de FotoLeón.
          </p>
        </div>
        <Button 
          onClick={() => setShowNuevaOrdenDialog(true)}
          className="px-6 py-6 text-base"
          size="lg"
        >
          <Plus className="mr-2 h-5 w-5" /> Nueva Orden
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Clientes" 
          value={stats.totalClientes} 
          icon={<Users className="h-8 w-8 text-blue-500" />} 
          description="Total de clientes" 
        />
        <StatCard 
          title="Órdenes" 
          value={stats.totalOrdenes} 
          icon={<Receipt className="h-8 w-8 text-emerald-500" />} 
          description="Total de órdenes" 
        />
        <StatCard 
          title="Pendientes" 
          value={stats.ordenesPendientes} 
          icon={<PieChart className="h-8 w-8 text-amber-500" />} 
          description="Órdenes por procesar" 
        />
        <StatCard 
          title="Fotografías" 
          value={stats.totalFotos} 
          icon={<ImageIcon className="h-8 w-8 text-purple-500" />} 
          description="Archivos cargados" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Actividad Reciente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-500 flex items-center justify-center h-32">
              No hay actividad reciente para mostrar.
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Órdenes por Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-500 flex items-center justify-center h-32">
              No hay datos de órdenes para mostrar.
            </div>
          </CardContent>
        </Card>
      </div>

      <NuevaOrdenDialog 
        open={showNuevaOrdenDialog} 
        onOpenChange={setShowNuevaOrdenDialog} 
      />
    </div>
  );
};

const StatCard = ({ title, value, icon, description }) => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <h4 className="text-3xl font-bold text-gray-900 mt-1">{value}</h4>
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          </div>
          <div>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminDashboard;
