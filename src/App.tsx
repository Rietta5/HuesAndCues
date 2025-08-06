import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid'; // Import uuid library
import toast, { Toaster } from 'react-hot-toast'; // Import toast and Toaster
import GameBoard from './components/GameBoard';
// Removed imports: useGameContext, PlayerSetup, GameControls, TabsPanel

// Constante para activar/desactivar elementos de desarrollo - Kept for potential future use
const IS_DEBUG = false;

// Define the structure for a row in the CSV
interface ClueWord {
  id: string;
  word: string;
  category: string;
}

// Define the structure for the submission data
interface GuessData {
  userId: string;
  clueId: string; // Added from ClueWord
  word: string; // The actual word used as the clue
  clueCategory: string; // Added from ClueWord
  coordinate: string; // e.g., "A10", "P5"
  language: string; // Add language field
  gender: string; // Add gender field
  ageRange: string; // Add age range field
  timestamp: Date;
}

// Define the structure for board cell data
interface BoardCell {
  coordinate: string; // e.g., "A1", "B2"
  x: string; // Letter A-P
  y: number; // Number 1-30
  r: number;
  g: number;
  b: number;
}

// Define language type
type Language = 'spanish' | 'english';

// Define gender type
type Gender = 'male' | 'female' | 'other' | 'prefer-not-to-say';

// Define age range type
type AgeRange = '-10' | '10-19' | '20-29' | '30-39' | '40-49' | '50-59' | '60-69' | '+70';

// Localization constants
// const GENDER_LABELS = {
//   spanish: {
//     male: 'Masculino',
//     female: 'Femenino',
//     other: 'Otro',
//     'prefer-not-to-say': 'Prefiero no decir'
//   },
//   english: {
//     male: 'Male',
//     female: 'Female',
//     other: 'Other',
//     'prefer-not-to-say': 'Prefer not to say'
//   }
// };

// const AGE_RANGE_LABELS = {
//   spanish: {
//     '10-19': '10-19 años',
//     '20-29': '20-29 años',
//     '30-39': '30-39 años',
//     '40-49': '40-49 años',
//     '50-59': '50-59 años',
//     '60+': '60+ años'
//   },
//   english: {
//     '10-19': '10-19 years',
//     '20-29': '20-29 years',
//     '30-39': '30-39 years',
//     '40-49': '40-49 years',
//     '50-59': '50-59 years',
//     '60+': '60+ years'
//   }
// };

// Nuevo: Estado para guardar las respuestas históricas de otros jugadores
type HistoricResponse = {
  userId: string;
  timestamp: string;
  clueCategory: string;
  clueId: string;
  word: string;
  coordinate: string;
  language: string;
  gender: string;
  ageRange: string;
};

const App: React.FC = () => {
  // State for the single player game
  const [userId, setUserId] = useState<string | null>(null);
  // Changed state to hold ClueWord objects
  const [allWords, setAllWords] = useState<ClueWord[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(0);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [coordinateInput, setCoordinateInput] = useState<string>('');
  const [inputError, setInputError] = useState<string | null>(null);
  const [submittedGuesses, setSubmittedGuesses] = useState<GuessData[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('spanish'); // Add language state
  const [selectedGender, setSelectedGender] = useState<Gender | null>(null); // Add gender state
  const [selectedAgeRange, setSelectedAgeRange] = useState<AgeRange | null>(null); // Add age range state
  // State for board data
  const [boardData, setBoardData] = useState<BoardCell[]>([]);
  const [isBoardLoading, setIsBoardLoading] = useState<boolean>(false);
  // NUEVOS ESTADOS PARA MODALES
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showDemographicModal, setShowDemographicModal] = useState(false);
  const [showExplanationModal, setShowExplanationModal] = useState(false);
  // Ajuste: idioma como 'es' | 'en' para los modales, pero se mapea internamente
  const [modalLanguage, setModalLanguage] = useState<'es' | 'en'>('es');
  const [modalGender, setModalGender] = useState<string>('');
  const [modalAge, setModalAge] = useState<string>('');
  // Nuevo estado para cachear palabras por idioma
  const [cachedWords, setCachedWords] = useState<{ [lang in Language]?: ClueWord[] }>({});

  const [historicResponses, setHistoricResponses] = useState<HistoricResponse[]>([]);
  const [feedbackCoords, setFeedbackCoords] = useState<string[]>([]);
  // Estado para mostrar feedback y controlar el avance
  const [showFeedback, setShowFeedback] = useState(false);

  // Function to get CSV URL based on language
  const getCSVUrl = (language: Language): string => {
    const baseUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQzJK78x6lOSPbDV_L0DLSxAPYCwnOylPAmr2A6lSwnMgqYpo2XZG7oTYG3cYw-OPkrtz8NMG09iUuB/pub';
    const gid = language === 'spanish' ? '0' : '1108232040';
    return `${baseUrl}?gid=${gid}&single=true&output=csv`;
  };

  // Fetch words from CSV based on selected language
  const fetchWords = async (language: Language, preloadedWords?: ClueWord[]) => {
    setIsSubmitting(true);
    try {
      if (preloadedWords) {
        setAllWords(preloadedWords);
        return;
      }
      const csvUrl = getCSVUrl(language);
      const response = await fetch(csvUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const text = await response.text();
      const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      if (lines.length <= 1) {
        throw new Error("CSV file has no data rows.");
      }
      const dataLines = lines.slice(1);
      const parsedWords: ClueWord[] = dataLines.map((line, index) => {
        const columns = line.split(',');
        if (columns.length >= 3) {
          return {
            id: columns[0].trim(),
            word: columns[1].trim(),
            category: columns[2].trim(),
          };
        } else {
          console.warn(`Skipping invalid CSV line ${index + 1}: ${line}`);
          return null;
        }
      }).filter((word): word is ClueWord => word !== null);
      setAllWords(parsedWords);
      // Cachear en memoria
      setCachedWords(prev => ({ ...prev, [language]: parsedWords }));
      if (parsedWords.length === 0) {
        console.warn("No valid clue words parsed from the CSV.");
        toast.error('Could not parse any valid words from the file.');
      }
    } catch (error) {
      console.error("Failed to load or parse words:", error);
      toast.error(`Failed to load clue words: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fetch board data from CSV
  const fetchBoardData = async () => {
    setIsBoardLoading(true);
    try {
      const response = await fetch('/HC_RGB.csv');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const text = await response.text();

      // Parse CSV text, skipping header
      const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

      if (lines.length <= 1) {
        throw new Error("Board CSV file has no data rows.");
      }

      // Skip header row (first line)
      const dataLines = lines.slice(1);

      const parsedBoardData: BoardCell[] = dataLines.map((line, index) => {
        const columns = line.split(',');
        // Validate we have exactly 5 columns: coordenada_x, coordenada_y, R, G, B
        if (columns.length >= 5) {
          const x = columns[0].trim();
          const y = parseInt(columns[1].trim(), 10);
          const r = parseInt(columns[2].trim(), 10);
          const g = parseInt(columns[3].trim(), 10);
          const b = parseInt(columns[4].trim(), 10);

          return {
            coordinate: `${x}${y}`,
            x,
            y,
            r,
            g,
            b,
          };
        } else {
          console.warn(`Skipping invalid board CSV line ${index + 1}: ${line}`);
          return null;
        }
      }).filter((cell): cell is BoardCell => cell !== null);

      setBoardData(parsedBoardData);
      if (parsedBoardData.length === 0) {
        console.warn("No valid board data parsed from the CSV.");
        toast.error('Could not parse board data from the file.');
      }

    } catch (error) {
      console.error("Failed to load or parse board data:", error);
      toast.error(`Failed to load board data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsBoardLoading(false);
    }
  };

  // Effect for responsive height (kept from original)
  useEffect(() => {
    const setAppHeight = () => {
      const doc = document.documentElement;
      doc.style.setProperty('--app-height', `${window.innerHeight}px`);
    };

    window.addEventListener('resize', setAppHeight);
    window.addEventListener('orientationchange', setAppHeight);
    setAppHeight();
    window.setTimeout(setAppHeight, 300); // Ensure update after load

    return () => {
      window.removeEventListener('resize', setAppHeight);
      window.removeEventListener('orientationchange', setAppHeight);
    };
  }, []);

  // Effect to load board data on component mount
  useEffect(() => {
    fetchBoardData();
  }, []);

  // Mostrar el modal de idioma automáticamente al cargar la app
  useEffect(() => {
    setShowLanguageModal(true);
  }, []);

  // Descargar palabras de ambos idiomas al cargar la app (en segundo plano)
  useEffect(() => {
    (async () => {
      if (!cachedWords['spanish']) {
        fetchWords('spanish');
      }
      if (!cachedWords['english']) {
        fetchWords('english');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Descargar y parsear el CSV de partidas guardadas al cargar la app
  useEffect(() => {
    const fetchHistoricResponses = async () => {
      try {
        const url = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTTpt6GaiBfYs2KvHCpVyCLgtMLcd3oMlFOn_IcnZwbSB_yapmiUOVhCFtN4uxiuI6Z7rmjXKZ4McKj/pub?output=csv';
        const response = await fetch(url);
        if (!response.ok) throw new Error('No se pudo descargar el CSV de partidas.');
        const text = await response.text();
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length < 2) return;
        const data = lines.slice(1).map(line => {
          const cols = line.split(',');
          // Aseguramos que hay suficientes columnas
          if (cols.length < 9) return null;
          return {
            userId: cols[0],
            timestamp: cols[1],
            clueCategory: cols[2],
            clueId: cols[3],
            word: cols[4],
            coordinate: cols[5],
            language: cols[6],
            gender: cols[7],
            ageRange: cols[8],
          };
        }).filter(Boolean) as HistoricResponse[];
        setHistoricResponses(data);
      } catch (e) {
        console.error('Error descargando partidas históricas:', e);
      }
    };
    fetchHistoricResponses();
  }, []);

  // Helper functions for translations
  // Eliminar la línea de showUserDataSelector y setShowUserDataSelector
  // Eliminar las funciones getGenderLabel, getAgeRangeLabel y startGame si no se usan
  // Corregir los tipos de setState para aceptar string
  // ELIMINADO: setSelectedLanguage(langMap[modalLanguage as 'es' | 'en'] as Language);
  // ELIMINADO: setSelectedGender(genderMap[modalGender as keyof typeof genderMap] as Gender);
  // ELIMINADO: setSelectedAgeRange(ageMap[modalAge as keyof typeof ageMap] as AgeRange);
  // Function to start a new game
  // Eliminar la línea de showUserDataSelector y setShowUserDataSelector
  // Eliminar las funciones getGenderLabel, getAgeRangeLabel y startGame si no se usan
  // Corregir los tipos de setState para aceptar string
  // Función para manejar la selección de idioma en el modal
  const handleLanguageSelect = (lang: 'es' | 'en') => {
    setModalLanguage(lang);
    setShowLanguageModal(false);
    setShowDemographicModal(true);
  };

  // Función para manejar la continuación tras datos demográficos
  const handleDemographicContinue = () => {
    if (!modalGender || !modalAge) return;
    setShowDemographicModal(false);
    setShowExplanationModal(true);
  };

  // Función para iniciar el juego tras la explicación
  const handleExplanationStart = async () => {
    const langMap = { es: 'spanish', en: 'english' };
    const genderMap = {
      'Femenino': 'female',
      'Masculino': 'male',
      'Otro': 'other',
      'Prefiero no decirlo': 'prefer-not-to-say',
      'Female': 'female',
      'Male': 'male',
      'Other': 'other',
      'Prefer not to say': 'prefer-not-to-say',
    };
    const ageMap = {
      '-10': '-10',
      '10-19': '10-19',
      '20-29': '20-29',
      '30-39': '30-39',
      '40-49': '40-49',
      '50-59': '50-59',
      '60-69': '60-69',
      '+70': '+70',
    };
    setSelectedLanguage(langMap[modalLanguage as 'es' | 'en'] as Language);
    setSelectedGender(genderMap[modalGender as keyof typeof genderMap] as Gender);
    setSelectedAgeRange(ageMap[modalAge as keyof typeof ageMap] as AgeRange);
    setShowExplanationModal(false);
    setUserId(uuidv4());
    setCurrentWordIndex(0);
    setCoordinateInput('');
    setInputError(null);
    setSubmittedGuesses([]);
    setIsSubmitting(false);
    // Usa las palabras cacheadas si existen
    const preloaded = cachedWords[langMap[modalLanguage as 'es' | 'en'] as Language];
    await fetchWords(langMap[modalLanguage as 'es' | 'en'] as Language, preloaded);
    setGameStarted(true);
  };

  // Validate coordinate input (A-P, 1-30)
  const validateCoordinate = (input: string): boolean => {
    const regex = /^[A-P]([1-9]|[12][0-9]|30)$/i; // Case-insensitive
    return regex.test(input.trim());
  };

  // Handle input change
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setCoordinateInput(value);
    if (inputError) { // Clear error on new input
      setInputError(null);
    }
  };

  // Handle cell click from the board
  const handleCellClick = (coordinate: string) => {
    setCoordinateInput(coordinate);
    if (inputError) {
      setInputError(null);
    }
  };

  // Refactored handleSubmitGuess to return success status
  const handleSubmitGuess = async (data: GuessData): Promise<boolean> => {
    console.log("Submitting guess:", data);
    const apiUrl = "https://script.google.com/macros/s/AKfycbz2mG4_KGa1onOMMi5Kp2hLE65_YtLh4Evsnq1d6ExNCECE0UcWViW5UUv9lW6RWXsk/exec";
    setIsSubmitting(true);
    let success = false;

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: JSON.stringify(data),
      });

      console.log("Fetch attempt completed. Status code:", response.status);

      if (response.ok) {
        console.log("Submission successful.");
        success = true;
        setSubmittedGuesses(prev => [...prev, data]);
      } else {
        console.warn(`Submission potentially failed with status: ${response.status}`);
      }

    } catch (error) {
      console.error("Error submitting guess:", error);
      success = false;
    } finally {
      setIsSubmitting(false);
    }

    return success;
  };

  // Refactored handleFormSubmit to use async/await and toast
  const handleFormSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;

    const trimmedInput = coordinateInput.trim().toUpperCase();

    if (!validateCoordinate(trimmedInput)) {
      setInputError("Invalid format. Use Letter (A-P) followed by Number (1-30), e.g., 'H15'.");
      return;
    }

    if (!userId) {
      console.error("User ID not set. Cannot submit guess.");
      setInputError("Game error: User ID missing.");
      toast.error("Game error occurred. Please refresh.");
      return;
    }

    if (currentWordIndex >= allWords.length) {
      console.warn("Attempted to submit after all words shown.");
      return;
    }

    // Get current clue object
    const currentClue = allWords[currentWordIndex];
    if (!currentClue) {
      console.error(`Error: No clue found at index ${currentWordIndex}`);
      toast.error("Game error: Could not find current clue.");
      return;
    }

    // Create guessData with id, word, and category from the current clue
    const guessData: GuessData = {
      userId: userId,
      clueId: currentClue.id,
      word: currentClue.word,
      clueCategory: currentClue.category,
      coordinate: trimmedInput,
      language: selectedLanguage, // Add selected language
      gender: selectedGender!, // Add selected gender (! because it's validated above)
      ageRange: selectedAgeRange!, // Add selected age range (! because it's validated above)
      timestamp: new Date(),
    };

    // Await the submission result
    const success = await handleSubmitGuess(guessData);

    if (success) {
      // Feedback: seleccionar hasta 4 respuestas aleatorias de otros jugadores para la misma palabra
      const currentClueId = currentClue.id;
      const candidates = historicResponses.filter(r => r.clueId === currentClueId && r.coordinate && r.coordinate !== trimmedInput);
      // Mezclar y tomar hasta 4
      const shuffled = candidates.sort(() => Math.random() - 0.5);
      const coords = shuffled.slice(0, 4).map(r => r.coordinate);
      setFeedbackCoords(coords);
      setShowFeedback(true);
      toast.success("Guess registered successfully!");
      // El avance de palabra se hace con handleNextWord
    } else {
      toast.error("Failed to register guess. Please try again.");
    }
  };

  // --- Rendering Logic ---

  // MODALES: se renderizan condicionalmente dentro del return principal
  const renderLanguageModal = () => (
    <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
      <div className="bg-[#FF746C] rounded-lg p-8 max-w-md w-full mx-4 text-center">
        <h2 className="text-2xl font-bold mb-6 text-black" style={{ fontFamily: 'TikiTropic, Arial, sans-serif' }}>
          Elige tu idioma
        </h2>
        <div className="flex justify-center space-x-8 mb-6">
          <button
            onClick={() => handleLanguageSelect('es')}
            className="flex flex-col items-center p-4 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <img 
              src="/esp.png" 
              alt="Bandera de España" 
              className="w-20 h-14 mb-2 object-cover rounded shadow-md"
            />
            <span className="text-sm font-medium text-black" style={{ fontFamily: 'TikiTropic, Arial, sans-serif' }}>Español</span>
          </button>
          <button
            onClick={() => handleLanguageSelect('en')}
            className="flex flex-col items-center p-4 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <img 
              src="/ing.svg" 
              alt="Bandera del Reino Unido" 
              className="w-20 h-14 mb-2 object-cover rounded shadow-md"
            />
            <span className="text-sm font-medium text-black" style={{ fontFamily: 'TikiTropic, Arial, sans-serif' }}>English</span>
          </button>
        </div>
        <p className="text-lg font-semibold text-black" style={{ fontFamily: 'TikiTropic, Arial, sans-serif' }}>
          Choose your language
        </p>
      </div>
    </div>
  );

  const renderDemographicModal = () => {
    const texts = {
      es: {
        title: 'Información demográfica',
        gender: 'Género',
        age: 'Rango de edad',
        continue: 'Continuar',
        genderOptions: ['Femenino', 'Masculino', 'Otro', 'Prefiero no decirlo'],
        ageOptions: ['-10', '10-19', '20-29', '30-39', '40-49', '50-59', '60-69', '+70']
      },
      en: {
        title: 'Demographic information',
        gender: 'Gender',
        age: 'Age range',
        continue: 'Continue',
        genderOptions: ['Female', 'Male', 'Other', 'Prefer not to say'],
        ageOptions: ['-10', '10-19', '20-29', '30-39', '40-49', '50-59', '60-69', '+70']
      }
    };
    const currentTexts = texts[modalLanguage];
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
        <div className="bg-[#FF746C] rounded-lg p-8 max-w-md w-full mx-4 text-center">
          <h2 className="text-2xl font-bold mb-6 text-black" style={{ fontFamily: 'TikiTropic, Arial, sans-serif' }}>{currentTexts.title}</h2>
          <div className="mb-6">
            <label className="block mb-2 text-lg text-black" style={{ fontFamily: 'TikiTropic, Arial, sans-serif' }}>{currentTexts.gender}</label>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {currentTexts.genderOptions.map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setModalGender(opt)}
                  className={`px-4 py-2 rounded-lg border font-medium transition-colors duration-150
                    ${modalGender === opt
                      ? 'bg-[#eff6ff] text-[#1d4ed8] border-[#3b82f6] font-bold shadow-md'
                      : 'bg-white text-black border-gray-300 hover:bg-gray-100'}`}
                  style={{ fontFamily: 'TikiTropic, Arial, sans-serif' }}
                >
                  {opt}
                </button>
              ))}
            </div>
            <label className="block mb-2 text-lg text-black" style={{ fontFamily: 'TikiTropic, Arial, sans-serif' }}>{currentTexts.age}</label>
            <div className="grid grid-cols-2 gap-2">
              {currentTexts.ageOptions.map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setModalAge(opt)}
                  className={`px-4 py-2 rounded-lg border font-medium transition-colors duration-150
                    ${modalAge === opt
                      ? 'bg-[#eff6ff] text-[#1d4ed8] border-[#3b82f6] font-bold shadow-md'
                      : 'bg-white text-black border-gray-300 hover:bg-gray-100'}`}
                  style={{ fontFamily: 'TikiTropic, Arial, sans-serif' }}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={handleDemographicContinue}
            disabled={!modalGender || !modalAge}
            className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold py-3 px-6 rounded-lg text-lg transition-all duration-200 disabled:opacity-50"
          >
            {currentTexts.continue}
          </button>
        </div>
      </div>
    );
  };

  const renderExplanationModal = () => {
    const texts = {
      es: {
        title: 'Explicación del juego',
        start: 'Empezar',
        body: [
          '¡Bienvenido a Hues & Cues! Vas a jugar varias rondas de este emocionante juego de percepción de color.',
          '',
          '🎯 OBJETIVO DEL JUEGO:',
          'Selecciona en el tablero el color que más asocies con la palabra que se te muestra.',
          '',
          '📋 CÓMO JUGAR:',
          '1. Observa la palabra que aparece en la parte superior.',
          '2. Haz clic en el color del tablero que creas que mejor representa esa palabra, o escribe la casilla correspondiente.',
          '3. Repite el proceso para cada palabra.',
          '',
          '🎮 CONSEJOS:',
          '• No hay respuestas correctas o incorrectas, ¡es tu percepción!',
          '• Confía en tu intuición y diviértete.',
        ].join('\n'),
      },
      en: {
        title: 'Game explanation',
        start: 'Start',
        body: [
          'Welcome to Hues & Cues! You will play several rounds of this exciting color perception game.',
          '',
          '🎯 GAME OBJECTIVE:',
          'Select on the board the color you most associate with the word shown.',
          '',
          '📋 HOW TO PLAY:',
          '1. Look at the word displayed at the top.',
          '2. Click on the color on the board that you think best represents that word, or type the cell.',
          '3. Repeat the process for each word.',
          '',
          '🎮 TIPS:',
          '• There are no right or wrong answers—trust your perception!',
          '• Go with your intuition and have fun.',
        ].join('\n'),
      }
    };
    const currentTexts = texts[modalLanguage];
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
        <div className="bg-[#FF746C] rounded-lg p-8 max-w-md w-full mx-4 text-center">
          <h2 className="text-2xl font-bold mb-6 text-black font-kinddaily">{currentTexts.title}</h2>
          <pre className="mb-8 text-base text-black text-left whitespace-pre-wrap leading-relaxed" style={{ fontFamily: 'inherit' }}>{currentTexts.body}</pre>
          <button
            onClick={handleExplanationStart}
            className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold py-3 px-6 rounded-lg text-lg transition-all duration-200"
          >
            {currentTexts.start}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white" style={{ backgroundColor: '#ffffff' }}>
      <Toaster position="top-center" reverseOrder={false} />
      {/* Renderizar los modales si corresponde */}
      {showLanguageModal && renderLanguageModal()}
      {showDemographicModal && renderDemographicModal()}
      {showExplanationModal && renderExplanationModal()}
      {/* El resto del contenido solo se muestra si no hay modales activos */}
      {!showLanguageModal && !showDemographicModal && !showExplanationModal && (
        <div className="app-container mx-auto px-2 py-6 max-w-full flex flex-col items-center">
          <header className="app-header mb-6 pb-4 border-b border-gray-200 w-full">
            <h1 className="text-3xl font-bold text-center text-gray-900 font-kinddaily">Hues & Cues</h1>
          </header>
          {/* Texto de ayuda debajo del título */}
          {gameStarted && (
            <div className="w-full max-w-6xl mx-auto mb-4">
              <p className="text-center text-base text-gray-700 font-medium">
                {selectedLanguage === 'spanish'
                  ? 'Pulsa en el tablero o escribe la casilla'
                  : 'Click on the board or type the cell'}
              </p>
            </div>
          )}
          {/* Fila superior: pista a la izquierda, input a la derecha */}
          {gameStarted && (
            <div className="w-full max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-stretch mb-6 gap-4">
              {/* Pista actual a la izquierda */}
              <div className="flex-1 flex flex-col items-start justify-start bg-gray-50 rounded-lg p-4 min-w-[220px]">
                <h2 className="text-xl font-semibold mb-2">{selectedLanguage === 'spanish' ? 'Palabra actual' : 'Current Clue'}:</h2>
                <p className="text-2xl font-bold mb-2 bg-gray-100 p-3 rounded">
                  {currentWordIndex < allWords.length ? allWords[currentWordIndex]?.word : "Game Over!"}
                </p>
                {currentWordIndex < allWords.length && allWords[currentWordIndex]?.category && (
                  <p className="text-sm text-gray-600 bg-gray-50 px-2 py-1 rounded">
                    {selectedLanguage === 'spanish' ? 'Categoría' : 'Category'}: {allWords[currentWordIndex]?.category}
                  </p>
                )}
                <span className="text-base text-gray-700 mt-2">
                  {selectedLanguage === 'spanish' ? 'Casilla seleccionada' : 'Selected cell'}: {coordinateInput || '-'}
                </span>
              </div>
              {/* Input de coordenada a la derecha */}
              {currentWordIndex < allWords.length && (
                <form onSubmit={handleFormSubmit} className="flex-1 flex flex-col items-end justify-start bg-gray-50 rounded-lg p-4 min-w-[220px] max-w-md mx-auto space-y-3">
                  <label htmlFor="coordinateInput" className="block text-sm font-medium text-gray-700">
                    {selectedLanguage === 'spanish' ? 'Introduce la coordenada (ej: H15):' : 'Enter Coordinate (e.g., H15):'}
                  </label>
                  <input
                    type="text"
                    id="coordinateInput"
                    value={coordinateInput}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full px-3 py-2 border ${inputError ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                    placeholder="A1 - P30"
                    maxLength={3}
                    disabled={isSubmitting || currentWordIndex >= allWords.length || showFeedback}
                  />
                  {inputError && <p className="text-red-500 text-xs mt-1">{inputError}</p>}
                  <button
                    type="submit"
                    className="w-full bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!coordinateInput || !!inputError || isSubmitting || currentWordIndex >= allWords.length || showFeedback}
                  >
                    {isSubmitting ? (selectedLanguage === 'spanish' ? 'Enviando...' : 'Submitting...') : (selectedLanguage === 'spanish' ? 'Enviar' : 'Submit Guess')}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Tablero grande y centrado */}
          <div className="w-full flex justify-center items-center mb-6">
            <div className="w-full max-w-6xl">
              <GameBoard
                boardData={boardData}
                onCellClick={handleCellClick}
                isLoading={isBoardLoading}
                feedbackCoords={feedbackCoords}
              />
            </div>
          </div>
          {showFeedback && (
            <div className="w-full flex justify-center my-4">
              <button
                onClick={handleNextWord}
                className="bg-blue-600 hover:bg-blue-800 text-white font-bold py-3 px-8 rounded-lg text-lg shadow-md transition-all duration-200"
              >
                {selectedLanguage === 'spanish' ? 'Siguiente' : 'Next'}
              </button>
            </div>
          )}
        </div>
      )}
      {/* Debug info si es necesario */}
      {IS_DEBUG && gameStarted && (
        <div className="mt-10 p-4 bg-gray-100 text-xs text-gray-600 rounded-md font-mono w-full order-last">
          <div>User ID: {userId}</div>
          <div>Language: {selectedLanguage}</div>
          <div>Gender: {selectedGender}</div>
          <div>Age Range: {selectedAgeRange}</div>
          <div>Word Index: {currentWordIndex} / {allWords.length}</div>
          <div>Current Clue: {JSON.stringify(allWords[currentWordIndex])}</div>
          <div>Current Input: {coordinateInput}</div>
          <div>Input Error: {inputError || 'None'}</div>
          <div>Guesses This Game: {submittedGuesses.length}</div>
          <div>Is Submitting: {isSubmitting.toString()}</div>
        </div>
      )}
    </div>
  );
};

export default App; 