'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Property } from '@/lib/types';
import FavoriteButton from '@/components/ui/FavoriteButton';
import Button from '@/components/ui/Button';
import { FaBed, FaBath, FaRuler, FaMapMarkerAlt, FaHeart, FaRegHeart } from 'react-icons/fa';

export default function FavoritesPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login?redirect=/favorites');
        return;
      }
      setUserId(user.id);
      setAuthChecking(false);
    };
    checkAuth();
  }, [router]);

  // Load favorites
  useEffect(() => {
    if (!userId) return;

    const loadFavorites = async () => {
      try {
        setLoading(true);
        
        // Get user's favorites with property details
        const { data, error } = await supabase
          .from('favorites')
          .select(`
            id,
            property_id,
            created_at,
            properties (
              id,
              title,
              price,
              city,
              area,
              bedrooms,
              bathrooms,
              square_feet,
              property_type,
              status,
              property_images (
                image_url,
                is_primary
              )
            )
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Failed to load favorites:', error);
          return;
        }

        // Transform to Property format
        const properties: Property[] = (data || [])
          .filter((fav: any) => fav.properties)
          .map((fav: any) => {
            const prop = fav.properties;
            const images = prop.property_images?.map((img: any) => img.image_url) || [
              'https://placehold.co/400x300/e2e8f0/64748b?text=Property'
            ];
            
            return {
              id: prop.id,
              title: prop.title,
              price: `৳${(prop.price / 100000).toFixed(2)} Lakh`,
              priceNumeric: prop.price,
              city: prop.city,
              area: prop.area,
              bedrooms: prop.bedrooms,
              bathrooms: prop.bathrooms,
              squareFeet: prop.square_feet,
              propertyType: prop.property_type,
              status: prop.status,
              description: '',
              features: [],
              agentId: '',
              images,
              createdAt: fav.created_at,
            };
          });

        setFavorites(properties);
      } catch (error) {
        console.error('Error loading favorites:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFavorites();
  }, [userId]);

  const handleRemoveFavorite = (propertyId: string) => {
    setFavorites((prev) => prev.filter((p) => p.id !== propertyId));
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3">
            <FaHeart className="text-3xl text-red-500" />
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">My Favorites</h1>
              <p className="text-gray-600 mt-1">
                {favorites.length} {favorites.length === 1 ? 'property' : 'properties'} saved
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600"></div>
          </div>
        )}

        {/* Empty State */}
        {!loading && favorites.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-200">
            <div className="mb-6">
              <FaRegHeart className="mx-auto h-20 w-20 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No favorites yet</h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Start exploring properties and click the heart icon to save them here.
            </p>
            <Button onClick={() => router.push('/properties')}>
              Browse Properties
            </Button>
          </div>
        )}

        {/* Favorites Grid */}
        {!loading && favorites.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((property) => (
              <div
                key={property.id}
                className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
              >
                {/* Property Image */}
                <Link href={`/properties/${property.id}`} className="block relative h-48 overflow-hidden bg-gray-200">
                  <Image
                    src={property.images[0]}
                    alt={property.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://placehold.co/400x300/e2e8f0/64748b?text=Property';
                    }}
                  />
                  <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    {property.propertyType}
                  </div>
                  
                  {/* Favorite Button */}
                  <div className="absolute top-4 right-4">
                    <FavoriteButton
                      propertyId={property.id}
                      userId={userId}
                      size="sm"
                      onLoginRequired={() => router.push('/login')}
                    />
                  </div>
                </Link>

                {/* Property Details */}
                <Link href={`/properties/${property.id}`} className="block p-5 space-y-3">
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
                      <span className="text-sm font-medium">{property.squareFeet?.toLocaleString()} sqft</span>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
