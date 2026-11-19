import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Camera,
  CheckCircle2,
  Cpu,
  ImagePlus,
  Loader2,
  Trash2,
  Wrench,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatInr, validateImageMeta } from '../utils/repairLogic';
import type { DeviceCategory, Diagnosis } from '../types/repair';

const SAMPLE_PHOTOS = [
  {
    id: 'sample-phone',
    label: 'Cracked OLED Smartphone',
    category: 'Smartphone' as DeviceCategory,
    deviceName: 'Google Pixel 8 Pro',
    symptom: 'Dropped on corner; spiderweb glass crack on top right and vertical green lines on OLED.',
    path: '/src/assets/images/sample_cracked_phone_1795094466273.jpg',
  },
  {
    id: 'sample-laptop',
    label: 'Damaged Laptop Hinge & USB-C Port',
    category: 'Laptop' as DeviceCategory,
    deviceName: 'Apple MacBook Pro 14 (M2)',
    symptom: 'Left display hinge bezel separated and USB-C port area shows dark scorch marks; not charging.',
    path: '/src/assets/images/sample_laptop_hinge_1795094465250.jpg',
  },
];

// 7. AI Diagnosis Screen
export const AIDiagnosisScreen: React.FC = () => {
  const {
    devices,
    diagnoses,
    diagnosisDraftDeviceId,
    setDiagnosisDraftDeviceId,
    diagnosisDraftSymptom,
    setDiagnosisDraftSymptom,
    uploadedImage,
    setUploadedImage,
    setActiveDiagnosis,
    navigate,
    apiFetch,
    refreshWorkspaceData,
    showToast,
  } = useApp();

  const selectedDevice = devices.find((d) => d.id === diagnosisDraftDeviceId);
  const [customDeviceLabel, setCustomDeviceLabel] = useState('');
  const [customCategory, setCustomCategory] = useState<DeviceCategory>('Smartphone');
  const [submitting, setSubmitting] = useState(false);
  const [diagError, setDiagError] = useState<string | null>(null);

  const effectiveDeviceLabel = selectedDevice
    ? `${selectedDevice.brand} ${selectedDevice.model}`
    : customDeviceLabel.trim() || 'Electronic Device';
  const effectiveCategory = selectedDevice ? selectedDevice.category : customCategory;

  const handleRunDiagnosis = async (e: React.FormEvent) => {
    e.preventDefault();
    setDiagError(null);
    if (diagnosisDraftSymptom.trim().length < 8) {
      setDiagError('Please describe the problem in at least 8 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch<{ diagnosis: Diagnosis }>('/api/diagnose', {
        method: 'POST',
        body: JSON.stringify({
          deviceId: selectedDevice?.id ?? 'custom',
          deviceLabel: effectiveDeviceLabel,
          category: effectiveCategory,
          symptomDescription: diagnosisDraftSymptom.trim(),
          imageBase64: uploadedImage?.base64,
          imageMimeType: uploadedImage?.mimeType,
          sampleImagePath: uploadedImage?.samplePath,
        }),
      });
      setActiveDiagnosis(res.diagnosis);
      await refreshWorkspaceData();
      showToast('Preliminary AI fault assessment generated.');
      navigate('diagnosis-results');
    } catch (err) {
      setDiagError(err instanceof Error ? err.message : 'Failed to run Gemini diagnosis.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-950 dark:text-white">
            AI Smart Fault Diagnosis
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Describe symptoms and attach a photo for preliminary Gemini Vision analysis and cost estimation.
          </p>
        </div>
        {diagnoses.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setActiveDiagnosis(diagnoses[0]);
              navigate('diagnosis-results');
            }}
            className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer whitespace-nowrap"
          >
            View Latest Result ({diagnoses.length})
          </button>
        )}
      </div>

      {diagError && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-sm text-red-800 dark:text-red-200"
        >
          {diagError}
        </div>
      )}

      <form
        onSubmit={handleRunDiagnosis}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="diag-device-select"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Select Registered Device
            </label>
            <select
              id="diag-device-select"
              value={diagnosisDraftDeviceId}
              onChange={(e) => setDiagnosisDraftDeviceId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
            >
              {devices.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.brand} {d.model} ({d.category})
                </option>
              ))}
              <option value="custom">Other / Unlisted Device</option>
            </select>
          </div>

          {diagnosisDraftDeviceId === 'custom' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label
                  htmlFor="diag-custom-cat"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Category
                </label>
                <select
                  id="diag-custom-cat"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value as DeviceCategory)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                >
                  <option value="Smartphone">Smartphone</option>
                  <option value="Laptop">Laptop</option>
                  <option value="Tablet">Tablet</option>
                  <option value="Audio">Audio</option>
                  <option value="Appliance">Appliance</option>
                  <option value="Smartwatch">Smartwatch</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="diag-custom-name"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Brand &amp; Model
                </label>
                <input
                  id="diag-custom-name"
                  type="text"
                  value={customDeviceLabel}
                  onChange={(e) => setCustomDeviceLabel(e.target.value)}
                  placeholder="Dell XPS 13"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                />
              </div>
            </div>
          )}
        </div>

        <div>
          <label
            htmlFor="diag-symptoms"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
          >
            Describe the Symptoms
          </label>
          <textarea
            id="diag-symptoms"
            rows={4}
            required
            value={diagnosisDraftSymptom}
            onChange={(e) => setDiagnosisDraftSymptom(e.target.value)}
            placeholder="Example: Top corner screen glass cracked after dropping, vertical green lines flickering and touch intermittent..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {SAMPLE_PHOTOS.map((sample) => (
              <button
                key={sample.id}
                type="button"
                onClick={() => {
                  setDiagnosisDraftSymptom(sample.symptom);
                  setUploadedImage({
                    previewUrl: sample.path,
                    samplePath: sample.path,
                    fileName: sample.label,
                  });
                }}
                className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-600 cursor-pointer"
              >
                Use Sample: {sample.label}
              </button>
            ))}
          </div>
        </div>

        {/* Attached Photo Summary + Trigger to Image Upload Screen */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {uploadedImage ? (
              <img
                src={uploadedImage.previewUrl}
                alt="Attached damaged device"
                referrerPolicy="no-referrer"
                className="w-16 h-16 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                <Camera className="w-6 h-6 text-slate-500" />
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-slate-950 dark:text-white">
                {uploadedImage ? uploadedImage.fileName : 'No damage photo attached yet'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Visual evidence improves Gemini fault accuracy (JPEG, PNG, WebP up to 5 MB).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {uploadedImage && (
              <button
                type="button"
                onClick={() => setUploadedImage(null)}
                aria-label="Remove attached photo"
                className="p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-red-600 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate('image-upload')}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-white dark:hover:bg-slate-900 cursor-pointer whitespace-nowrap"
            >
              {uploadedImage ? 'Change Photo' : 'Upload Damage Photo'}
            </button>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            AI diagnoses are preliminary assessments, not confirmed technical inspections. Never
            puncture or heat swollen lithium batteries.
          </span>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Analyzing with Gemini Vision...</span>
            </>
          ) : (
            <>
              <Cpu className="w-4 h-4" />
              <span>Run Preliminary Diagnosis</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

// 8. Image Upload Screen
export const ImageUploadScreen: React.FC = () => {
  const { uploadedImage, setUploadedImage, navigate, setDiagnosisDraftSymptom } = useApp();
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const check = validateImageMeta(file.type, file.size);
    if (!check.valid) {
      setUploadError(check.error ?? 'Invalid image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setUploadedImage({
        previewUrl: result,
        base64: result,
        mimeType: file.type,
        fileName: file.name,
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-950 dark:text-white">
            Upload Damaged Device Photo
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Clear, well-lit photos of cracks, display lines, hinges, or charging ports work best.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('ai-diagnosis')}
          className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold cursor-pointer"
        >
          Back
        </button>
      </div>

      {uploadError && (
        <div
          role="alert"
          className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-sm text-red-800 dark:text-red-200"
        >
          {uploadError}
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6">
        <label
          htmlFor="device-photo-input"
          className="block border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-600 rounded-2xl p-8 text-center cursor-pointer transition-colors"
        >
          <ImagePlus className="w-8 h-8 text-emerald-600 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-950 dark:text-white">
            Click to choose a JPEG, PNG, or WebP photo
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Maximum file size 5 MB · EXIF location metadata stripped before upload
          </p>
          <input
            id="device-photo-input"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="sr-only"
          />
        </label>

        {uploadedImage && (
          <div className="space-y-3">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Selected Preview: {uploadedImage.fileName}
            </p>
            <img
              src={uploadedImage.previewUrl}
              alt="Selected damaged hardware preview"
              referrerPolicy="no-referrer"
              className="w-full max-h-80 object-cover rounded-xl border border-slate-200 dark:border-slate-700"
            />
          </div>
        )}

        <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Or select a sample diagnostic intake photo
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {SAMPLE_PHOTOS.map((sample) => (
              <button
                key={sample.id}
                type="button"
                onClick={() => {
                  setUploadedImage({
                    previewUrl: sample.path,
                    samplePath: sample.path,
                    fileName: sample.label,
                  });
                  setDiagnosisDraftSymptom(sample.symptom);
                }}
                className={`text-left rounded-xl border overflow-hidden transition-colors cursor-pointer ${
                  uploadedImage?.samplePath === sample.path
                    ? 'border-emerald-600 ring-2 ring-emerald-600/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-400'
                }`}
              >
                <img
                  src={sample.path}
                  alt={sample.label}
                  referrerPolicy="no-referrer"
                  className="w-full h-36 object-cover"
                />
                <div className="p-3">
                  <p className="text-xs font-semibold text-slate-950 dark:text-white">
                    {sample.label}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {sample.deviceName}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => navigate('ai-diagnosis')}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold cursor-pointer"
          >
            Confirm Photo &amp; Return
          </button>
        </div>
      </div>
    </div>
  );
};

// 9. Diagnosis Results Screen
export const DiagnosisResultsScreen: React.FC = () => {
  const { activeDiagnosis, diagnoses, setActiveDiagnosis, navigate } = useApp();
  const diag = activeDiagnosis ?? diagnoses[0];

  if (!diag) {
    return (
      <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-4">
        <h1 className="font-display text-xl font-bold">No Diagnosis Report Yet</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Submit a device symptom description and optional photo to generate a Gemini fault report.
        </p>
        <button
          type="button"
          onClick={() => navigate('ai-diagnosis')}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold cursor-pointer"
        >
          Start AI Diagnosis
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
            {diag.id} · {diag.deviceLabel} · {diag.category}
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-950 dark:text-white mt-1">
            {diag.preliminaryFault}
          </h1>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => navigate('ai-diagnosis')}
            className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold cursor-pointer"
          >
            New Diagnosis
          </button>
          <button
            type="button"
            onClick={() => navigate('nearby-techs')}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <span>Find Technicians</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Mandatory Disclaimer */}
      <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 flex items-start gap-3 text-xs sm:text-sm text-amber-900 dark:text-amber-200">
        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">Preliminary Assessment Disclaimer</p>
          <p className="mt-0.5">{diag.disclaimer}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          {/* Probable Causes */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Probable Root Causes</h2>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Severity: {diag.severity}
              </span>
            </div>
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {diag.probableCauses.map((item) => (
                <div key={item.cause} className="py-3.5 first:pt-0 last:pb-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-950 dark:text-white">
                      {item.cause}
                    </p>
                    <span className="text-xs font-mono text-emerald-700 dark:text-emerald-400 shrink-0">
                      {item.likelihood} Likelihood
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                    {item.explanation}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Safe Troubleshooting Steps */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="font-display text-lg font-bold">Safe Pre-Repair Precautions</h2>
            <ul className="space-y-3">
              {diag.safeTroubleshootingSteps.map((step) => (
                <li key={step} className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Estimator & Photo Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          {diag.imageUrl && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
              <img
                src={diag.imageUrl}
                alt={diag.deviceLabel}
                referrerPolicy="no-referrer"
                className="w-full h-48 object-cover"
              />
              <div className="p-4 text-xs text-slate-500 dark:text-slate-400">
                Submitted symptom: {diag.symptomDescription}
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="font-display text-lg font-bold">Estimated Cost Breakdown</h2>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Spare Parts Range</span>
                <span className="font-mono font-semibold tabular-nums">
                  {formatInr(diag.estimatedPartsCostMin)} – {formatInr(diag.estimatedPartsCostMax)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Bench Labour Range</span>
                <span className="font-mono font-semibold tabular-nums">
                  {formatInr(diag.estimatedLabourCostMin)} – {formatInr(diag.estimatedLabourCostMax)}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Turnaround Estimate</span>
                <span className="font-mono font-semibold tabular-nums">
                  ~{diag.estimatedTurnaroundHours} hrs
                </span>
              </div>
            </div>

            <div className="pt-2">
              <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-400 mb-3">
                <Wrench className="w-4 h-4" />
                <span>
                  {diag.requiresProfessional
                    ? 'Professional workshop inspection recommended'
                    : 'Safe for initial owner troubleshooting'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => navigate('booking')}
                className="w-full py-2.5 rounded-xl bg-slate-950 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-500 text-white text-sm font-semibold cursor-pointer"
              >
                Book Inspection with Diagnosis
              </button>
            </div>
          </div>

          {diagnoses.length > 1 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-2">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Previous Diagnoses
              </p>
              {diagnoses.slice(0, 4).map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setActiveDiagnosis(d)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs cursor-pointer ${
                    d.id === diag.id
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {d.deviceLabel} · {d.preliminaryFault}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
