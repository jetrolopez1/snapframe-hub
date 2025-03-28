
import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, Users, Image, Calendar, Camera, 
  Search, Edit, Trash, Plus
} from 'lucide-react';

const AdminPanel = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would validate admin credentials against Supabase
    console.log('Admin login attempt with:', { username, password });
    setIsLoggedIn(true);
  };

  // Mock data for dashboard
  const recentPhotos = [
    { id: 1, name: 'Sesión Familia García', date: '15/09/2023', status: 'Completado' },
    { id: 2, name: 'Boda Martínez-López', date: '20/09/2023', status: 'En proceso' },
    { id: 3, name: 'Retrato Corporativo', date: '25/09/2023', status: 'Pendiente' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow py-16 bg-studio-beige/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-playfair font-bold text-studio-brown mb-4">Panel de Administración</h1>
            <p className="max-w-2xl mx-auto text-studio-brown/80">
              Gestiona tus sesiones fotográficas, clientes y archivos desde un solo lugar.
            </p>
          </div>
          
          {!isLoggedIn ? (
            <Card className="max-w-md mx-auto p-6 bg-white shadow-lg">
              <h2 className="text-2xl font-playfair font-semibold text-studio-brown mb-6 text-center">Acceso Admin</h2>
              
              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-studio-red/50"
                    placeholder="Nombre de usuario"
                  />
                </div>
                
                <div>
                  <label htmlFor="admin-password" className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                  <input
                    id="admin-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-studio-red/50"
                    placeholder="Contraseña"
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-studio-brown hover:bg-studio-red text-white py-3"
                >
                  Iniciar Sesión
                </Button>
              </form>
            </Card>
          ) : (
            <div className="max-w-6xl mx-auto">
              <Tabs defaultValue="dashboard" className="w-full">
                <TabsList className="grid grid-cols-4 mb-8">
                  <TabsTrigger value="dashboard" className="data-[state=active]:bg-studio-brown data-[state=active]:text-white">
                    <BarChart className="h-4 w-4 mr-2" />
                    Dashboard
                  </TabsTrigger>
                  <TabsTrigger value="photos" className="data-[state=active]:bg-studio-brown data-[state=active]:text-white">
                    <Image className="h-4 w-4 mr-2" />
                    Archivos
                  </TabsTrigger>
                  <TabsTrigger value="clients" className="data-[state=active]:bg-studio-brown data-[state=active]:text-white">
                    <Users className="h-4 w-4 mr-2" />
                    Clientes
                  </TabsTrigger>
                  <TabsTrigger value="calendar" className="data-[state=active]:bg-studio-brown data-[state=active]:text-white">
                    <Calendar className="h-4 w-4 mr-2" />
                    Calendario
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="dashboard">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card className="p-6 bg-white">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-playfair font-semibold">Sesiones Totales</h3>
                        <Camera className="h-5 w-5 text-studio-red" />
                      </div>
                      <p className="text-3xl font-bold">248</p>
                      <p className="text-green-500 text-sm">+12% desde el mes pasado</p>
                    </Card>
                    
                    <Card className="p-6 bg-white">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-playfair font-semibold">Clientes</h3>
                        <Users className="h-5 w-5 text-studio-blue" />
                      </div>
                      <p className="text-3xl font-bold">142</p>
                      <p className="text-green-500 text-sm">+5% desde el mes pasado</p>
                    </Card>
                    
                    <Card className="p-6 bg-white">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-playfair font-semibold">Sesiones Pendientes</h3>
                        <Calendar className="h-5 w-5 text-studio-brown" />
                      </div>
                      <p className="text-3xl font-bold">24</p>
                      <p className="text-red-500 text-sm">+8% desde el mes pasado</p>
                    </Card>
                  </div>
                  
                  <Card className="p-6 bg-white">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-playfair font-semibold text-studio-brown">Sesiones Recientes</h3>
                      <Button variant="outline" size="sm" className="text-studio-brown border-studio-brown">
                        Ver Todas
                      </Button>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="py-3 px-2 text-left text-sm font-semibold text-gray-500">ID</th>
                            <th className="py-3 px-4 text-left text-sm font-semibold text-gray-500">Nombre</th>
                            <th className="py-3 px-4 text-left text-sm font-semibold text-gray-500">Fecha</th>
                            <th className="py-3 px-4 text-left text-sm font-semibold text-gray-500">Estado</th>
                            <th className="py-3 px-4 text-left text-sm font-semibold text-gray-500">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentPhotos.map((photo) => (
                            <tr key={photo.id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-3 px-2 text-sm text-gray-900">#{photo.id}</td>
                              <td className="py-3 px-4 text-sm text-gray-900">{photo.name}</td>
                              <td className="py-3 px-4 text-sm text-gray-500">{photo.date}</td>
                              <td className="py-3 px-4">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  photo.status === 'Completado' 
                                    ? 'bg-green-100 text-green-800'
                                    : photo.status === 'En proceso'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {photo.status}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center space-x-2">
                                  <button className="text-studio-blue hover:text-studio-brown">
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  <button className="text-studio-red hover:text-studio-brown">
                                    <Trash className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </TabsContent>
                
                <TabsContent value="photos">
                  <Card className="p-6 bg-white">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-playfair font-semibold text-studio-brown">Archivos Fotográficos</h3>
                      <div className="flex space-x-2">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <input 
                            type="text" 
                            placeholder="Buscar archivos" 
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-studio-red/50"
                          />
                        </div>
                        <Button className="bg-studio-red hover:bg-studio-brown text-white">
                          <Plus className="h-4 w-4 mr-2" />
                          Nuevo Archivo
                        </Button>
                      </div>
                    </div>
                    
                    <div className="bg-gray-100 rounded-lg p-12 text-center">
                      <Image className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 mb-4">Aquí se mostrarán los archivos fotográficos cuando conectes con Supabase y Cloudflare R2.</p>
                      <Button className="bg-studio-brown hover:bg-studio-red text-white">
                        Configurar Almacenamiento
                      </Button>
                    </div>
                  </Card>
                </TabsContent>
                
                <TabsContent value="clients">
                  <Card className="p-6 bg-white">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-playfair font-semibold text-studio-brown">Clientes</h3>
                      <div className="flex space-x-2">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <input 
                            type="text" 
                            placeholder="Buscar clientes" 
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-studio-red/50"
                          />
                        </div>
                        <Button className="bg-studio-red hover:bg-studio-brown text-white">
                          <Plus className="h-4 w-4 mr-2" />
                          Nuevo Cliente
                        </Button>
                      </div>
                    </div>
                    
                    <div className="bg-gray-100 rounded-lg p-12 text-center">
                      <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 mb-4">Aquí se mostrarán los clientes cuando conectes con Supabase.</p>
                      <Button className="bg-studio-brown hover:bg-studio-red text-white">
                        Configurar Base de Datos
                      </Button>
                    </div>
                  </Card>
                </TabsContent>
                
                <TabsContent value="calendar">
                  <Card className="p-6 bg-white">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-playfair font-semibold text-studio-brown">Calendario de Sesiones</h3>
                      <Button className="bg-studio-red hover:bg-studio-brown text-white">
                        <Plus className="h-4 w-4 mr-2" />
                        Nueva Sesión
                      </Button>
                    </div>
                    
                    <div className="bg-gray-100 rounded-lg p-12 text-center">
                      <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 mb-4">Aquí se mostrará el calendario de sesiones cuando conectes con Supabase.</p>
                      <Button className="bg-studio-brown hover:bg-studio-red text-white">
                        Configurar Calendario
                      </Button>
                    </div>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminPanel;
