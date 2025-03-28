
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Loader2, Search, PlusCircle, Trash2, Edit } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

// Esquema de validación con Zod
const clienteSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Ingresa un email válido").or(z.string().length(0)),
  phone: z.string().min(10, "El teléfono debe tener al menos 10 dígitos").or(z.string().length(0)),
  address: z.string().optional(),
});

// Tipo derivado del esquema
type ClienteFormValues = z.infer<typeof clienteSchema>;

const ClientesPage = () => {
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentCliente, setCurrentCliente] = useState<any>(null);

  const form = useForm<ClienteFormValues>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      address: '',
    },
  });

  const fetchClientes = async () => {
    try {
      setLoading(true);
      let query = supabase.from('customers').select('*').order('created_at', { ascending: false });
      
      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      setClientes(data || []);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los clientes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, [searchTerm]);

  const handleOpenDialog = (cliente = null) => {
    setCurrentCliente(cliente);
    
    if (cliente) {
      form.reset({
        name: cliente.name || '',
        email: cliente.email || '',
        phone: cliente.phone || '',
        address: cliente.address || '',
      });
    } else {
      form.reset({
        name: '',
        email: '',
        phone: '',
        address: '',
      });
    }
    
    setDialogOpen(true);
  };

  const handleSubmit = async (values: ClienteFormValues) => {
    try {
      // Aseguramos que name siempre tenga un valor (no puede ser undefined)
      const dataToSubmit = {
        ...values,
        name: values.name.trim() // Garantizamos que name esté presente y sin espacios adicionales
      };
      
      if (currentCliente) {
        // Actualizar cliente existente
        const { error } = await supabase
          .from('customers')
          .update(dataToSubmit)
          .eq('id', currentCliente.id);
          
        if (error) throw error;
        
        toast({
          title: 'Cliente actualizado',
          description: 'Los datos del cliente han sido actualizados con éxito',
        });
      } else {
        // Crear nuevo cliente
        const { error } = await supabase
          .from('customers')
          .insert(dataToSubmit);
          
        if (error) throw error;
        
        toast({
          title: 'Cliente creado',
          description: 'El cliente ha sido creado con éxito',
        });
      }
      
      setDialogOpen(false);
      fetchClientes();
    } catch (error) {
      console.error('Error al guardar cliente:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar el cliente',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteCliente = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este cliente? Esta acción no se puede deshacer.')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      toast({
        title: 'Cliente eliminado',
        description: 'El cliente ha sido eliminado con éxito',
      });
      
      fetchClientes();
    } catch (error) {
      console.error('Error al eliminar cliente:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el cliente. Posiblemente tenga órdenes relacionadas.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-800">Clientes</h2>
        <Button onClick={() => handleOpenDialog()} className="bg-studio-brown text-white">
          <PlusCircle className="h-4 w-4 mr-2" />
          Nuevo Cliente
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Buscar por nombre..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-studio-brown" />
        </div>
      ) : (
        <div className="bg-white rounded-md shadow">
          {clientes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">
                {searchTerm ? 'No se encontraron clientes con ese nombre' : 'No hay clientes registrados'}
              </p>
              <Button 
                variant="outline" 
                onClick={() => handleOpenDialog()} 
                className="mt-4"
              >
                Agregar Cliente
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Correo</TableHead>
                  <TableHead>Dirección</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientes.map((cliente) => (
                  <TableRow key={cliente.id}>
                    <TableCell className="font-medium">{cliente.name}</TableCell>
                    <TableCell>{cliente.phone || '-'}</TableCell>
                    <TableCell>{cliente.email || '-'}</TableCell>
                    <TableCell className="max-w-xs truncate">{cliente.address || '-'}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(cliente)}
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Editar</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteCliente(cliente.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                        <span className="sr-only">Eliminar</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {currentCliente ? 'Editar Cliente' : 'Nuevo Cliente'}
            </DialogTitle>
            <DialogDescription>
              {currentCliente 
                ? 'Actualiza los datos del cliente' 
                : 'Ingresa los datos del nuevo cliente'}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre completo *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nombre del cliente" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Teléfono de contacto" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo electrónico</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="email@ejemplo.com" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dirección</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Dirección del cliente" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="bg-studio-brown text-white">
                  {currentCliente ? 'Actualizar' : 'Guardar'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientesPage;
