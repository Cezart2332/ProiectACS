import { useState, useMemo } from 'react'
import './App.css'

const PERSON_COUNT = 40
const TOTAL_PHOTO_COUNT = 10

function App() {
  // Database configuration
  const [trainSplit, setTrainSplit] = useState(80)
  
  // Algorithm and norm selection
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('NN')
  const [selectedNorm, setSelectedNorm] = useState('Euclidean')
  
  // Photo selection
  const [selectedTestPerson, setSelectedTestPerson] = useState(1)
  const [selectedTestPhoto, setSelectedTestPhoto] = useState(9)
  const [matchedPerson, setMatchedPerson] = useState(1)
  const [matchedPhoto, setMatchedPhoto] = useState(1)

  const algorithms = ['NN', 'kNN', 'Eigenfaces', 'Eigenfaces with RC', 'Lanczos', 'Tensor']
  const norms = ['Manhattan', 'Euclidean', 'Infinity', 'Cosinus']

  // Calculate training/testing split
  const trainingPhotos = Math.round((trainSplit / 100) * TOTAL_PHOTO_COUNT)
  const testingPhotos = TOTAL_PHOTO_COUNT - trainingPhotos

  // Generate person and photo options
  const persons = useMemo(() => 
    Array.from({ length: PERSON_COUNT }, (_, i) => i + 1), 
    []
  )
  
  const testPhotos = useMemo(() => 
    Array.from({ length: testingPhotos }, (_, i) => trainingPhotos + i + 1), 
    [trainingPhotos, testingPhotos]
  )

  const handleSearch = () => {
    // Placeholder for search functionality
    console.log('Search clicked', { selectedAlgorithm, selectedNorm, selectedTestPerson, selectedTestPhoto })
    // Simulate finding a match
    setMatchedPerson(selectedTestPerson)
    setMatchedPhoto(selectedTestPhoto)
  }

  const handlePreprocessing = () => {
    console.log('Preprocessing clicked', { trainSplit })
  }

  const handleExportStatistics = () => {
    console.log('Export statistics clicked')
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
                  value={selectedTestPhoto} 
                  onChange={(e) => setSelectedTestPhoto(Number(e.target.value))}
                  className="photo-select"
                >
                  {testPhotos.map((p) => (
                    <option key={p} value={p}>Photo {p}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="photo-display">
              <div className="photo-frame">
                <div className="photo-placeholder">
                  Person {selectedTestPerson} · Photo {selectedTestPhoto}
                </div>
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
                <div className="photo-placeholder">
                  Person {matchedPerson} · Photo {matchedPhoto}
                </div>
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
      </div>
    </div>
  )
}

export default App
