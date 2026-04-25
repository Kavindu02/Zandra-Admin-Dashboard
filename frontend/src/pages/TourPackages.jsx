import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Image as ImageIcon, Map, FileText, Send, Download } from 'lucide-react';

import Sidebar from '../components/Sidebar';
import TopHeaderActions from '../components/TopHeaderActions';
import { generateTourPackagePDF } from '../utils/generateTourPackagePDF';

const ImageUploader = ({ imgKey, label, formData, handleImageChange, removeImage }) => (
  <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-4 flex flex-col items-center justify-center text-center hover:border-orange-500/50 transition-colors relative min-h-[160px]">
    {formData[`${imgKey}Preview`] ? (
      <>
        <img src={formData[`${imgKey}Preview`]} alt={label} className="absolute inset-0 w-full h-full object-cover rounded-xl" />
        <button 
          type="button"
          onClick={() => removeImage(imgKey)}
          className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-sm"
        >
          <Trash2 size={14} />
        </button>
      </>
    ) : (
      <>
        <div className="h-12 w-12 bg-orange-50 rounded-xl flex items-center justify-center mb-3 text-orange-500">
          <ImageIcon size={24} />
        </div>
        <p className="text-sm font-bold text-gray-700 mb-1">{label}</p>
        <p className="text-xs text-gray-400 mb-3">JPG or PNG</p>
        <label className="px-4 py-2 bg-[#1F2B3F] text-white rounded-lg text-xs font-semibold cursor-pointer hover:bg-[#2A3B56] transition-colors">
          Browse File
          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageChange(e, imgKey)} />
        </label>
      </>
    )}
  </div>
);

const TourPackages = () => {
  const initialForm = {
    title: '',
    image1b64: null,
    image2b64: null,
    image3b64: null,
    image4b64: null,
    image1Preview: null,
    image2Preview: null,
    image3Preview: null,
    image4Preview: null,
    quickFacts: '',
    duration: '',
    landPackageCost: '',
    airFareCost: '',
    bgColor: '#ffffff',
    hotels: [{ city: '', name: '', nights: '', rating: '' }],
    includes: [''],
    excludes: [''],
    notice: ['Prices are net and non-commissionable.', 'Rates and confirmations are subject to availability at the time of booking.']
  };

  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem('zandra_tour_package_form');
    return saved ? JSON.parse(saved) : initialForm;
  });

  useEffect(() => {
    // Only persist text/data fields to avoid QuotaExceededError with large base64 images
    const dataToSave = { ...formData };
    delete dataToSave.image1b64;
    delete dataToSave.image2b64;
    delete dataToSave.image3b64;
    delete dataToSave.image4b64;
    delete dataToSave.image1Preview;
    delete dataToSave.image2Preview;
    delete dataToSave.image3Preview;
    delete dataToSave.image4Preview;
    
    localStorage.setItem('zandra_tour_package_form', JSON.stringify(dataToSave));
  }, [formData]);

  const handleImageChange = (e, imgKey) => {
    const file = e.target.files[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({
        ...prev,
        [`${imgKey}b64`]: reader.result,
        [`${imgKey}Preview`]: previewUrl
      }));
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (imgKey) => {
    setFormData(prev => ({
      ...prev,
      [`${imgKey}b64`]: null,
      [`${imgKey}Preview`]: null
    }));
  };

  const handleListChange = (key, index, value) => {
    const newList = [...formData[key]];
    newList[index] = value;
    setFormData({ ...formData, [key]: newList });
  };

  const addListItem = (key, defaultVal = '') => {
    setFormData({ ...formData, [key]: [...formData[key], defaultVal] });
  };

  const removeListItem = (key, index) => {
    const newList = [...formData[key]];
    newList.splice(index, 1);
    setFormData({ ...formData, [key]: newList });
  };

  const handleHotelChange = (index, field, value) => {
    const newHotels = [...formData.hotels];
    newHotels[index][field] = value;
    setFormData({ ...formData, hotels: newHotels });
  };

  const handleResetForm = () => {
    if (window.confirm("Are you sure you want to clear the entire form (Recover)?")) {
      setFormData(initialForm);
      localStorage.removeItem('zandra_tour_package_form');
    }
  };

  const handleGenerate = (dataToGenerate = formData) => {
    generateTourPackagePDF(dataToGenerate);
  };

  return (
    <div className="flex min-h-screen bg-[#E5E7EB]">

      <Sidebar />
      <main className="flex-1 ml-64 overflow-auto">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-8">
          <h2 className="font-bold text-gray-800">Tour Packages</h2>
          <TopHeaderActions />
        </header>

        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-black text-[#1F2B3F] mb-2 tracking-tight">Tour Packages Generator</h1>
            <p className="text-sm text-gray-500 font-medium">Create beautiful travel itineraries effortlessly.</p>
          </div>

          <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 xl:col-span-8 space-y-6">
          
          {/* Top Images */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2"><Map size={16} className="text-orange-500"/> Cover Images (Top)</h3>
            <div className="grid grid-cols-2 gap-4">
              <ImageUploader imgKey="image1" label="Upload Image 1" formData={formData} handleImageChange={handleImageChange} removeImage={removeImage} />
              <ImageUploader imgKey="image2" label="Upload Image 2" formData={formData} handleImageChange={handleImageChange} removeImage={removeImage} />
            </div>
          </div>

          {/* Core Info */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2"><FileText size={16} className="text-orange-500"/> Package Details</h3>
            
            <div className="space-y-4">
              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Package Title (Identifier)</label>
                <input 
                  placeholder="e.g. Maldive 3 Days Group Tour"
                  className="w-full h-11 bg-[#f8fafc] border border-gray-200 px-4 rounded-xl text-sm text-gray-700 focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-300 outline-none transition-all"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Quick Facts / Overview (Multiple Paragraphs allowed)</label>
                <textarea 
                  rows={4}
                  placeholder="Bangkok, Experience the vibrant capital city..."
                  className="w-full bg-[#f8fafc] border border-gray-200 px-4 py-3 rounded-xl text-sm text-gray-700 focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-300 outline-none transition-all resize-none"
                  value={formData.quickFacts}
                  onChange={e => setFormData({...formData, quickFacts: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Duration Title</label>
                  <input 
                    placeholder="e.g. Special tour program for 3 nights 4 days"
                    className="w-full h-11 bg-[#f8fafc] border border-gray-200 px-4 rounded-xl text-sm text-gray-700 focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-300 outline-none transition-all"
                    value={formData.duration}
                    onChange={e => setFormData({...formData, duration: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Background Color</label>
                  <div className="flex bg-[#f8fafc] border border-gray-200 rounded-xl overflow-hidden h-11 focus-within:ring-2 focus-within:ring-orange-500/20 focus-within:border-orange-300 transition-all">
                    <input 
                      type="color"
                      className="h-full w-12 cursor-pointer border-none p-0 outline-none bg-transparent"
                      value={formData.bgColor}
                      onChange={e => setFormData({...formData, bgColor: e.target.value})}
                    />
                    <input 
                      type="text"
                      className="w-full h-full px-3 text-sm text-gray-700 bg-transparent outline-none uppercase"
                      value={formData.bgColor}
                      onChange={e => setFormData({...formData, bgColor: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Land Package Cost</label>
                  <input 
                    placeholder="e.g. LKR 100,000"
                    className="w-full h-11 bg-[#f8fafc] border border-gray-200 px-4 rounded-xl text-sm text-gray-700 focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-300 outline-none transition-all"
                    value={formData.landPackageCost}
                    onChange={e => setFormData({...formData, landPackageCost: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Air Fare Cost</label>
                  <input 
                    placeholder="e.g. LKR 120,000"
                    className="w-full h-11 bg-[#f8fafc] border border-gray-200 px-4 rounded-xl text-sm text-gray-700 focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-300 outline-none transition-all"
                    value={formData.airFareCost}
                    onChange={e => setFormData({...formData, airFareCost: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Hotels */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">Hotels Required</h3>
              <button onClick={() => addListItem('hotels', { city: '', name: '', nights: '', rating: '' })} className="text-xs font-bold text-orange-500 hover:text-orange-600 flex items-center gap-1 bg-orange-50 px-2 py-1 rounded">
                <Plus size={14}/> Add Hotel
              </button>
            </div>
            
            <div className="space-y-3">
              {formData.hotels.map((hotel, index) => (
                <div key={index} className="flex gap-2 items-center bg-[#f8fafc] p-2 rounded-xl border border-gray-100">
                  <input placeholder="City (e.g. Bangkok)" className="flex-1 h-9 px-3 rounded-lg border-gray-200 text-sm outline-none" value={hotel.city} onChange={e => handleHotelChange(index, 'city', e.target.value)} />
                  <span className="text-gray-400 font-bold">=</span>
                  <input placeholder="Hotel Name" className="flex-[2] h-9 px-3 rounded-lg border-gray-200 text-sm outline-none" value={hotel.name} onChange={e => handleHotelChange(index, 'name', e.target.value)} />
                  <input placeholder="Nights (e.g. 01)" className="w-20 h-9 px-3 rounded-lg border-gray-200 text-sm outline-none" value={hotel.nights} onChange={e => handleHotelChange(index, 'nights', e.target.value)} />
                  <input placeholder="Rating (e.g. 3*)" className="w-24 h-9 px-3 rounded-lg border-gray-200 text-sm outline-none" value={hotel.rating} onChange={e => handleHotelChange(index, 'rating', e.target.value)} />
                  <button onClick={() => removeListItem('hotels', index)} className="p-2 text-red-400 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                </div>
              ))}
            </div>
          </div>

          {/* Includes / Excludes / Notices */}
          {[
            { key: 'includes', title: 'Package Includes' },
            { key: 'excludes', title: 'Package Excludes' },
            { key: 'notice', title: 'Important Notice' }
          ].map(section => (
            <div key={section.key} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-700">{section.title}</h3>
                <button onClick={() => addListItem(section.key)} className="text-xs font-bold text-blue-500 hover:text-blue-600 flex items-center gap-1 bg-blue-50 px-2 py-1 rounded">
                  <Plus size={14}/> Add Row
                </button>
              </div>
              <div className="space-y-3">
                {formData[section.key].map((item, index) => (
                  <div key={index} className="flex gap-3 items-center">
                    <div className="w-2 h-2 rounded-full bg-gray-300 shrink-0"></div>
                    <input 
                      placeholder={`Enter ${section.title.toLowerCase()} item...`}
                      className="w-full h-10 bg-[#f8fafc] border border-gray-200 px-4 rounded-xl text-sm outline-none transition-all focus:border-blue-300 focus:bg-white"
                      value={item}
                      onChange={e => handleListChange(section.key, index, e.target.value)}
                    />
                    <button onClick={() => removeListItem(section.key, index)} className="p-2 text-red-400 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Bottom Images */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2"><Map size={16} className="text-orange-500"/> Secondary Images (Bottom)</h3>
            <div className="grid grid-cols-2 gap-4">
              <ImageUploader imgKey="image3" label="Upload Image 3" formData={formData} handleImageChange={handleImageChange} removeImage={removeImage} />
              <ImageUploader imgKey="image4" label="Upload Image 4" formData={formData} handleImageChange={handleImageChange} removeImage={removeImage} />
            </div>
          </div>

        </div>

        {/* Sidebar Actions */}
        <div className="col-span-12 xl:col-span-4 space-y-6">
          <div className="bg-[#1F2B3F] text-white rounded-2xl p-6 sticky top-24 shadow-xl shadow-blue-900/10">
            <div className="flex items-center justify-between mb-6 pb-6 border-b border-white/10">
              <div>
                <h4 className="text-lg font-bold mb-1">Ready to export?</h4>
                <p className="text-xs text-white/50">Check fields before generating</p>
              </div>
              <div className="h-12 w-12 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-400">
                <Send size={24} />
              </div>
            </div>
            
            <div className="space-y-3">
              <button 
                onClick={() => handleGenerate()}
                className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-orange-500/20"
              >
                <Download size={18} />
                Generate PDF Itinerary
              </button>

              <button 
                onClick={handleResetForm}
                className="w-full h-12 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors border border-gray-200"
              >
                <Trash2 size={18} />
                Reset (Recover) Form
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</div>
);
};

export default TourPackages;
