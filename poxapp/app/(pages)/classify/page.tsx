"use client";

import { useState } from "react";
import "@/app/styles/main.css";
import "@/app/styles/reviewpopup.css";
import "@/app/styles/changePrediction.css";
import Image from "next/image";

interface PredictionResult {
  success: boolean;
  predicted_class: string;
  confidence: number;
  class_index: number;
  all_probabilities: Record<string, number>;
}

export default function ParasiteClassifier() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      setPrediction(null);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePredict = async () => {
    if (!selectedFile) {
      setError("Please select an image first");
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch("http://localhost:8000/predict", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: PredictionResult = await response.json();
      setPrediction(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to classify image");
      console.error("Prediction error:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatClassName = (className: string) => {
    return className.replace(/_/g, " ");
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Parasite Classification
        </h1>
        <p className="text-gray-600 mb-6">
          Upload an image to identify parasites and insects
        </p>

        {/* File Upload */}
        <div className="mb-6">
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Select Image
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
          />
        </div>

        {/* Image Preview */}
        {preview && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Image Preview</h3>
            <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        )}

        {/* Predict Button */}
        <button
          onClick={handlePredict}
          disabled={!selectedFile || loading}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Classifying..." : "Classify Image"}
        </button>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Prediction Results */}
      {prediction && (
        <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
          <h2 className="text-2xl font-bold text-gray-800">Results</h2>

          {/* Main Prediction */}
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 font-medium">
                  Predicted Class
                </p>
                <p className="text-2xl font-bold text-green-900">
                  {formatClassName(prediction.predicted_class)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-green-700 font-medium">Confidence</p>
                <p className="text-2xl font-bold text-green-900">
                  {(prediction.confidence * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          {/* All Probabilities */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-gray-800">
              All Class Probabilities
            </h3>
            <div className="space-y-3">
              {Object.entries(prediction.all_probabilities)
                .sort((a, b) => b[1] - a[1])
                .map(([className, probability]) => (
                  <div key={className} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-gray-700">
                        {formatClassName(className)}
                      </span>
                      <span className="text-gray-600">
                        {(probability * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${probability * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}