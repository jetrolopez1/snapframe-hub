import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, Plus, Search, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Customer } from '@/types/database.types';

interface NuevoGrupoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const groupSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  institution: z.string().min(1, 'La institución es requerida'),
  delivery_date: z.string().min(1, 'La fecha de entrega es requerida'),
  comments: z.string().optional(),
});

type GroupFormData = z.infer<typeof groupSchema>;

const NuevoGrupoDialog: React.FC<NuevoGrupoDialogProps> = ({
  open,
  onOpenChange,
  onSuccess
}) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<GroupFormData>({
    resolver: zodResolver(groupSchema)
  });

  useEffect(() => {
    if (open) {
      fetchCustomers();
    } else {
      reset();
      setSelectedCustomers([]);
      setSearchTerm('');
    }
  }, [open]);

  const fetchCustomers = async () => {
    if (searchTerm.length < 2) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .or(`name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        .limit(10);

      if (error) throw error;

      setCustomers(data || []);
    } catch (error) {
      console.error('Error al buscar clientes:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los clientes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.length >= 2) {
        fetchCustomers();
      } else {
        setCustomers([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleSelectCustomer = (customer: Customer) => {
    if (!selectedCustomers.find(c => c.id === customer.id)) {
      setSelectedCustomers([...selectedCustomers, customer]);
    }
    setSearchTerm('');
    setCustomers([]);
  };

  const handleRemoveCustomer = (customerId: string) => {
    setSelectedCustomers(selectedCustomers.filter(c => c.id !== customerId));
  };

  const onSubmit = async (data: GroupFormData) => {
    if (selectedCustomers.length === 0) {
      toast({
        title: "Error",
        description: "Debe seleccionar al menos un miembro para el grupo",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    try {
      // Crear el grupo
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .insert({
          name: data.name,
          institution: data.institution,
          delivery_date: data.delivery_date,
          status: 'pendiente',
          comments: data.comments || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Crear los miembros del grupo
      const memberPromises = selectedCustomers.map(customer => 
        supabase
          .from('group_members')
          .insert({
            group_id: groupData.id,
            customer_id: customer.id,
            created_at: new Date().toISOString()
          })
      );

      await Promise.all(memberPromises);

      toast({
        title: "¡Éxito!",
        description: "El grupo ha sido creado correctamente",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error al crear grupo:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el grupo",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Nuevo Grupo</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Información del grupo */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Grupo
              </label>
              <Input
                {...register('name')}
                placeholder="Ej: Grupo 3°A"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Institución
              </label>
              <Input
                {...register('institution')}
                placeholder="Ej: Escuela Primaria Juan Escutia"
              />
              {errors.institution && (
                <p className="mt-1 text-sm text-red-600">{errors.institution.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Entrega
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  {...register('delivery_date')}
                  type="date"
                  className="pl-10"
                />
              </div>
              {errors.delivery_date && (
                <p className="mt-1 text-sm text-red-600">{errors.delivery_date.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Comentarios (opcional)
              </label>
              <textarea
                {...register('comments')}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                rows={3}
                placeholder="Agregar notas o comentarios sobre el grupo..."
              />
            </div>
          </div>

          {/* Búsqueda y selección de miembros */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Miembros del Grupo
            </label>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar por nombre, teléfono o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Lista de resultados de búsqueda */}
            {loading ? (
              <div className="text-center py-2">
                <div className="animate-pulse text-gray-500">Buscando...</div>
              </div>
            ) : customers.length > 0 && (
              <div className="border rounded-md divide-y">
                {customers.map((customer) => (
                  <div
                    key={customer.id}
                    className="p-2 hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleSelectCustomer(customer)}
                  >
                    <div className="font-medium">{customer.name}</div>
                    <div className="text-sm text-gray-500">{customer.phone}</div>
                    {customer.email && (
                      <div className="text-sm text-gray-500">{customer.email}</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Lista de miembros seleccionados */}
            <div className="space-y-2">
              {selectedCustomers.map((customer) => (
                <div
                  key={customer.id}
                  className="flex justify-between items-center p-2 bg-gray-50 rounded-md"
                >
                  <div>
                    <div className="font-medium">{customer.name}</div>
                    <div className="text-sm text-gray-500">{customer.phone}</div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveCustomer(customer.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={submitting}
            >
              {submitting ? 'Creando grupo...' : 'Crear Grupo'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NuevoGrupoDialog; 