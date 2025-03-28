
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const HeroSection = () => {
  const [isVisible, setIsVisible] = useState(false);

  // Slogan animation effect on mount
  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section className="relative h-screen bg-gradient-to-b from-studio-beige/30 to-white flex items-center">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1500375592092-40eb2168fd21')] bg-cover bg-center opacity-15"></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <h1 
            className={`text-4xl md:text-5xl lg:text-6xl font-playfair font-bold text-studio-brown mb-6 transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
          >
            Capturamos momentos, creamos recuerdos
          </h1>
          
          <p 
            className={`text-xl md:text-2xl font-light mb-8 text-studio-brown/80 transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 transform-none' : 'opacity-0 translate-y-4'}`}
          >
            Haremos de tus fotografías un recuerdo que dure toda la vida
          </p>
          
          <div className={`flex flex-col sm:flex-row gap-4 justify-center transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 transform-none' : 'opacity-0 translate-y-4'}`}>
            <Button asChild className="bg-studio-red hover:bg-studio-brown text-white font-medium px-8 py-6">
              <Link to="/servicios">Nuestros Servicios</Link>
            </Button>
            <Button asChild variant="outline" className="border-studio-brown text-studio-brown hover:bg-studio-brown hover:text-white px-8 py-6">
              <Link to="/contacto">Contactar</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
