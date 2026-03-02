'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getAllProperties } from '@/lib/dataService';
import { Property } from '@/lib/types';
import { FaBed, FaBath, FaRuler, FaMapMarkerAlt } from 'react-icons/fa';

const RecentListings = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRecentListings() {
      try {
        // Fetch available properties, sorted by newest first
        const { data } = await getAllProperties(
          { 
            status: ['Available'],
            priceMin: null,
            priceMax: null,
            cities: [],
            areas: [],
            propertyTypes: [],
            squareFeetMin: null,
            squareFeetMax: null,
            bedrooms: null,
            bathrooms: null,
            searchQuery: ''
          },
          'createdAt',
          'desc',
          6
        );
        if (data) {
          setProperties(data as Property[]);
        }
      } catch {
        setProperties([]);
      } finally {
        setLoading(false);
      }
    }
    loadRecentListings();
  }, []);

  if (loading) {
    return (
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Recent Listings
            </h2>
            <p className="mt-4 text-lg text-gray-600">Loading latest properties...</p>
          </div>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-100 rounded-lg h-80 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Recent Listings
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              No properties available at the moment. Check back soon!
            </p>
            <div className="mt-8">
              <Link
                href="/properties"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Browse All Properties
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Recent Listings
          </h2>
          <p className="mt-4 text-lg text-gray-500">
            Check out our latest property listings across Bangladesh
          </p>
        </div>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => (
            <Link 
              key={property.id} 
              href={`/properties/${property.id}`}
              className="bg-white rounded-lg shadow-lg overflow-hidden group hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="relative h-48">
                <Image
                  src={property.images[0] || 'https://placehold.co/600x400?text=No+Image'}
                  alt={property.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                  {property.propertyType}
                </div>
                <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  {property.status}
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                  {property.title}
                </h3>
                <div className="mt-2 flex items-center gap-1 text-gray-600">
                  <FaMapMarkerAlt className="text-blue-500 text-sm" />
                  <span>{property.area}, {property.city}</span>
                </div>
                <div className="mt-4 flex justify-between items-center">
                  <span className="text-xl font-bold text-blue-600">{property.price}</span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-sm text-gray-600 border-t pt-4">
                  <div className="flex items-center gap-1">
                    <FaBed className="text-blue-500" />
                    <span>{property.bedrooms} Beds</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FaBath className="text-blue-500" />
                    <span>{property.bathrooms} Baths</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FaRuler className="text-blue-500" />
                    <span>{property.squareFeet} sqft</span>
                  </div>
                </div>
              </div>
            </Link>
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

export default RecentListings;