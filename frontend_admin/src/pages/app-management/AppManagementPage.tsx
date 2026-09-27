import React, { useState, useEffect, useRef } from 'react';
import { appManagementService } from '../../services/appManagementService';
import { courseService } from '../../services/courseService';
import { R2_PUBLIC_URL } from '../../config/constants';
import { PlusCircle, Edit2, Trash2, Image, Upload, Loader2, Link2, ExternalLink } from 'lucide-react';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const AppManagementPage: React.FC = () => {
  const [posters, setPosters] = useState<any[]>([]);
  const [entryView, setEntryView] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  // Form State
  const [formData, setFormData] = useState({
    id: 0,
    title: '',
    image_path: '',
    link_url: '',
    is_active: 1,
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getImageUrl = (imagePath?: string) => {
    if (!imagePath) return '/assets/images/xenoclass_loading.png';
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('data:') || imagePath.startsWith('/assets/')) {
      return imagePath;
    }
    const cleanPath = imagePath.replace(/^\/+/, '');
    const baseUrl = R2_PUBLIC_URL.endsWith('/') ? R2_PUBLIC_URL : `${R2_PUBLIC_URL}/`;
    return `${baseUrl}${cleanPath}`;
  };

  useEffect(() => {
    loadPosters();
  }, []);

  const loadPosters = async () => {
    try {
      setIsLoading(true);
      const data: any = await appManagementService.getAppPosters();
      setPosters(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading posters:', err);
      setPosters([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNew = () => {
    setFormData({
      id: 0,
      title: '',
      image_path: '',
      link_url: '',
      is_active: 1,
    });
    setSelectedFile(null);
    setImagePreview(null);
    setEntryView(true);
  };

  const handleEditPoster = (item: any) => {
    setFormData({
      id: item.id || 0,
      title: item.title || '',
      image_path: item.image_path || '',
      link_url: item.link_url || '',
      is_active: item.is_active !== undefined ? item.is_active : 1,
    });
    setImagePreview(item.image_path ? getImageUrl(item.image_path) : null);
    setSelectedFile(null);
    setEntryView(true);
  };

  const handleClose = () => {
    setEntryView(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSavePoster = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Please enter poster title');
      return;
    }

    if (!selectedFile && !formData.image_path) {
      alert('Please choose an image for the poster');
      return;
    }

    try {
      setSaving(true);
      let uploadedImagePath = formData.image_path;

      if (selectedFile) {
        try {
          const uploadRes = await courseService.upload(selectedFile, 1, 'Posters');
          if (uploadRes && uploadRes.key) {
            uploadedImagePath = uploadRes.key;
          }
        } catch (uploadErr) {
          console.error('Image upload failed, falling back:', uploadErr);
          uploadedImagePath = selectedFile.name;
        }
      }

      await appManagementService.saveAppPoster({
        ...formData,
        image_path: uploadedImagePath,
      });

      setEntryView(false);
      loadPosters();
    } catch (err) {
      console.error('Error saving poster:', err);
      alert('Failed to save poster. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePoster = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this poster?')) return;
    try {
      setIsLoading(true);
      await appManagementService.deleteAppPoster(id);
      loadPosters();
    } catch (err) {
      console.error('Error deleting poster:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------- */}
      {/* 1. LIST VIEW */}
      {/* ------------------------------------------------------------- */}
      {!entryView ? (
        <section className="border border-gray-300 shadow-xs p-6 rounded-xl bg-white">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-800">App Management</h2>
              <p className="text-xs text-gray-500 mt-0.5">Manage promotional banners & posters shown on the student home page</p>
            </div>
            <button
              onClick={handleCreateNew}
              className="bg-sky-500 hover:bg-blue-600 text-white font-bold py-2.5 px-5 rounded-lg transition-all duration-200 transform hover:scale-102 flex items-center gap-2 text-xs shadow-xs cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add New Poster</span>
            </button>
          </div>

          {isLoading ? (
            <div className="py-16 text-center">
              <LoadingSpinner message="Loading posters..." size="md" />
            </div>
          ) : posters.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 rounded-xl mt-5 border-2 border-dashed border-gray-200">
              <Image className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium text-xs">
                No posters found. Click "Add New Poster" to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {posters.map((item, index) => (
                <div
                  key={item.id || index}
                  className="border border-gray-200 p-5 rounded-xl hover:shadow-md transition-shadow duration-300 bg-white"
                >
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-5 w-full">
                      {/* Image Preview */}
                      <div className="flex-shrink-0">
                        <img
                          src={getImageUrl(item.image_path)}
                          className="h-20 w-44 object-cover rounded-lg border border-gray-200 shadow-2xs bg-gray-50"
                          alt={item.title}
                          onError={(e: any) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = '/assets/images/xenoclass_logo.png';
                          }}
                        />
                      </div>

                      <div className="flex flex-col gap-1.5 flex-grow">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-gray-800">
                            {item.title}
                          </span>
                        </div>
                        {item.link_url && (
                          <div className="flex items-center gap-1.5 text-xs text-blue-600 truncate max-w-md">
                            <Link2 className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{item.link_url}</span>
                          </div>
                        )}
                        <span className="text-[11px] text-gray-400">
                          Added: {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recent'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 ml-auto">
                      <span
                        className={`text-xs font-semibold px-3 py-1 rounded-full ${
                          item.is_active === 1 || item.is_active === true
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {item.is_active === 1 || item.is_active === true ? 'Active' : 'Inactive'}
                      </span>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditPoster(item)}
                          className="flex justify-center items-center h-9 w-9 p-2 border border-[#B8D0DE] rounded-full bg-[#D9EFF4] text-[#1d4ed8] hover:bg-[#bde0f0] transition-colors cursor-pointer"
                          title="Edit Poster"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePoster(item.id)}
                          className="flex justify-center items-center h-9 w-9 p-2 border border-[#E8A0A7] rounded-full bg-[#F4EDF0] text-[#D11A2A] hover:bg-[#f8d7da] transition-colors cursor-pointer"
                          title="Delete Poster"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : (
        /* ------------------------------------------------------------- */
        /* 2. FORM VIEW */
        /* ------------------------------------------------------------- */
        <section className="border border-gray-300 shadow-sm p-8 rounded-xl bg-white max-w-4xl mx-auto">
          <div className="mb-8 border-b border-gray-100 pb-4">
            <h2 className="text-2xl font-bold text-gray-800">
              {formData.id ? 'Edit Poster' : 'Create New Poster'}
            </h2>
            <p className="text-gray-500 text-xs mt-1">Fill in the details below to publish your student app banner.</p>
          </div>

          <form onSubmit={handleSavePoster} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Poster Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Summer Special Bootcamp Banner"
                required
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-xs"
              />
            </div>

            {/* Optional Link URL */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Action URL / Target Link <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={formData.link_url}
                onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                placeholder="e.g., /courses/1 or https://example.com/promo"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-xs"
              />
              <p className="text-[11px] text-gray-400 mt-1">Students will be redirected to this link when clicking the banner on their home screen.</p>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Poster Image <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-4 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex-shrink-0">
                  {imagePreview ? (
                    <img src={imagePreview} className="h-32 w-64 object-cover rounded-lg shadow-md border border-gray-200 bg-white" alt="Preview" />
                  ) : (
                    <div className="h-32 w-64 bg-gray-200 flex flex-col items-center justify-center rounded-lg text-gray-400 border border-gray-300">
                      <Image className="w-10 h-10 mb-1" />
                      <span className="text-[11px]">No Image Selected</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-3">
                  <input
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    type="file"
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-white border border-gray-300 px-4 py-2 rounded-lg text-xs font-semibold text-gray-700 shadow-xs hover:bg-gray-50 flex items-center gap-2 w-max cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Choose Image File</span>
                  </button>
                  <p className="text-xs text-gray-500 italic">Recommended size: 1200 x 400 px or aspect ratio ~3:1. Max size 5MB.</p>
                </div>
              </div>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center gap-3 py-2">
              <label className="text-xs font-semibold text-gray-700">Display this poster on student home page</label>
              <input
                type="checkbox"
                checked={formData.is_active === 1}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked ? 1 : 0 })}
                className="w-4 h-4 text-blue-600 rounded-sm border-gray-300 focus:ring-blue-500 cursor-pointer"
              />
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-4 pt-8 border-t border-gray-100">
              <button
                type="button"
                onClick={handleClose}
                className="border-2 border-gray-200 hover:bg-gray-100 text-gray-700 font-bold py-2.5 px-8 rounded-lg transition-all text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-2.5 px-10 rounded-lg shadow-lg shadow-sky-100 hover:shadow-sky-200 transition-all flex items-center gap-2 text-xs disabled:opacity-50 cursor-pointer"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{formData.id ? 'Update Poster' : 'Save Poster'}</span>
              </button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
};
