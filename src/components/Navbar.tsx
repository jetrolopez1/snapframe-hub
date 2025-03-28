
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="bg-studio-beige shadow-md py-4 font-lato sticky top-0 z-50">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center">
          <Link to="/" className="flex items-center gap-2">
            <Camera className="h-8 w-8 text-studio-brown" />
            <span className="text-xl font-playfair font-semibold text-studio-brown">Estudio Fotográfico</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          <Link to="/" className="text-studio-brown hover:text-studio-red transition-colors">Inicio</Link>
          <Link to="/servicios" className="text-studio-brown hover:text-studio-red transition-colors">Servicios</Link>
          <Link to="/portfolio" className="text-studio-brown hover:text-studio-red transition-colors">Portfolio</Link>
          <Link to="/contacto" className="text-studio-brown hover:text-studio-red transition-colors">Contacto</Link>
          <Button asChild className="bg-studio-red hover:bg-studio-brown text-white">
            <Link to="/cliente">Portal Cliente</Link>
          </Button>
        </div>

        {/* Mobile Navigation Toggle */}
        <div className="md:hidden">
          <button onClick={toggleMenu} className="text-studio-brown">
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white absolute top-full left-0 w-full shadow-md animate-fade-in">
          <div className="container mx-auto px-4 py-4 flex flex-col space-y-4">
            <Link to="/" className="text-studio-brown hover:text-studio-red transition-colors py-2 border-b border-gray-100" onClick={toggleMenu}>Inicio</Link>
            <Link to="/servicios" className="text-studio-brown hover:text-studio-red transition-colors py-2 border-b border-gray-100" onClick={toggleMenu}>Servicios</Link>
            <Link to="/portfolio" className="text-studio-brown hover:text-studio-red transition-colors py-2 border-b border-gray-100" onClick={toggleMenu}>Portfolio</Link>
            <Link to="/contacto" className="text-studio-brown hover:text-studio-red transition-colors py-2 border-b border-gray-100" onClick={toggleMenu}>Contacto</Link>
            <Button asChild className="bg-studio-red hover:bg-studio-brown text-white w-full">
              <Link to="/cliente" onClick={toggleMenu}>Portal Cliente</Link>
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
