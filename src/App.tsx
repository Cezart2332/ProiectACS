import { useState, useMemo, useEffect } from 'react'
import './App.css'

const PERSON_COUNT = 40
const TOTAL_PHOTO_COUNT = 10
const BACKEND_URL = 'http://127.0.0.1:5000'

function App() {
  // Database configuration
  const [trainSplit, setTrainSplit] = useState(80)
  
  // Algorithm and norm selection
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('nn')
  const [selectedNorm, setSelectedNorm] = useState('Euclidean')
  const [selectedK, setSelectedK] = useState(3)
  
  // Photo selection
  const [selectedTestPerson, setSelectedTestPerson] = useState(1)
  const [selectedTestPhoto, setSelectedTestPhoto] = useState(9)
  const [selectedTestPhotoIndex, setSelectedTestPhotoIndex] = useState(1) // Display index (1, 2, 3...)
  const [matchedPerson, setMatchedPerson] = useState(1)
  const [matchedPhoto, setMatchedPhoto] = useState(1)
  const [statsGraphSrc, setStatsGraphSrc] = useState<string | null>(null)
  const [preprocessingGraphSrc, setPreprocessingGraphSrc] = useState<string | null>(null)

  // Modal state
  const [showExportModal, setShowExportModal] = useState(false)
  const [isLoadingExport, setIsLoadingExport] = useState(false)
  const [isLoadingGraph, setIsLoadingGraph] = useState(false)
  const [isLoadingPreprocessingGraph, setIsLoadingPreprocessingGraph] = useState(false)

  // Image states
  const [testImage, setTestImage] = useState<string | null>(null)
  const [matchedImage, setMatchedImage] = useState<string | null>(null)
  const [loadingTestImage, setLoadingTestImage] = useState(false)
  const [loadingMatchedImage, setLoadingMatchedImage] = useState(false)
  const [feedbackModal, setFeedbackModal] = useState({
    open: false,
    title: '',
    message: '',
    variant: 'success' as 'success' | 'error',
  })

  const algorithms = ['nn', 'k_nn', 'Eigenfaces', 'Eigenfaces with RC', 'Lanczos', 'Tensor']
  const norms = ['Manhattan', 'Euclidean', 'Infinity', 'Cosinus']

  // Calculate training/testing split
  const trainingPhotos = Math.round((trainSplit / 100) * TOTAL_PHOTO_COUNT)
  const testingPhotos = TOTAL_PHOTO_COUNT - trainingPhotos

  // Generate person and photo options
  const persons = useMemo(() => 
    Array.from({ length: PERSON_COUNT }, (_, i) => i + 1), 
    []
  )

  // Map display index (1, 2, 3...) to actual photo indices
  const handleTestPhotoChange = (displayIndex: number) => {
    setSelectedTestPhotoIndex(displayIndex)
    const actualPhotoIndex = trainingPhotos + displayIndex
    setSelectedTestPhoto(actualPhotoIndex)
  }

  // Load test image when person or photo changes
  useEffect(() => {
    const loadTestImage = async () => {
      setLoadingTestImage(true)
      try {
        const response = await fetch(`${BACKEND_URL}/image/${selectedTestPerson}/${selectedTestPhoto}`)
        const data = await response.json()
        if (data.success) {
          setTestImage(data.image)
        } else {
          console.error('Failed to load test image:', data.error)
          setTestImage(null)
        }
      } catch (error) {
        console.error('Error loading test image:', error)
        setTestImage(null)
      } finally {
        setLoadingTestImage(false)
      }
    }

    loadTestImage()
  }, [selectedTestPerson, selectedTestPhoto])

  useEffect(() => {
    return () => {
      if (statsGraphSrc) {
        URL.revokeObjectURL(statsGraphSrc)
      }
      if (preprocessingGraphSrc) {
        URL.revokeObjectURL(preprocessingGraphSrc)
      }
    }
  }, [statsGraphSrc, preprocessingGraphSrc])

  const closeFeedbackModal = () => {
    setFeedbackModal((current) => ({ ...current, open: false }))
  }

  const openFeedbackModal = (title: string, message: string, variant: 'success' | 'error') => {
    setFeedbackModal({ open: true, title, message, variant })
  }

  const handleSearch = async () => {
    // Calculate the test photo index in the testing matrix
    const testPhotoIndex = testingPhotos * (selectedTestPerson - 1) + (selectedTestPhotoIndex - 1)
    
    console.log('Search clicked', { 
      selectedAlgorithm, 
      selectedNorm,
      selectedK,
      selectedTestPerson, 
      selectedTestPhoto,
      testPhotoIndex 
    })
    
    setLoadingMatchedImage(true)
    try {
      const response = await fetch(
        `${BACKEND_URL}/search/${testPhotoIndex}/${selectedAlgorithm}/${selectedNorm}/${selectedK}`
      )
      const data = await response.json()
      console.log('Search response:', data)
      
      if (data && data.success) {
        setMatchedPerson(data.matched_person)
        setMatchedPhoto(data.matched_photo)
        setMatchedImage(data.image)
      } else {
        console.error('Search failed:', data.error)
        openFeedbackModal('Search Failed', data.error || 'Unknown error', 'error')
      }
    } catch (error) {
      console.error('Search error:', error)
      openFeedbackModal('Search Error', 'Search failed. Make sure preprocessing has been run.', 'error')
    } finally {
      setLoadingMatchedImage(false)
    }
  }

  const handlePreprocessing = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/preprocessing/${trainingPhotos}`)
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Preprocessing failed')
      }
      const data = await response.text()
      openFeedbackModal('Preprocessing Complete', data || 'Dataset preprocessing finished successfully.', 'success')
    } catch (error) {
      console.error('Preprocessing error:', error)
      openFeedbackModal('Preprocessing Error', 'Unable to preprocess dataset. Check backend logs.', 'error')
    }
  }

  const handleExportStatistics = () => {
    setShowExportModal(true)
  }

  const handleExportFormat = async (format: 'txt' | 'csv') => {
    setIsLoadingExport(true)
    try {
      const response = await fetch(`${BACKEND_URL}/statistics/export/${format}`)
      
      if (!response.ok) {
        throw new Error('Failed to download statistics')
      }

      // Get the blob from response
      const blob = await response.blob()
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `statistici_recunoastere.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      setShowExportModal(false)
    } catch (error) {
      console.error('Error downloading statistics:', error)
      openFeedbackModal('Export Error', 'Failed to download statistics. Make sure preprocessing has been run.', 'error')
    } finally {
      setIsLoadingExport(false)
    }
  }

  const handleLoadStatisticsGraph = async () => {
    setIsLoadingGraph(true)
    try {
      const response = await fetch(`${BACKEND_URL}/statistics/graph`, {
        headers: {
          'Cache-Control': 'no-cache',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to generate statistics graph')
      }

      const blob = await response.blob()
      const objectUrl = URL.createObjectURL(blob)
      setStatsGraphSrc((previous) => {
        if (previous) {
          URL.revokeObjectURL(previous)
        }
        return objectUrl
      })
    } catch (error) {
      console.error('Error fetching statistics graph:', error)
      openFeedbackModal('Graph Error', 'Unable to render statistics graph. Ensure preprocessing and statistics have been executed.', 'error')
    } finally {
      setIsLoadingGraph(false)
    }
  }

  const handleLoadPreprocessingGraph = async () => {
    setIsLoadingPreprocessingGraph(true)
    try {
      const response = await fetch(`${BACKEND_URL}/statistics/preprocessing-graph`, {
        headers: {
          'Cache-Control': 'no-cache',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to generate preprocessing graph')
      }

      const blob = await response.blob()
      const objectUrl = URL.createObjectURL(blob)
      setPreprocessingGraphSrc((previous) => {
        if (previous) {
          URL.revokeObjectURL(previous)
        }
        return objectUrl
      })
    } catch (error) {
      console.error('Error fetching preprocessing graph:', error)
      openFeedbackModal('Graph Error', 'Unable to render preprocessing graph. Make sure preprocessing has run successfully.', 'error')
    } finally {
      setIsLoadingPreprocessingGraph(false)
    }
  }

  return (
    <div className="app-container">
      <div className="app-shell">
        <h1 className="app-title">Face Recognition System</h1>
        
        {/* Database Configuration */}
        <div className="config-section">
          <h2 className="section-title">Database Configuration</h2>
          <div className="slider-container">
            <div className="slider-labels">
              <span className="slider-label">Training: {trainSplit}%</span>
              <span className="slider-label">Testing: {100 - trainSplit}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="90"
              step="10"
              value={trainSplit}
              onChange={(e) => setTrainSplit(Number(e.target.value))}
              className="slider"
            />
            <div className="slider-info">
              {trainingPhotos} training photos · {testingPhotos} testing photos per person
            </div>
          </div>
        </div>

        {/* Algorithm Selection */}
        <div className="config-section">
          <h2 className="section-title">Algorithm</h2>
          <div className="options-grid">
            {algorithms.map((algo) => (
              <button
                key={algo}
                className={`option-card ${selectedAlgorithm === algo ? 'selected' : ''}`}
                onClick={() => setSelectedAlgorithm(algo)}
              >
                {algo}
              </button>
            ))}
          </div>
          
          {/* K Value Selection for k-NN */}
          {selectedAlgorithm === 'k_nn' && (
            <div className="k-selector">
              <label className="k-label">Select k value:</label>
              <div className="k-options">
                {[1, 3, 5, 7].map((k) => (
                  <button
                    key={k}
                    className={`k-button ${selectedK === k ? 'selected' : ''}`}
                    onClick={() => setSelectedK(k)}
                  >
                    k = {k}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Norm Selection */}
        <div className="config-section">
          <h2 className="section-title">Norm</h2>
          <div className="options-grid">
            {norms.map((norm) => (
              <button
                key={norm}
                className={`option-card ${selectedNorm === norm ? 'selected' : ''}`}
                onClick={() => setSelectedNorm(norm)}
              >
                {norm}
              </button>
            ))}
          </div>
        </div>

        {/* Photo Display */}
        <div className="photos-section">
          <div className="photo-panel">
            <h3 className="photo-title">Test Photo</h3>
            <div className="photo-selectors">
              <div className="selector-group">
                <label>Person</label>
                <select 
                  value={selectedTestPerson} 
                  onChange={(e) => setSelectedTestPerson(Number(e.target.value))}
                  className="photo-select"
                >
                  {persons.map((p) => (
                    <option key={p} value={p}>Person {p}</option>
                  ))}
                </select>
              </div>
              <div className="selector-group">
                <label>Photo</label>
                <select 
                  value={selectedTestPhotoIndex} 
                  onChange={(e) => handleTestPhotoChange(Number(e.target.value))}
                  className="photo-select"
                >
                  {Array.from({ length: testingPhotos }, (_, i) => i + 1).map((idx) => (
                    <option key={idx} value={idx}>Photo {idx}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="photo-display">
              <div className="photo-frame">
                {loadingTestImage ? (
                  <div className="image-loading">
                    <div className="small-spinner"></div>
                  </div>
                ) : testImage ? (
                  <img src={testImage} alt={`Person ${selectedTestPerson} Photo ${selectedTestPhotoIndex}`} className="face-image" />
                ) : (
                  <div className="photo-placeholder">
                    Person {selectedTestPerson} · Photo {selectedTestPhotoIndex}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="photo-panel">
            <h3 className="photo-title">Matched Photo</h3>
            <div className="photo-info">
              Person {matchedPerson} · Photo {matchedPhoto}
            </div>
            <div className="photo-display">
              <div className="photo-frame">
                {loadingMatchedImage ? (
                  <div className="image-loading">
                    <div className="small-spinner"></div>
                  </div>
                ) : matchedImage ? (
                  <img src={matchedImage} alt={`Person ${matchedPerson} Photo ${matchedPhoto}`} className="face-image" />
                ) : (
                  <div className="photo-placeholder">
                    Person {matchedPerson} · Photo {matchedPhoto}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="actions-section">
          <button className="action-button primary" onClick={handleSearch}>
            Search
          </button>
          <button className="action-button secondary" onClick={handlePreprocessing}>
            Preprocessing
          </button>
          <button className="action-button secondary" onClick={handleExportStatistics}>
            Export Statistics
          </button>
        </div>

        {/* Statistics Visualization */}
        <div className="graph-section">
          <h2 className="section-title">Statistics Overview</h2>
          <div className="graph-card">
            <div className="graph-header">
              <div>
                <h3 className="graph-title">Recognition vs. Time</h3>

              </div>
              <button
                className="graph-button"
                onClick={handleLoadStatisticsGraph}
                disabled={isLoadingGraph}
              >
                {isLoadingGraph ? 'Generating...' : 'Generate Graph'}
              </button>
            </div>
            <div className="graph-body">
              {isLoadingGraph ? (
                <div className="graph-loading">
                  <div className="loading-spinner"></div>
                  <span>Rendering chart...</span>
                </div>
              ) : statsGraphSrc ? (
                <img src={statsGraphSrc} alt="Statistics comparison graph" className="graph-image" />
              ) : (
                <div className="graph-placeholder">
                  Generate the chart after preprocessing to visualize recognition rates and response times for every algorithm.
                </div>
              )}
            </div>
          </div>

          <div className="graph-card">
            <div className="graph-header">
              <div>
                <h3 className="graph-title">Preprocessing Duration</h3>
              </div>
              <button
                className="graph-button"
                onClick={handleLoadPreprocessingGraph}
                disabled={isLoadingPreprocessingGraph}
              >
                {isLoadingPreprocessingGraph ? 'Generating...' : 'Generate Graph'}
              </button>
            </div>
            <div className="graph-body">
              {isLoadingPreprocessingGraph ? (
                <div className="graph-loading">
                  <div className="loading-spinner"></div>
                  <span>Rendering chart...</span>
                </div>
              ) : preprocessingGraphSrc ? (
                <img src={preprocessingGraphSrc} alt="Preprocessing time comparison graph" className="graph-image" />
              ) : (
                <div className="graph-placeholder">
                  Generate the chart to compare preprocessing times for Eigenfaces, Eigenfaces with RC, and Lanczos.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Export Modal */}
        {showExportModal && (
          <div className="modal-overlay" onClick={() => !isLoadingExport && setShowExportModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              {isLoadingExport ? (
                <>
                  <div className="loading-spinner-container">
                    <div className="loading-spinner"></div>
                    <h2 className="modal-title">Processing Statistics...</h2>
                    <p className="modal-description">
                      This may take a few moments while we calculate recognition rates and query times.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="modal-title">Export Statistics</h2>
                  <p className="modal-description">Choose the file format for your statistics export:</p>
                  
                  <div className="modal-buttons">
                    <button 
                      className="modal-button csv-button"
                      onClick={() => handleExportFormat('csv')}
                    >
                      <svg className="button-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <div>
                        <div className="button-format">CSV</div>
                        <div className="button-desc">Spreadsheet format</div>
                      </div>
                    </button>
                    
                    <button 
                      className="modal-button txt-button"
                      onClick={() => handleExportFormat('txt')}
                    >
                      <svg className="button-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <div>
                        <div className="button-format">TXT</div>
                        <div className="button-desc">Plain text format</div>
                      </div>
                    </button>
                  </div>
                  
                  <button 
                    className="modal-cancel"
                    onClick={() => setShowExportModal(false)}
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Feedback Modal */}
        {feedbackModal.open && (
          <div className="modal-overlay" onClick={closeFeedbackModal}>
            <div
              className={`modal-content feedback-modal ${feedbackModal.variant}`}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="modal-title">{feedbackModal.title}</h2>
              <p className="modal-description">{feedbackModal.message}</p>
              <button className="modal-cancel" onClick={closeFeedbackModal}>
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
