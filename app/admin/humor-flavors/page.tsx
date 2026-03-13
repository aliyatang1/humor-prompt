"use client";

import { useState, useEffect } from "react";
import {
  getHumorFlavors,
  createHumorFlavor,
  updateHumorFlavor,
  deleteHumorFlavor,
  getHumorFlavorSteps,
  createHumorFlavorStep,
  updateHumorFlavorStep,
  deleteHumorFlavorStep,
} from "@/app/actions/admin";

interface HumorFlavor {
  id: number;
  created_datetime_utc: string;
  description: string;
  slug: string;
}

interface HumorFlavorStep {
  id: number;
  humor_flavor_id: number;
  created_datetime_utc: string;
  order_by: number;
  llm_temperature: number | null;
  llm_input_type_id: number;
  llm_output_type_id: number;
  llm_model_id: number;
  humor_flavor_step_type_id: number;
  llm_system_prompt: string;
  llm_user_prompt: string;
  description: string | null;
}

export default function HumorFlavorsPage() {
  const [flavors, setFlavors] = useState<HumorFlavor[]>([]);
  const [steps, setSteps] = useState<HumorFlavorStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFlavorId, setSelectedFlavorId] = useState<number | null>(null);

  // Flavor state
  const [editingFlavorId, setEditingFlavorId] = useState<number | null>(null);
  const [editFlavorData, setEditFlavorData] = useState<{ description?: string; slug?: string }>({});
  const [showCreateFlavor, setShowCreateFlavor] = useState(false);
  const [createFlavorData, setCreateFlavorData] = useState({ description: "", slug: "" });
  const [creatingFlavor, setCreatingFlavor] = useState(false);

  // Step state
  const [editingStepId, setEditingStepId] = useState<number | null>(null);
  const [editStepData, setEditStepData] = useState<Partial<HumorFlavorStep>>({});
  const [showCreateStep, setShowCreateStep] = useState(false);
  const [createStepData, setCreateStepData] = useState({
    order_by: 1,
    llm_temperature: 0.7,
    llm_input_type_id: 1,
    llm_output_type_id: 1,
    llm_model_id: 1,
    humor_flavor_step_type_id: 1,
    llm_system_prompt: "",
    llm_user_prompt: "",
    description: "",
  });
  const [creatingStep, setCreatingStep] = useState(false);

  useEffect(() => {
    loadFlavors();
  }, []);

  async function loadFlavors() {
    try {
      setLoading(true);
      const data = await getHumorFlavors();
      setFlavors(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load flavors");
    } finally {
      setLoading(false);
    }
  }

  async function loadStepsForFlavor(flavorId: number) {
    try {
      const data = await getHumorFlavorSteps(flavorId);
      setSteps(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load steps");
    }
  }

  // Flavor handlers
  async function handleCreateFlavor(e: React.FormEvent) {
    e.preventDefault();
    if (!createFlavorData.description.trim() || !createFlavorData.slug.trim()) {
      setError("Please fill in all flavor fields");
      return;
    }

    try {
      setCreatingFlavor(true);
      setError(null);
      await createHumorFlavor(createFlavorData.description, createFlavorData.slug);
      setCreateFlavorData({ description: "", slug: "" });
      setShowCreateFlavor(false);
      loadFlavors();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create flavor");
    } finally {
      setCreatingFlavor(false);
    }
  }

  async function handleUpdateFlavor(flavorId: number) {
    if (!editFlavorData.description?.trim() || !editFlavorData.slug?.trim()) {
      setError("Please fill in all flavor fields");
      return;
    }

    try {
      setError(null);
      await updateHumorFlavor(flavorId, editFlavorData.description!, editFlavorData.slug!);
      setEditingFlavorId(null);
      setEditFlavorData({});
      loadFlavors();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update flavor");
    }
  }

  async function handleDeleteFlavor(flavorId: number) {
    if (!window.confirm("Delete this flavor and all its steps?")) return;

    try {
      setError(null);
      await deleteHumorFlavor(flavorId);
      setSelectedFlavorId(null);
      setSteps([]);
      loadFlavors();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete flavor");
    }
  }

  // Step handlers
  async function handleCreateStep(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFlavorId || !createStepData.llm_system_prompt.trim() || !createStepData.llm_user_prompt.trim()) {
      setError("Please fill in required step fields");
      return;
    }

    try {
      setCreatingStep(true);
      setError(null);
      await createHumorFlavorStep(
        selectedFlavorId,
        createStepData.order_by,
        createStepData.llm_temperature,
        createStepData.llm_input_type_id,
        createStepData.llm_output_type_id,
        createStepData.llm_model_id,
        createStepData.humor_flavor_step_type_id,
        createStepData.llm_system_prompt,
        createStepData.llm_user_prompt,
        createStepData.description || null
      );
      setCreateStepData({
        order_by: 1,
        llm_temperature: 0.7,
        llm_input_type_id: 1,
        llm_output_type_id: 1,
        llm_model_id: 1,
        humor_flavor_step_type_id: 1,
        llm_system_prompt: "",
        llm_user_prompt: "",
        description: "",
      });
      setShowCreateStep(false);
      loadStepsForFlavor(selectedFlavorId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create step");
    } finally {
      setCreatingStep(false);
    }
  }

  async function handleUpdateStep(stepId: number) {
    if (!editStepData.llm_system_prompt?.trim() || !editStepData.llm_user_prompt?.trim()) {
      setError("Please fill in required step fields");
      return;
    }

    try {
      setError(null);
      const step = steps.find((s) => s.id === stepId)!;
      await updateHumorFlavorStep(
        stepId,
        editStepData.order_by ?? step.order_by,
        editStepData.llm_temperature ?? step.llm_temperature,
        editStepData.llm_input_type_id ?? step.llm_input_type_id,
        editStepData.llm_output_type_id ?? step.llm_output_type_id,
        editStepData.llm_model_id ?? step.llm_model_id,
        editStepData.humor_flavor_step_type_id ?? step.humor_flavor_step_type_id,
        editStepData.llm_system_prompt,
        editStepData.llm_user_prompt,
        editStepData.description ?? step.description
      );
      setEditingStepId(null);
      setEditStepData({});
      if (selectedFlavorId) loadStepsForFlavor(selectedFlavorId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update step");
    }
  }

  async function handleDeleteStep(stepId: number) {
    if (!window.confirm("Delete this step?")) return;

    try {
      setError(null);
      await deleteHumorFlavorStep(stepId);
      if (selectedFlavorId) loadStepsForFlavor(selectedFlavorId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete step");
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Humor Flavors</h1>
        <p className="text-gray-600 mt-2">Manage humor flavor configurations and processing steps</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* FLAVORS SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-gray-900">Flavors</h2>
          {!showCreateFlavor && (
            <button
              onClick={() => setShowCreateFlavor(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700"
            >
              + New Flavor
            </button>
          )}
        </div>

        {showCreateFlavor && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <form onSubmit={handleCreateFlavor} className="space-y-3">
              <input
                type="text"
                placeholder="Slug (e.g., pov-pov-pov)"
                value={createFlavorData.slug}
                onChange={(e) => setCreateFlavorData({ ...createFlavorData, slug: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
              <textarea
                placeholder="Description"
                value={createFlavorData.description}
                onChange={(e) => setCreateFlavorData({ ...createFlavorData, description: e.target.value })}
                rows={2}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
              <div className="flex space-x-2">
                <button
                  type="submit"
                  disabled={creatingFlavor}
                  className="bg-green-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  {creatingFlavor ? "Creating..." : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateFlavor(false);
                    setCreateFlavorData({ description: "", slug: "" });
                  }}
                  className="bg-gray-300 text-gray-700 px-3 py-2 rounded text-sm font-medium hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Slug</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Description</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Created</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {flavors.map((flavor) => (
                  <tr key={flavor.id} className="hover:bg-gray-50 cursor-pointer">
                    <td className="px-6 py-4 text-sm font-mono text-gray-900">
                      {editingFlavorId === flavor.id ? (
                        <input
                          type="text"
                          value={editFlavorData.slug ?? flavor.slug}
                          onChange={(e) => setEditFlavorData({ ...editFlavorData, slug: e.target.value })}
                          className="border border-gray-300 rounded px-2 py-1 text-sm"
                        />
                      ) : (
                        flavor.slug
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {editingFlavorId === flavor.id ? (
                        <textarea
                          value={editFlavorData.description ?? flavor.description}
                          onChange={(e) => setEditFlavorData({ ...editFlavorData, description: e.target.value })}
                          rows={2}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                        />
                      ) : (
                        flavor.description
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {new Date(flavor.created_datetime_utc).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm space-x-2">
                      {editingFlavorId === flavor.id ? (
                        <>
                          <button
                            onClick={() => handleUpdateFlavor(flavor.id)}
                            className="text-green-600 hover:text-green-700 font-medium text-xs"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingFlavorId(null)}
                            className="text-gray-600 hover:text-gray-700 text-xs"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingFlavorId(flavor.id);
                              setEditFlavorData({ description: flavor.description, slug: flavor.slug });
                            }}
                            className="text-blue-600 hover:text-blue-700 font-medium text-xs"
                          >
                            Edit
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedFlavorId(flavor.id);
                              loadStepsForFlavor(flavor.id);
                            }}
                            className="text-purple-600 hover:text-purple-700 font-medium text-xs"
                          >
                            View Steps
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteFlavor(flavor.id);
                            }}
                            className="text-red-600 hover:text-red-700 font-medium text-xs"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* STEPS SECTION */}
      {selectedFlavorId && (
        <div className="space-y-4 border-t pt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-900">
              Steps for {flavors.find((f) => f.id === selectedFlavorId)?.slug}
            </h2>
            {!showCreateStep && (
              <button
                onClick={() => setShowCreateStep(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700"
              >
                + New Step
              </button>
            )}
          </div>

          {showCreateStep && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <form onSubmit={handleCreateStep} className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    placeholder="Order"
                    value={createStepData.order_by}
                    onChange={(e) => setCreateStepData({ ...createStepData, order_by: parseInt(e.target.value) })}
                    className="border border-gray-300 rounded px-3 py-2 text-sm"
                  />
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Temperature"
                    value={createStepData.llm_temperature}
                    onChange={(e) => setCreateStepData({ ...createStepData, llm_temperature: parseFloat(e.target.value) })}
                    className="border border-gray-300 rounded px-3 py-2 text-sm"
                  />
                </div>
                <textarea
                  placeholder="System Prompt (required)"
                  value={createStepData.llm_system_prompt}
                  onChange={(e) => setCreateStepData({ ...createStepData, llm_system_prompt: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                />
                <textarea
                  placeholder="User Prompt (required)"
                  value={createStepData.llm_user_prompt}
                  onChange={(e) => setCreateStepData({ ...createStepData, llm_user_prompt: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                />
                <textarea
                  placeholder="Description (optional)"
                  value={createStepData.description}
                  onChange={(e) => setCreateStepData({ ...createStepData, description: e.target.value })}
                  rows={2}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                />
                <div className="flex space-x-2">
                  <button
                    type="submit"
                    disabled={creatingStep}
                    className="bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                  >
                    {creatingStep ? "Creating..." : "Create"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateStep(false)}
                    className="bg-gray-300 text-gray-700 px-3 py-2 rounded text-sm font-medium hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white rounded-lg shadow border border-gray-100 overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 w-12">Order</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 w-16">Temp</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 w-20">Type IDs</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">System Prompt</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">User Prompt</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Desc</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {steps.map((step) => (
                  <tr key={step.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-xs font-mono">
                      {editingStepId === step.id ? (
                        <input
                          type="number"
                          value={editStepData.order_by ?? step.order_by}
                          onChange={(e) => setEditStepData({ ...editStepData, order_by: parseInt(e.target.value) })}
                          className="w-12 border border-gray-300 rounded px-2 py-1 text-xs"
                        />
                      ) : (
                        step.order_by
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {editingStepId === step.id ? (
                        <input
                          type="number"
                          step="0.1"
                          value={editStepData.llm_temperature ?? step.llm_temperature ?? 0.7}
                          onChange={(e) => setEditStepData({ ...editStepData, llm_temperature: parseFloat(e.target.value) })}
                          className="w-16 border border-gray-300 rounded px-2 py-1 text-xs"
                        />
                      ) : (
                        step.llm_temperature?.toFixed(2)
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-gray-600">
                      {step.llm_input_type_id}/{step.llm_output_type_id}/{step.llm_model_id}/{step.humor_flavor_step_type_id}
                    </td>
                    <td className="px-6 py-4 text-xs max-w-xs">
                      {editingStepId === step.id ? (
                        <textarea
                          value={editStepData.llm_system_prompt ?? step.llm_system_prompt}
                          onChange={(e) => setEditStepData({ ...editStepData, llm_system_prompt: e.target.value })}
                          rows={2}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
                        />
                      ) : (
                        <p className="line-clamp-2">{step.llm_system_prompt}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs max-w-xs">
                      {editingStepId === step.id ? (
                        <textarea
                          value={editStepData.llm_user_prompt ?? step.llm_user_prompt}
                          onChange={(e) => setEditStepData({ ...editStepData, llm_user_prompt: e.target.value })}
                          rows={2}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
                        />
                      ) : (
                        <p className="line-clamp-2">{step.llm_user_prompt}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs max-w-xs">
                      {editingStepId === step.id ? (
                        <textarea
                          value={editStepData.description ?? step.description ?? ""}
                          onChange={(e) => setEditStepData({ ...editStepData, description: e.target.value })}
                          rows={1}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
                        />
                      ) : (
                        step.description && <p className="line-clamp-2">{step.description}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs space-x-1">
                      {editingStepId === step.id ? (
                        <>
                          <button
                            onClick={() => handleUpdateStep(step.id)}
                            className="text-green-600 hover:text-green-700 font-medium"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingStepId(null)}
                            className="text-gray-600 hover:text-gray-700"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setEditingStepId(step.id);
                              setEditStepData({ ...step });
                            }}
                            className="text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteStep(step.id)}
                            className="text-red-600 hover:text-red-700 font-medium"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {steps.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No steps created for this flavor yet
            </div>
          )}
        </div>
      )}
    </div>
  );
}
