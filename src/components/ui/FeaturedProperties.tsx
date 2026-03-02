'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getAllProperties } from '@/lib/dataService';
import { Property } from '@/lib/types';
import { FaBed, FaBath, FaRuler } from 'react-icons/fa';

const FeaturedProperties = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFeatured() {
      const { data } = await getAllProperties(undefined, 'created_at', 'desc', 3);
      if (data) {
        setProperties(data as Property[]);
      }
      setLoading(false);
    }
    loadFeatured();
  }, []);

  if (loading) {
    return <div className="py-16 text-center">Loading featured properties...</div>;
  }

  return (
    <div className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Featured Properties in Bangladesh
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Explore our handpicked selection of premium properties across major cities
          </p>
        </div>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => (
            <div key={property.id} className="bg-white rounded-lg shadow-lg overflow-hidden group hover:shadow-xl transition-shadow">
              <div className="relative h-48 bg-gray-200">
                <Image
                  src={property.images[0] || 'https://placehold.co/600x400?text=No+Image'}
                  alt={property.title}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                  {property.price}
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 line-clamp-1">{property.title}</h3>
                <p className="mt-2 text-gray-600">{property.city}</p>
                <div className="mt-4 grid grid-cols-3 gap-4 text-sm text-gray-600 border-t pt-4">
                  <div className="flex items-center gap-1">
                    <FaBed className="text-blue-500" />
                    <span className="font-medium">{property.bedrooms}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FaBath className="text-blue-500" />
                    <span className="font-medium">{property.bathrooms}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FaRuler className="text-blue-500" />
                    <span className="font-medium">{property.squareFeet}</span>
                  </div>
                </div>
                <div className="mt-6">
                  <Link
                    href={`/properties/${property.id}`}
                    className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/properties"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            View All Properties
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FeaturedProperties; 