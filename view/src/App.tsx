import { useState, useRef, useEffect } from "react";
import { client } from "./lib/rpc";
import { exampleHtml, exampleExplanation } from "./constants/exampleHtml";

const suggestions = [
  "Landing page for a coffee shop with menu and location",
  "Modern analytics dashboard with interactive charts",
  "Personal portfolio for a developer with project showcase",
  "Product page for a mobile app with features",
  "Technology blog with articles and comment system",
  "E-commerce store for online clothing sales",
  "Corporate website for an AI startup",
  "Responsive login and registration system"
];

export default function App() {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState("");
  const [editableHtml, setEditableHtml] = useState("");
  const [explanation, setExplanation] = useState("");
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [workerName, setWorkerName] = useState("");
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployResult, setDeployResult] = useState<{ success: boolean; url: string; message: string } | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    setEditableHtml(generatedHtml);
  }, [generatedHtml]);

  useEffect(() => {
    // Update iframe content when editableHtml changes
    if (iframeRef.current && editableHtml) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(editableHtml);
        doc.close();
      }
    }
  }, [editableHtml]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsLoading(true);
    try {
      const result = await client.GENERATE_HTML({ prompt });
      setGeneratedHtml(result.html);
      setExplanation(result.explanation);
    } catch (error) {
      console.error("Erro ao gerar HTML:", error);
      setGeneratedHtml("<!-- Erro ao gerar HTML -->");
      setExplanation("Ocorreu um erro durante a geração do HTML.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setPrompt(suggestion);
  };

  const handleLoadExample = () => {
    setGeneratedHtml(exampleHtml);
    setExplanation(exampleExplanation);
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditableHtml(e.target.value);
  };

  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleDeploy = async () => {
    if (!workerName.trim() || !editableHtml) return;

    setIsDeploying(true);
    setDeployResult(null);

    try {
      const slugifiedName = slugify(workerName);
      const result = await client.DEPLOY_WORKER({
        workerName: slugifiedName,
        htmlCode: editableHtml
      });
      
      setDeployResult(result);
      
      if (result.success) {
        // Aguardar um pouco antes de abrir a URL para dar tempo do deploy propagar
        setTimeout(() => {
          window.open(result.url, '_blank');
        }, 2000);
      }
    } catch (error) {
      console.error("Erro ao fazer deploy:", error);
      setDeployResult({
        success: false,
        url: "",
        message: "Erro ao fazer deploy. Tente novamente."
      });
    } finally {
      setIsDeploying(false);
    }
  };

  const openDeployModal = () => {
    setWorkerName("");
    setDeployResult(null);
    setShowDeployModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">HTMLove</h1>
              <p className="text-sm text-gray-500 mt-1">Powered by Claude 4 AI</p>
            </div>
            <div className="flex items-center space-x-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <span className="w-1.5 h-1.5 rounded-full bg-green-600 mr-1.5 animate-pulse"></span>
                Ready
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Input */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Create HTML</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
                    Describe what you want to build
                  </label>
                  <textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition duration-200 text-gray-900"
                    placeholder="Example: A modern landing page for a startup..."
                    rows={6}
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleGenerate}
                    disabled={isLoading || !prompt.trim()}
                    className="flex-1 bg-blue-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition duration-200 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <span>✨</span>
                        <span>Generate</span>
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={handleLoadExample}
                    className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition duration-200"
                  >
                    Example
                  </button>
                </div>
              </div>
            </div>

            {/* Suggestions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Suggestions</h3>
              <div className="space-y-2">
                {suggestions.slice(0, 4).map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition duration-200"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Results */}
          <div className="lg:col-span-2">
            {generatedHtml ? (
              <div className="space-y-6">
                {explanation && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-blue-800">{explanation}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">Generated HTML</h3>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => navigator.clipboard.writeText(editableHtml)}
                        className="text-sm text-gray-600 hover:text-gray-900 font-medium flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy
                      </button>
                      <button
                        onClick={openDeployModal}
                        className="bg-green-600 text-white font-medium py-1.5 px-4 rounded-lg hover:bg-green-700 transition duration-200 text-sm flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        Deploy
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 divide-x divide-gray-200 h-[600px]">
                    {/* Code Editor */}
                    <div className="h-full bg-gray-900 flex">
                      {/* Line Numbers */}
                      <div className="bg-gray-800 text-gray-500 text-xs font-mono py-4 px-2 select-none overflow-y-auto" style={{ minWidth: '3.5rem' }}>
                        {editableHtml.split('\n').map((_, index) => (
                          <div key={index} className="text-right pr-2" style={{ lineHeight: '1.5rem' }}>
                            {index + 1}
                          </div>
                        ))}
                      </div>
                      {/* Code Editor */}
                      <textarea
                        value={editableHtml}
                        onChange={handleCodeChange}
                        className="flex-1 p-4 bg-gray-900 text-gray-100 font-mono text-sm resize-none focus:outline-none overflow-y-auto"
                        spellCheck={false}
                        style={{ lineHeight: '1.5rem' }}
                      />
                    </div>

                    {/* Preview */}
                    <div className="h-full bg-white overflow-hidden">
                      <iframe
                        ref={iframeRef}
                        className="w-full h-full border-0"
                        title="HTML Preview"
                        sandbox="allow-scripts allow-same-origin"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
                <div className="text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No HTML generated yet</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Describe what you want to create and click generate to get started.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Deploy Modal */}
      {showDeployModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Deploy to Cloudflare</h3>
            
            {!deployResult && (
              <>
                <div className="mb-6">
                  <label htmlFor="workerName" className="block text-sm font-medium text-gray-700 mb-2">
                    Worker Name
                  </label>
                  <input
                    type="text"
                    id="workerName"
                    value={workerName}
                    onChange={(e) => setWorkerName(e.target.value)}
                    placeholder="my-awesome-site"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Use only lowercase letters, numbers, and hyphens
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeployModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeploy}
                    disabled={!workerName.trim() || isDeploying}
                    className="flex-1 bg-green-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition duration-200 flex items-center justify-center gap-2"
                  >
                    {isDeploying ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Deploying...</span>
                      </>
                    ) : (
                      'Deploy'
                    )}
                  </button>
                </div>
              </>
            )}

            {deployResult && (
              <div>
                <div className={`p-4 rounded-lg mb-4 ${deployResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <div className="flex">
                    <div className="flex-shrink-0">
                      {deployResult.success ? (
                        <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div className="ml-3">
                      <h4 className={`text-sm font-medium ${deployResult.success ? 'text-green-800' : 'text-red-800'}`}>
                        {deployResult.success ? 'Deploy Successful!' : 'Deploy Failed'}
                      </h4>
                      <p className={`mt-1 text-sm ${deployResult.success ? 'text-green-700' : 'text-red-700'}`}>
                        {deployResult.message}
                      </p>
                      {deployResult.success && (
                        <a
                          href={deployResult.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 text-sm text-green-600 hover:text-green-800 underline block"
                        >
                          {deployResult.url}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => setShowDeployModal(false)}
                  className="w-full px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition duration-200"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
