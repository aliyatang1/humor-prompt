"use client";

import { useState, useEffect } from "react";
import { getImages, updateImagePublic, deleteImage, uploadImage } from "@/app/actions/admin";
import Image from "next/image";

interface ImageData {
  id: string;
  url: string;
  is_public: boolean;
  created_datetime_utc: string;
  captionCount: number;
}

export default function ImagesPage() {
  const [images, setImages] = useState<ImageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadUrl, setUploadUrl] = useState("");
  const [uploadIsPublic, setUploadIsPublic] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadImages();
  }, []);

  async function loadImages() {
    try {
      setLoading(true);
      const data = await getImages();
      setImages(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load images");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!uploadUrl.trim()) {
      setError("Please enter an image URL");
      return;
    }

    try {
      setUploading(true);
      setError(null);
      await uploadImage(uploadUrl, uploadIsPublic);
      setUploadUrl("");
      setUploadIsPublic(false);
      setShowUploadForm(false);
      loadImages();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setUploading(false);
    }
  }

  async function handleTogglePublic(image: ImageData) {
    try {
      setUpdatingId(image.id);
      await updateImagePublic(image.id, !image.is_public);
      loadImages();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update image");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDelete(imageId: string) {
    if (!window.confirm("Are you sure you want to delete this image and all associated captions?")) {
      return;
    }

    try {
      setUpdatingId(imageId);
      await deleteImage(imageId);
      loadImages();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete image");
    } finally {
      setUpdatingId(null);
    }
  }

  const filteredImages = images.filter((img) =>
    img.id.toLowerCase().includes(search.toLowerCase()) ||
    img.url.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Images Management</h1>
        <p className="text-gray-600 mt-2">Manage uploaded images and control visibility</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Upload Form */}
      {showUploadForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Image</h2>
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image URL
              </label>
              <input
                type="url"
                placeholder="https://example.com/image.jpg"
                value={uploadUrl}
                onChange={(e) => setUploadUrl(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="public-toggle"
                checked={uploadIsPublic}
                onChange={(e) => setUploadIsPublic(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="public-toggle" className="text-sm text-gray-700">
                Make image public (visible in gallery)
              </label>
            </div>
            <div className="flex space-x-2">
              <button
                type="submit"
                disabled={uploading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {uploading ? "Adding..." : "Add Image"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowUploadForm(false);
                  setUploadUrl("");
                  setUploadIsPublic(false);
                }}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="flex items-center space-x-4">
        <input
          type="text"
          placeholder="Search images by ID or URL..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm"
        />
        {!showUploadForm && (
          <button
            onClick={() => setShowUploadForm(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 whitespace-nowrap"
          >
            + Add Image
          </button>
        )}
        <div className="text-sm text-gray-600">
          {filteredImages.length} of {images.length} images
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Preview</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">ID</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Captions</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Created</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredImages.map((image) => (
                <tr key={image.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="relative w-16 h-16 bg-gray-200 rounded overflow-hidden">
                      {image.url ? (
                        <Image
                          src={image.url}
                          alt="Thumbnail"
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="flex items-center justify-center w-full h-full text-gray-400 text-xs">
                          No image
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-gray-900 max-w-xs truncate">
                    {image.id}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        image.is_public
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {image.is_public ? "🌍 Public" : "🔒 Private"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {image.captionCount} caption{image.captionCount !== 1 ? "s" : ""}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {new Date(image.created_datetime_utc).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm space-x-2">
                    <button
                      onClick={() => handleTogglePublic(image)}
                      disabled={updatingId === image.id}
                      className="text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
                    >
                      {image.is_public ? "Make Private" : "Make Public"}
                    </button>
                    <button
                      onClick={() => handleDelete(image.id)}
                      disabled={updatingId === image.id}
                      className="text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {filteredImages.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500">
            {search ? "No images match your search" : "No images found"}
          </p>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-700 text-sm space-y-2">
        <p className="font-medium mb-1">Image Management Info</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>Only <strong>public</strong> images appear in the main gallery</li>
          <li>Deleting an image also deletes all associated captions and votes</li>
          <li>Use "Make Private" to hide images from users without deletion</li>
          <li>Use the "Add Image" button to register new image URLs</li>
        </ul>
      </div>
    </div>
  );
}
