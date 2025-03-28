import React from 'react';
import { Link } from 'react-router-dom';
import { Camera, Instagram, Facebook, Mail, MapPin, Phone } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-studio-brown text-white pt-12 pb-6 font-lato">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Company Info */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <Camera className="h-6 w-6" />
              <span className="text-xl font-playfair">Foto Réflex</span>
            </div>
            <p className="text-studio-beige/80 mb-6">
              Fotografía para todo tipo de eventos.
            </p>
            <div className="flex space-x-4">
              <a href="https://www.instagram.com/foto__reflex/" target="_blank" rel="noopener noreferrer" className="text-studio-beige hover:text-studio-red transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="https://www.facebook.com/FotoReflexEstudio/" target="_blank" rel="noopener noreferrer" className="text-studio-beige hover:text-studio-red transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="mailto:foto_reflex_digital@hotmail.com" className="text-studio-beige hover:text-studio-red transition-colors">
                <Mail className="h-5 w-5" />
              </a>
              <a href="https://wa.me/529611342752" target="_blank" rel="noopener noreferrer" className="text-studio-beige hover:text-studio-red transition-colors">
                <Phone className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-playfair mb-4 border-b border-studio-beige/20 pb-2">Enlaces Rápidos</h3>
            <ul className="space-y-2">
              <li><Link to="/" className="text-studio-beige/80 hover:text-studio-beige transition-colors">Inicio</Link></li>
              <li><Link to="/servicios" className="text-studio-beige/80 hover:text-studio-beige transition-colors">Servicios</Link></li>
              <li><Link to="/portfolio" className="text-studio-beige/80 hover:text-studio-beige transition-colors">Portfolio</Link></li>
              <li><Link to="/contacto" className="text-studio-beige/80 hover:text-studio-beige transition-colors">Contacto</Link></li>
              <li><Link to="/cliente" className="text-studio-beige/80 hover:text-studio-beige transition-colors">Portal Cliente</Link></li>
              <li><Link to="/admin" className="text-studio-beige/80 hover:text-studio-beige transition-colors">Administración</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-playfair mb-4 border-b border-studio-beige/20 pb-2">Contacto</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-studio-red flex-shrink-0 mt-1" />
                <span className="text-studio-beige/80">Matriz: 2a sur entre 1a y 2a ote. #210-C,<br />Tuxtla Gutierrez, Chiapas, México</span>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-studio-red flex-shrink-0 mt-1" />
                <span className="text-studio-beige/80">Sucursal San Roque: 3a sur entre 3a y 4a ote. #412,<br />Tuxtla Gutierrez, Chiapas, México</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-studio-red flex-shrink-0" />
                <span className="text-studio-beige/80">961 238 7687</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-studio-red flex-shrink-0" />
                <span className="text-studio-beige/80">961 134 2752</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-studio-beige/20 mt-8 pt-6 text-center text-studio-beige/60 text-sm">
          <p>&copy; {new Date().getFullYear()} Foto Réflex. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
