'use client';

import { useEffect, useState } from 'react';
import { Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FilterProvider, useFilters } from '@/contexts/FilterContext';
import PropertyFilters from '@/components/filters/PropertyFilters';
import FilterTags from '@/components/filters/FilterTags';
import { getAllProperties } from '@/lib/dataService';
import { Property } from '@/lib/types';
import { sortOptions } from '@/lib/filterUtils';
import { usePagination, Pagination } from '@/lib/hooks/usePagination';
import { FaBed, FaBath, FaRuler, FaMapMarkerAlt } from 'react-icons/fa';

const ITEMS_PER_PAGE = 12;

function PropertiesContent() {
  const { filters } = useFilters();
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<string>('date-desc');

  const {
    currentPage,
    totalPages,
    startIndex,
    endIndex,
    paginationRange,
    goToPage,
    nextPage,
    prevPage,
    hasNextPage,
    hasPrevPage,
  } = usePagination({
    totalItems: allProperties.length,
    itemsPerPage: ITEMS_PER_PAGE,
  });

  // Slice properties for current page
  const properties = allProperties.slice(startIndex, endIndex);
  const resultCount = allProperties.length;

  useEffect(() => {
    const loadPropertiesData = async () => {
      try {
        setLoading(true);
        
        const selectedSort = sortOptions.find((opt) => opt.value === sortBy);
        const { data } = await getAllProperties(
          filters,
          selectedSort?.field as string,
          selectedSort?.order as 'asc' | 'desc'
        );
        
        if (data) {
          setAllProperties(data as Property[]);
        }
      } catch (error) {
        console.error('Failed to load properties:', error);
        setAllProperties([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadPropertiesData();
  }, [filters, sortBy]);

  // Reset to page 1 when filters change
  useEffect(() => {
    goToPage(1);
  }, [filters, sortBy]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Find Your Dream Property</h1>
          <p className="text-gray-600">Browse through our extensive collection of properties</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <PropertyFilters resultCount={resultCount} />

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* Active Filter Tags */}
            <div className="mb-6">
              <FilterTags />
            </div>

            {/* Sort & Results Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <p className="text-gray-600">
                <span className="font-bold text-gray-900">{resultCount}</span> {resultCount === 1 ? 'property' : 'properties'} found
                {totalPages > 1 && (
                  <span className="text-gray-500 ml-2">
                    (Page {currentPage} of {totalPages})
                  </span>
                )}
              </p>
              
              <select 
                aria-label="Sort properties" 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)} 
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600"></div>
              </div>
            )}

            {/* No Results */}
            {!loading && resultCount === 0 && (
              <div className="text-center py-20 bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="mb-4">
                  <svg
                    className="mx-auto h-16 w-16 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
                <p className="text-xl text-gray-600 mb-2 font-semibold">No properties found</p>
                <p className="text-gray-600">Try adjusting your filters to see more results</p>
              </div>
            )}

            {/* Property Grid - Using standard cards without admin edit button */}
            {!loading && resultCount > 0 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {properties.map((property) => (
                    <Link
                      key={property.id}
                      href={`/properties/${property.id}`}
                      className="group bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-blue-300 hover:-translate-y-1"
                    >
                      {/* Property Image */}
                      <div className="relative h-56 overflow-hidden bg-gray-200">
                        <Image
                          src={property.images[0]}
                          alt={property.title}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-300"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://placehold.co/400x300/e2e8f0/64748b?text=Property';
                          }}
                        />
                        <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                          {property.propertyType}
                        </div>
                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold text-gray-900">
                          {property.status}
                        </div>
                      </div>

                      {/* Property Details */}
                      <div className="p-5 space-y-3">
                        <div>
                          <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors">
                            {property.title}
                          </h3>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <FaMapMarkerAlt className="text-blue-600 text-xs" />
                            <span>{property.area}, {property.city}</span>
                          </div>
                        </div>

                        {/* Price */}
                        <div className="text-2xl font-bold text-blue-600">
                          {property.price}
                        </div>

                        {/* Property Meta */}
                        <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
                          <div className="flex items-center gap-1.5 text-gray-700">
                            <FaBed className="text-blue-600" />
                            <span className="text-sm font-medium">{property.bedrooms}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-700">
                            <FaBath className="text-blue-600" />
                            <span className="text-sm font-medium">{property.bathrooms}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-700">
                            <FaRuler className="text-blue-600" />
                            <span className="text-sm font-medium">{property.squareFeet.toLocaleString()} sqft</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Pagination */}
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  paginationRange={paginationRange}
                  onPageChange={goToPage}
                  hasNextPage={hasNextPage}
                  hasPrevPage={hasPrevPage}
                  onNextPage={nextPage}
                  onPrevPage={prevPage}
                />
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default function PropertiesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50" />}>
      <FilterProvider>
        <PropertiesContent />
      </FilterProvider>
    </Suspense>
  );
}