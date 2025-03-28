
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import NuevaOrdenDialog from './ordenes/NuevaOrdenDialog';

const OrdenesPage = () => {
  const [showNuevaOrdenDialog, setShowNuevaOrdenDialog] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-800">Órdenes</h2>
        <Button 
          onClick={() => setShowNuevaOrdenDialog(true)}
          size="default"
        >
          <Plus className="mr-2 h-4 w-4" /> Nueva Orden
        </Button>
      </div>
      
      <div className="bg-white rounded-md shadow p-6">
        <p className="text-center text-gray-500">
          Aquí se gestionarán las órdenes de los clientes.
        </p>
      </div>

      {/* Dialog para crear nueva orden */}
      <NuevaOrdenDialog 
        open={showNuevaOrdenDialog} 
        onOpenChange={setShowNuevaOrdenDialog} 
      />
    </div>
  );
};

export default OrdenesPage;
