/**
 * TypeScript Type Definitions for Prime Estate
 */

// Property Types
export interface Property {
  id: string;
  title: string;
  price: string;
  priceNumeric: number;
  city: string;
  area: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  propertyType: string;
  status: 'Available' | 'Sold' | 'Pending' | 'Rented';
  description: string;
  features: string[];
  agentId: string;
  agent?: Agent;
  images: string[];
  createdAt: string;
}

export interface Agent {
  id: string;
  name: string;
  email: string;
  phone: string;
  profile_image?: string;
  bio?: string;
  license_number?: string;
  is_active: boolean;
}

// Filter Types
export interface PropertyFilters {
  // Price Range
  priceMin: number | null;
  priceMax: number | null;
  
  // Location
  cities: string[];
  areas: string[];
  
  // Size
  squareFeetMin: number | null;
  squareFeetMax: number | null;
  
  // Property Details
  propertyTypes: string[];
  bedrooms: number | null;
  bathrooms: number | null;
  
  // Status
  status: string[];
  
  // Search
  searchQuery: string;
}

export interface SortOption {
  label: string;
  value: string;
  field: keyof Property;
  order: 'asc' | 'desc';
}

// Predefined Filter Options
export interface PriceRange {
  label: string;
  min: number;
  max: number;
}

export interface SquareFeetRange {
  label: string;
  min: number;
  max: number;
}

// Master Data Types
export interface City {
  id: string;
  name: string;
  isActive: boolean;
}

export interface Area {
  id: string;
  name: string;
  cityId: string;
  city?: string;
  isActive: boolean;
}

export interface PropertyType {
  id: string;
  name: string;
  isActive: boolean;
}

// Filter Context Type
export interface FilterContextType {
  filters: PropertyFilters;
  setFilters: (filters: PropertyFilters) => void;
  updateFilter: <K extends keyof PropertyFilters>(key: K, value: PropertyFilters[K]) => void;
  clearFilters: () => void;
  activeFilterCount: number;
  applyDraftFilters?: () => void;
  setDraftMode?: (enabled: boolean) => void;
  isDraft?: boolean;
}

// Sort State
export interface SortState {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

// Buyer Request Types
export interface MeetingRequest {
  id: string;
  propertyId: string;
  propertyTitle?: string; // For display
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  preferredDate: string;
  preferredTime: string;
  message?: string;
  status: 'New' | 'In Progress' | 'Completed' | 'Cancelled';
  createdAt: string;
}

export interface SiteVisitRequest {
  id: string;
  propertyId: string;
  propertyTitle?: string; // For display
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  preferredDate: string;
  preferredTime: string;
  attendees?: number;
  message?: string;
  status: 'New' | 'In Progress' | 'Completed' | 'Cancelled';
  createdAt: string;
}

// Notification Type
export interface Notification {
  id: string;
  type: 'meeting_request' | 'site_visit' | 'contact_lead';
  title: string;
  message: string;
  referenceId: string; // ID of the request
  isRead: boolean;
  createdAt: string;
}

// Calendar & Booking Types
export interface MeetingSlot {
  id: string;
  start_time: string;
  end_time: string;
  is_blocked: boolean;
  title?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  slot_id: string | null;
  guest_name: string;
  guest_email: string;
  guest_phone?: string;
  start_time: string;
  end_time: string;
  duration: number;
  message?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  meeting_slots?: MeetingSlot;
}

