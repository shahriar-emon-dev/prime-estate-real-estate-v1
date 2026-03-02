'use client';

import { useState } from 'react';
import Link from 'next/link';

const Hero = () => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="relative h-[92vh] min-h-[690px] w-full overflow-hidden">
      {/* Background Video with Overlay */}
      <div className="absolute inset-0">
        <video
          className="w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          poster="/hero-poster.jpg" // optional fallback image
        >
          <source src="/hero-video.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/90 to-gray-900/60" />
      </div>

      {/* Content */}
      <div className="relative max-w-7xl mx-auto h-full flex flex-col justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl">
            Find Your Dream Home in Bangladesh
          </h1>

          <p className="mt-6 text-xl text-gray-200 max-w-3xl">
            Discover the perfect property across major cities in Bangladesh.
            Browse through thousands of listings and find your ideal home.
          </p>

          {/* Search Bar */}
          <div className="mt-10 max-w-xl">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label htmlFor="search" className="sr-only">
                  Search properties
                </label>
                <input
                  id="search"
                  name="search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter location (e.g., Gulshan, Banani, Dhanmondi)"
                  className="block w-full px-4 py-3 rounded-md border-0 text-base text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                />
              </div>

              <div>
                <a
                  href="tel:+8801234567890"
                  className="w-full sm:w-auto flex items-center justify-center px-6 py-3 rounded-md text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500"
                >
                  Call Now
                </a>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-white">5000+</div>
              <div className="text-gray-200">Properties</div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-white">1000+</div>
              <div className="text-gray-200">Happy Clients</div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-white">15+</div>
              <div className="text-gray-200">Cities</div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-white">10+</div>
              <div className="text-gray-200">Years Experience</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;