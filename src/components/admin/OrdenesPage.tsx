import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Search, Filter, MoreHorizontal, Printer, Save } from 'lucide-react';
import NuevaOrdenDialog from './ordenes/NuevaOrdenDialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';

// Tipos para las órdenes
type Order = {
  id: string;
  folio: string;
  created_at: string;
  total_price: number;
  status: string;
  delivery_format: string;
  files_path: string | null;
  customer: {
    name: string;
    phone: string;
  } | null;
};

const OrdenesPage = () => {
  const [showNuevaOrdenDialog, setShowNuevaOrdenDialog] = useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [ordenes, setOrdenes] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const [editedOrders, setEditedOrders] = useState<{ [key: string]: Partial<Order> }>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchOrdenes();
  }, []);

  const fetchOrdenes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          folio,
          created_at,
          total_price,
          status,
          delivery_format,
          files_path,
          customer:customer_id (
            name,
            phone
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setOrdenes(data || []);
    } catch (error) {
      console.error('Error al cargar órdenes:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las órdenes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (orderId: string, newStatus: string) => {
    setEditedOrders(prev => ({
      ...prev,
      [orderId]: { ...prev[orderId], status: newStatus }
    }));
    setHasChanges(true);
  };

  const handleFilesPathChange = (orderId: string, fullPath: string) => {
    setEditedOrders(prev => ({
      ...prev,
      [orderId]: { ...prev[orderId], files_path: fullPath }
    }));
    setHasChanges(true);
  };

  const saveChanges = async () => {
    try {
      for (const [orderId, changes] of Object.entries(editedOrders)) {
        const { error } = await supabase
          .from('orders')
          .update(changes)
          .eq('id', orderId);
        
        if (error) throw error;
      }

      toast({
        title: "Éxito",
        description: "Los cambios se guardaron correctamente",
      });

      setEditedOrders({});
      setHasChanges(false);
      fetchOrdenes();
    } catch (error) {
      console.error('Error al guardar cambios:', error);
      toast({
        title: "Error",
        description: "No se pudieron guardar los cambios",
        variant: "destructive"
      });
    }
  };

  // Formatear número como precio
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-MX', { 
      style: 'currency', 
      currency: 'MXN',
      minimumFractionDigits: 2 
    }).format(price);
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-MX', { 
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
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

  // Función para extraer el nombre de la subcarpeta
  const getSubfolderName = (path: string | null) => {
    if (!path) return '';
    const parts = path.split('\\');
    return parts.slice(-2).join('\\');
  };

  // Función para generar el contenido del ticket
  const generateTicketContent = (orden: Order) => {
    const content = `
FOTO RÉFLEX
Orden de Servicio

Folio: ${orden.folio}
Fecha: ${formatDate(orden.created_at)}
Cliente: ${orden.customer?.name || 'Cliente eliminado'}
Teléfono: ${orden.customer?.phone || '-'}

Total: ${formatPrice(orden.total_price)}
Estado: ${getStatusLabel(orden.status)}
Formato de entrega: ${orden.delivery_format}

¡Gracias por su preferencia!
    `;
    return content.trim();
  };

  // Función para manejar la impresión
  const handlePrint = (orden: Order) => {
    setSelectedOrder(orden);
    setShowPrintDialog(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-800">Órdenes</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={saveChanges}
            disabled={!hasChanges}
            className={`${!hasChanges ? 'opacity-50' : ''}`}
          >
            <Save className="mr-2 h-4 w-4" /> Guardar cambios
          </Button>
          <Button 
            onClick={() => setShowNuevaOrdenDialog(true)}
            size="default"
          >
            <Plus className="mr-2 h-4 w-4" /> Nueva Orden
          </Button>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por folio o nombre..."
            className="pl-10 pr-4 py-2 w-full border rounded-md focus:ring-2 focus:ring-studio-brown focus:border-transparent"
          />
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <Filter className="h-4 w-4" /> Filtros
        </Button>
      </div>

      {loading ? (
        <div className="bg-white rounded-md shadow p-6 text-center">
          <div className="animate-pulse text-gray-500">Cargando órdenes...</div>
        </div>
      ) : ordenes.length === 0 ? (
        <div className="bg-white rounded-md shadow p-6 text-center">
          <p className="text-center text-gray-500">
            No hay órdenes registradas.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-md shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Folio</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Archivos</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ordenes.map((orden) => (
                  <tr key={orden.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{orden.folio}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{orden.customer?.name || 'Cliente eliminado'}</div>
                      <div className="text-xs text-gray-500">{orden.customer?.phone || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(orden.created_at)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{formatPrice(orden.total_price)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Select
                        value={editedOrders[orden.id]?.status || orden.status}
                        onValueChange={(value) => handleStatusChange(orden.id, value)}
                      >
                        <SelectTrigger className={`w-[140px] ${getStatusColor(editedOrders[orden.id]?.status || orden.status)}`}>
                          <SelectValue>{getStatusLabel(editedOrders[orden.id]?.status || orden.status)}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pendiente">Pendiente</SelectItem>
                          <SelectItem value="en_proceso">En proceso</SelectItem>
                          <SelectItem value="completado">Completado</SelectItem>
                          <SelectItem value="entregado">Entregado</SelectItem>
                          <SelectItem value="cancelado">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Input
                        placeholder="Pega la ruta de tu carpeta"
                        value={editedOrders[orden.id]?.files_path || orden.files_path || ''}
                        onChange={(e) => handleFilesPathChange(orden.id, e.target.value)}
                        className="w-[200px]"
                      />
                      {(editedOrders[orden.id]?.files_path || orden.files_path) && (
                        <a
                          href={`file:///${editedOrders[orden.id]?.files_path || orden.files_path}`}
                          className="text-xs text-blue-600 hover:underline block mt-1"
                          onClick={(e) => {
                            e.preventDefault();
                            const path = editedOrders[orden.id]?.files_path || orden.files_path;
                            if (path) {
                              window.open(`file:///${path}`, '_blank');
                            }
                          }}
                        >
                          {getSubfolderName(editedOrders[orden.id]?.files_path || orden.files_path)}
                        </a>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Ver detalles</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handlePrint(orden)}>
                            Imprimir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dialog para crear nueva orden */}
      <NuevaOrdenDialog 
        open={showNuevaOrdenDialog} 
        onOpenChange={setShowNuevaOrdenDialog} 
      />

      {/* Dialog para imprimir orden */}
      <Dialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              <span>Imprimir o enviar orden</span>
              <DialogClose className="rounded-full hover:bg-gray-100 p-2" />
            </DialogTitle>
          </DialogHeader>
          
          <div className="my-4">
            <div className="bg-gray-50 p-4 rounded-lg max-h-[400px] overflow-y-auto">
              <pre className="whitespace-pre-wrap font-mono text-sm">
                {selectedOrder ? generateTicketContent(selectedOrder) : ''}
              </pre>
            </div>
          </div>

          <DialogFooter>
            <div className="flex space-x-2 justify-end w-full">
              <Button
                variant="outline"
                onClick={() => {
                  const printWindow = window.open('', '_blank');
                  if (printWindow && selectedOrder) {
                    printWindow.document.write(`
                      <!DOCTYPE html>
                      <html>
                      <head>
                        <title>Ticket - ${selectedOrder.folio}</title>
                        <style>
                          @page {
                            size: 58mm auto;
                            margin: 0;
                          }
                          body {
                            font-family: monospace;
                            width: 58mm;
                            padding: 3mm;
                            margin: 0;
                            font-size: 10px;
                            line-height: 1.2;
                          }
                          .text-center { text-align: center; }
                          .font-bold { font-weight: bold; }
                          .mb-1 { margin-bottom: 3mm; }
                          hr { border: 1px dashed #000; }
                        </style>
                      </head>
                      <body>
                        <pre>${generateTicketContent(selectedOrder)}</pre>
                        <script>
                          window.onload = () => {
                            window.print();
                            setTimeout(() => window.close(), 500);
                          };
                        </script>
                      </body>
                      </html>
                    `);
                    printWindow.document.close();
                  }
                }}
                className="flex items-center"
              >
                <Printer className="mr-2 h-4 w-4" />
                Imprimir
              </Button>
              <Button
                onClick={() => {
                  if (selectedOrder) {
                    const text = encodeURIComponent(generateTicketContent(selectedOrder));
                    const phoneMatch = generateTicketContent(selectedOrder).match(/Teléfono: (.*)/);
                    if (phoneMatch) {
                      const phoneNumber = phoneMatch[1].replace(/\D/g, '');
                      const formattedPhone = phoneNumber.startsWith('52') ? phoneNumber : `52${phoneNumber}`;
                      const whatsappUrl = `https://wa.me/${formattedPhone}?text=${text}`;
                      window.open(whatsappUrl, '_blank');
                    } else {
                      toast({
                        title: "Error",
                        description: "No se encontró el número de teléfono en el ticket",
                        variant: "destructive"
                      });
                    }
                  }
                }}
                className="flex items-center"
              >
                Enviar por WhatsApp
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrdenesPage;
