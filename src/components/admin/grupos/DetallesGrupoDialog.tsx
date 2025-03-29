import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Groups } from '@/types/database.types';
import NuevaOrdenGrupoDialog from './NuevaOrdenGrupoDialog';

interface GroupMember {
  id: string;
  customer: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
  };
  orders: {
    id: string;
    status: string;
    total_price: number;
    created_at: string;
  }[];
}

interface DetallesGrupoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: Groups | null;
  onSuccess: () => void;
}

const DetallesGrupoDialog: React.FC<DetallesGrupoDialogProps> = ({
  open,
  onOpenChange,
  group,
  onSuccess
}) => {
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNuevaOrdenDialog, setShowNuevaOrdenDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState<GroupMember | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open && group) {
      fetchGroupMembers();
    }
  }, [open, group]);

  const fetchGroupMembers = async () => {
    if (!group) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('group_members')
        .select(`
          id,
          customer:customer_id (
            id,
            name,
            phone,
            email
          ),
          orders:customer_id (
            id,
            status,
            total_price,
            created_at
          )
        `)
        .eq('group_id', group.id);

      if (error) throw error;

      setMembers(data || []);
    } catch (error) {
      console.error('Error al cargar miembros:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los miembros del grupo",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-MX', { 
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  // Formatear precio
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-MX', { 
      style: 'currency', 
      currency: 'MXN',
      minimumFractionDigits: 2 
    }).format(price);
  };

  // Obtener color de acuerdo al estado
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'en_proceso':
        return 'bg-blue-100 text-blue-800';
      case 'completado':
        return 'bg-green-100 text-green-800';
      case 'entregado':
        return 'bg-purple-100 text-purple-800';
      case 'cancelado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Obtener etiqueta de estado en español
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pendiente':
        return 'Pendiente';
      case 'en_proceso':
        return 'En proceso';
      case 'completado':
        return 'Completado';
      case 'entregado':
        return 'Entregado';
      case 'cancelado':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const handleNuevaOrden = (member: GroupMember) => {
    setSelectedMember(member);
    setShowNuevaOrdenDialog(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              <span>Detalles del Grupo</span>
            </DialogTitle>
          </DialogHeader>

          {group && (
            <div className="space-y-6">
              {/* Información del grupo */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-700">Nombre del Grupo</h3>
                  <p>{group.name}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-700">Institución</h3>
                  <p>{group.institution}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-700">Fecha de Entrega</h3>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    {formatDate(group.delivery_date)}
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-gray-700">Estado</h3>
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(group.status)}`}>
                    {getStatusLabel(group.status)}
                  </span>
                </div>
                {group.comments && (
                  <div className="col-span-2">
                    <h3 className="font-medium text-gray-700">Comentarios</h3>
                    <p className="text-sm text-gray-600">{group.comments}</p>
                  </div>
                )}
              </div>

              {/* Lista de miembros */}
              <div>
                <h3 className="font-medium text-gray-900 mb-4">Miembros del Grupo</h3>
                
                {loading ? (
                  <div className="text-center py-4">
                    <div className="animate-pulse text-gray-500">Cargando miembros...</div>
                  </div>
                ) : members.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-gray-500">No hay miembros en este grupo.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {members.map((member) => (
                      <div key={member.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="font-medium">{member.customer.name}</h4>
                            <p className="text-sm text-gray-500">{member.customer.phone}</p>
                            {member.customer.email && (
                              <p className="text-sm text-gray-500">{member.customer.email}</p>
                            )}
                          </div>
                          <Button
                            onClick={() => handleNuevaOrden(member)}
                            size="sm"
                          >
                            <Plus className="h-4 w-4 mr-2" /> Nueva Orden
                          </Button>
                        </div>

                        {/* Órdenes del miembro */}
                        {member.orders && member.orders.length > 0 ? (
                          <div className="space-y-2">
                            <h5 className="text-sm font-medium text-gray-700">Órdenes:</h5>
                            {member.orders.map((order) => (
                              <div key={order.id} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                                <div className="flex items-center space-x-4">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                    {getStatusLabel(order.status)}
                                  </span>
                                  <span className="text-sm">{formatDate(order.created_at)}</span>
                                </div>
                                <span className="font-medium">{formatPrice(order.total_price)}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">No hay órdenes registradas</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog para crear nueva orden */}
      <NuevaOrdenGrupoDialog
        open={showNuevaOrdenDialog}
        onOpenChange={setShowNuevaOrdenDialog}
        member={selectedMember}
        groupId={group?.id || ''}
        onSuccess={() => {
          fetchGroupMembers();
          setShowNuevaOrdenDialog(false);
        }}
      />
    </>
  );
};

export default DetallesGrupoDialog; 