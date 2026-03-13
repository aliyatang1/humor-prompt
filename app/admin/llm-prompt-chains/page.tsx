"use client";

import { useState, useEffect } from "react";
import {
  getLLMPromptChains,
  createLLMPromptChain,
  updateLLMPromptChain,
  deleteLLMPromptChain,
  getLLMResponses,
} from "@/app/actions/admin";

interface LLMPromptChain {
  id: number;
  created_datetime_utc: string;
  caption_request_id: number;
}

interface LLMResponse {
  id: string;
  created_datetime_utc: string;
  llm_model_response: string; // JSON string
  processing_time_seconds: number;
  llm_model_id: number;
  profile_id: string;
  caption_request_id: number;
  llm_prompt_chain_id: number;
  humor_flavor_id: number;
  humor_flavor_step_id: number;
}

export default function LLMPromptChainsPage() {
  const [chains, setChains] = useState<LLMPromptChain[]>([]);
  const [responses, setResponses] = useState<LLMResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedChainId, setSelectedChainId] = useState<number | null>(null);

  // Chain state
  const [editingChainId, setEditingChainId] = useState<number | null>(null);
  const [editChainData, setEditChainData] = useState<{ caption_request_id?: number }>({});
  const [showCreateChain, setShowCreateChain] = useState(false);
  const [createChainData, setCreateChainData] = useState({ caption_request_id: "" });
  const [creatingChain, setCreatingChain] = useState(false);

  useEffect(() => {
    loadChains();
  }, []);

  async function loadChains() {
    try {
      setLoading(true);
      const data = await getLLMPromptChains();
      setChains(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load chains");
    } finally {
      setLoading(false);
    }
  }

  async function loadResponsesForChain(chainId: number) {
    try {
      const data = await getLLMResponses(chainId);
      setResponses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load responses");
    }
  }

  // Chain handlers
  async function handleCreateChain(e: React.FormEvent) {
    e.preventDefault();
    if (!createChainData.caption_request_id) {
      setError("Please enter a caption request ID");
      return;
    }

    try {
      setCreatingChain(true);
      setError(null);
      await createLLMPromptChain(parseInt(createChainData.caption_request_id));
      setCreateChainData({ caption_request_id: "" });
      setShowCreateChain(false);
      loadChains();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create chain");
    } finally {
      setCreatingChain(false);
    }
  }

  async function handleUpdateChain(chainId: number) {
    if (!editChainData.caption_request_id) {
      setError("Please enter a caption request ID");
      return;
    }

    try {
      setError(null);
      await updateLLMPromptChain(chainId, editChainData.caption_request_id);
      setEditingChainId(null);
      setEditChainData({});
      loadChains();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update chain");
    }
  }

  async function handleDeleteChain(chainId: number) {
    if (!window.confirm("Delete this chain and all its responses?")) return;

    try {
      setError(null);
      await deleteLLMPromptChain(chainId);
      setSelectedChainId(null);
      setResponses([]);
      loadChains();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete chain");
    }
  }

  // Helper to parse JSON from response
  const parseResponseJson = (jsonStr: string | object) => {
    if (typeof jsonStr === "object") return jsonStr;
    try {
      return JSON.parse(jsonStr);
    } catch {
      return null;
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">LLM Prompt Chains</h1>
        <p className="text-gray-600 mt-2">Manage LLM prompt chains and view generated responses</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* CHAINS SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-gray-900">Prompt Chains</h2>
          {!showCreateChain && (
            <button
              onClick={() => setShowCreateChain(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700"
            >
              + New Chain
            </button>
          )}
        </div>

        {showCreateChain && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <form onSubmit={handleCreateChain} className="space-y-3">
              <input
                type="number"
                placeholder="Caption Request ID"
                value={createChainData.caption_request_id}
                onChange={(e) => setCreateChainData({ caption_request_id: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
              <div className="flex space-x-2">
                <button
                  type="submit"
                  disabled={creatingChain}
                  className="bg-green-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  {creatingChain ? "Creating..." : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateChain(false);
                    setCreateChainData({ caption_request_id: "" });
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
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">ID</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Caption Request ID</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Created</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {chains.map((chain) => (
                  <tr key={chain.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-mono text-gray-900">{chain.id}</td>
                    <td className="px-6 py-4 text-sm">
                      {editingChainId === chain.id ? (
                        <input
                          type="number"
                          value={editChainData.caption_request_id ?? chain.caption_request_id}
                          onChange={(e) => setEditChainData({ caption_request_id: parseInt(e.target.value) })}
                          className="border border-gray-300 rounded px-2 py-1 text-sm w-32"
                        />
                      ) : (
                        chain.caption_request_id
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {new Date(chain.created_datetime_utc).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm space-x-2">
                      {editingChainId === chain.id ? (
                        <>
                          <button
                            onClick={() => handleUpdateChain(chain.id)}
                            className="text-green-600 hover:text-green-700 font-medium text-xs"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingChainId(null)}
                            className="text-gray-600 hover:text-gray-700 text-xs"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setEditingChainId(chain.id);
                              setEditChainData({ caption_request_id: chain.caption_request_id });
                            }}
                            className="text-blue-600 hover:text-blue-700 font-medium text-xs"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              setSelectedChainId(chain.id);
                              loadResponsesForChain(chain.id);
                            }}
                            className="text-purple-600 hover:text-purple-700 font-medium text-xs"
                          >
                            View Responses
                          </button>
                          <button
                            onClick={() => handleDeleteChain(chain.id)}
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

        {chains.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            No prompt chains found
          </div>
        )}
      </div>

      {/* RESPONSES SECTION */}
      {selectedChainId && (
        <div className="space-y-4 border-t pt-8">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              Responses for Chain #{selectedChainId}
            </h2>
            <p className="text-gray-600 mt-1">Read-only view of generated LLM responses</p>
          </div>

          <div className="bg-white rounded-lg shadow border border-gray-100 overflow-x-auto">
            {responses.length > 0 ? (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">ID</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Model ID</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Processing Time (s)</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Flavor ID</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Response (Preview)</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {responses.map((response) => {
                    const responseData = parseResponseJson(response.llm_model_response);
                    return (
                      <tr key={response.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-xs font-mono text-gray-600">
                          {response.id.slice(0, 8)}...
                        </td>
                        <td className="px-6 py-4 text-xs font-mono">{response.llm_model_id}</td>
                        <td className="px-6 py-4 text-xs">{response.processing_time_seconds.toFixed(2)}</td>
                        <td className="px-6 py-4 text-xs font-mono">{response.humor_flavor_id}</td>
                        <td className="px-6 py-4 text-xs max-w-md">
                          {responseData ? (
                            <div>
                              {responseData.scene_summary && (
                                <p className="line-clamp-2 text-gray-700">{responseData.scene_summary}</p>
                              )}
                              {responseData.core_anchors && (
                                <p className="text-gray-500 mt-1">
                                  {Array.isArray(responseData.core_anchors)
                                    ? responseData.core_anchors.slice(0, 2).join(" • ")
                                    : responseData.core_anchors}
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-gray-500">Invalid JSON</p>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-700">
                          {new Date(response.created_datetime_utc).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-gray-500">
                No responses found for this chain
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-700 text-sm">
        <p className="font-medium mb-2">ℹ️ About LLM Responses</p>
        <p>
          LLM responses are automatically generated and stored when the LLM processes a prompt chain. This view shows the
          processing time and response content. Responses cannot be edited directly—they reflect the LLM's output at generation time.
        </p>
      </div>
    </div>
  );
}
