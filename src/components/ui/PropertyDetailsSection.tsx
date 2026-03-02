'use client';

import { FaBed, FaBath, FaRuler, FaMapMarkerAlt, FaPhone, FaEnvelope, FaCalendarAlt, FaShareAlt, FaCheckCircle, FaArrowRight, FaTimes } from 'react-icons/fa';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { createMeetingRequest, createSiteVisitRequest } from '@/lib/dataService';

interface PropertyDetailsSectionProps {
  title: string;
  price: string;
  city: string;
  area: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  description: string;
  features: string[];
  agentName?: string;
  agentPhone?: string;
  agentEmail?: string;
}

export default function PropertyDetailsSection({
  title,
  price,
  city,
  area,
  bedrooms,
  bathrooms,
  squareFeet,
  description,
  features,
  agentName,
  agentPhone,
  agentEmail,
}: PropertyDetailsSectionProps) {
  const params = useParams(); // Get Property ID
  const [activeTab, setActiveTab] = useState<'overview' | 'features'>('overview');
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

  const handleRequestSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      propertyId: params.id as string,
      buyerName: formData.get('name'),
      buyerEmail: formData.get('email'),
      buyerPhone: formData.get('phone'),
      preferredDate: formData.get('date'),
      preferredTime: formData.get('time'),
      message: formData.get('message'),
      attendees: formData.get('attendees') ? Number(formData.get('attendees')) : 1,
    };

    try {
      if (showVisitModal) {
        await createSiteVisitRequest(data);
        alert('Site Visit Requested Successfully!');
      } else {
        await createMeetingRequest(data);
        alert('Meeting Requested Successfully!');
      }
      setShowVisitModal(false);
      setShowInfoModal(false);
    } catch (err: any) {
      alert(`Failed to submit request: ${err.message || 'Unknown error'}`);
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="space-y-5">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-2">{title}</h1>
          
          {/* Location */}
          <div className="flex items-center gap-2 text-base text-gray-600">
            <FaMapMarkerAlt className="text-blue-600 flex-shrink-0 text-sm" />
            <span className="font-medium">{area}, {city}</span>
          </div>
        </div>

        {/* Price - Modern Highlight */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-2xl shadow-xl">
          <p className="text-sm font-medium text-blue-100 mb-2">Listed Price</p>
          <p className="text-4xl font-bold">{price}</p>
        </div>
      </div>

      {/* Property Meta Info - Modern Grid */}
      <div className="grid grid-cols-3 gap-4 bg-gradient-to-br from-white to-gray-50 p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex flex-col items-center space-y-3">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-3 rounded-xl">
            <FaBed className="text-xl" />
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{bedrooms}</p>
            <p className="text-xs text-gray-600 font-medium">Bedrooms</p>
          </div>
        </div>
        <div className="flex flex-col items-center space-y-3">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-3 rounded-xl">
            <FaBath className="text-xl" />
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{bathrooms}</p>
            <p className="text-xs text-gray-600 font-medium">Bathrooms</p>
          </div>
        </div>
        <div className="flex flex-col items-center space-y-3">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-3 rounded-xl">
            <FaRuler className="text-xl" />
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{squareFeet.toLocaleString()}</p>
            <p className="text-xs text-gray-600 font-medium">Sq Ft</p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-2 bg-gray-100 p-1.5 rounded-xl">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-2.5 px-4 rounded-lg font-semibold transition-all duration-300 ${
            activeTab === 'overview'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('features')}
          className={`flex-1 py-2.5 px-4 rounded-lg font-semibold transition-all duration-300 ${
            activeTab === 'features'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Features
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Description */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-gray-900">About this property</h3>
            <p className="text-gray-600 leading-relaxed text-base">{description}</p>
          </div>
        </div>
      )}

      {activeTab === 'features' && (
        <div className="space-y-4 animate-fadeIn">
          <h3 className="text-lg font-bold text-gray-900">Key Features</h3>
          <div className="grid grid-cols-1 gap-3">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-3 p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:border-blue-300 hover:shadow-md transition-all duration-300 group">
                <div className="flex-shrink-0">
                  <FaCheckCircle className="text-blue-600 mt-0.5 group-hover:scale-110 transition-transform" />
                </div>
                <p className="text-gray-700 font-medium">{feature}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA Buttons - Modern Design */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
        <button 
          onClick={() => setShowVisitModal(true)}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold py-3 px-6 rounded-xl hover:shadow-lg transition-all duration-300 shadow-md flex items-center justify-center gap-2 group hover:scale-105"
        >
          <FaCalendarAlt className="group-hover:scale-110 transition-transform" />
          Book a Site Visit
        </button>
        <button 
          onClick={() => setShowInfoModal(true)}
          className="w-full border-2 border-blue-600 text-blue-600 font-semibold py-3 px-6 rounded-xl hover:bg-blue-50 transition-all duration-300 flex items-center justify-center gap-2 group hover:scale-105"
        >
          <FaPhone className="group-hover:scale-110 transition-transform" />
          Request Info / Meeting
        </button>
      </div>

      {/* Quick Actions */}
      <button className="w-full flex items-center justify-center gap-2 text-gray-700 hover:text-blue-600 transition-colors duration-300 font-semibold py-3 px-6 rounded-xl border border-gray-200 hover:border-blue-300 group">
        <FaShareAlt className="group-hover:scale-110 transition-transform" />
        Share this property
      </button>

      {/* Agent Contact Card - Modern */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white rounded-2xl p-6 space-y-5 shadow-xl">
        <div>
          <p className="text-gray-200 text-sm font-medium mb-1">Listing Agent</p>
          <h3 className="text-2xl font-bold">{agentName || 'Prime Estate Team'}</h3>
        </div>

        <div className="space-y-3 bg-white/10 p-4 rounded-xl backdrop-blur-sm">
          <a 
            href={`tel:${agentPhone}`}
            className="flex items-center justify-between p-3 hover:bg-white/20 rounded-lg transition-all duration-300 group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="bg-blue-500 p-2.5 rounded-lg group-hover:scale-110 transition-transform">
                <FaPhone className="text-white" />
              </div>
              <div>
                <p className="text-gray-200 text-xs font-medium">Phone</p>
                <p className="font-semibold">{agentPhone || 'N/A'}</p>
              </div>
            </div>
            <FaArrowRight className="text-gray-300 group-hover:text-white group-hover:translate-x-1 transition-all" />
          </a>

          <a 
            href={`mailto:${agentEmail}`}
            className="flex items-center justify-between p-3 hover:bg-white/20 rounded-lg transition-all duration-300 group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="bg-blue-500 p-2.5 rounded-lg group-hover:scale-110 transition-transform">
                <FaEnvelope className="text-white" />
              </div>
              <div>
                <p className="text-gray-200 text-xs font-medium">Email</p>
                <p className="font-semibold text-sm">{agentEmail || 'support@primeestate.com'}</p>
              </div>
            </div>
            <FaArrowRight className="text-gray-300 group-hover:text-white group-hover:translate-x-1 transition-all" />
          </a>
        </div>
      </div>

       {/* Request Modal */}
       {(showVisitModal || showInfoModal) && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 md:p-8 max-w-md w-full relative animate-fadeIn shadow-2xl max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => { setShowVisitModal(false); setShowInfoModal(false); }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 transition-colors bg-gray-100 rounded-full p-2"
            >
              <FaTimes className="text-xl" />
            </button>
            
            <div className={`mb-6 p-4 rounded-xl ${showVisitModal ? 'bg-blue-50' : 'bg-purple-50'}`}>
              <h3 className={`text-2xl font-bold mb-1 ${showVisitModal ? 'text-blue-900' : 'text-purple-900'}`}>
                {showVisitModal ? 'Book a Site Visit' : 'Request Information'}
              </h3>
              <p className="text-gray-700 font-medium">
                {title}
              </p>
            </div>

            <form onSubmit={handleRequestSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1.5">Your Name *</label>
                <input required type="text" name="name" 
                  className="w-full border-2 border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900 font-medium bg-gray-50 focus:bg-white" 
                  placeholder="e.g. John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1.5">Email Address *</label>
                <input required type="email" name="email" 
                  className="w-full border-2 border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900 font-medium bg-gray-50 focus:bg-white" 
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1.5">Phone Number *</label>
                <input required type="tel" name="phone" 
                  className="w-full border-2 border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900 font-medium bg-gray-50 focus:bg-white" 
                  placeholder="+880 1..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1.5">Preferred Date *</label>
                  <input required type="date" name="date" 
                    className="w-full border-2 border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900 font-medium bg-gray-50 focus:bg-white" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1.5">Time *</label>
                  <input required type="time" name="time" 
                    className="w-full border-2 border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900 font-medium bg-gray-50 focus:bg-white" 
                  />
                </div>
              </div>

              {showVisitModal && (
                 <div>
                 <label className="block text-sm font-bold text-gray-800 mb-1.5">Number of Attendees</label>
                 <input type="number" name="attendees" min="1" defaultValue="1" 
                   className="w-full border-2 border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900 font-medium bg-gray-50 focus:bg-white" 
                 />
               </div>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1.5">Message (Optional)</label>
                <textarea name="message" rows={3} 
                  className="w-full border-2 border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900 font-medium bg-gray-50 focus:bg-white"
                  placeholder="I am interested in this property..."
                ></textarea>
              </div>

              <button 
                type="submit" 
                className={`w-full text-white font-bold py-4 rounded-xl hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all duration-200 ${
                    showVisitModal ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'
                }`}
              >
                {showVisitModal ? 'Book Site Visit' : 'Send Request'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
