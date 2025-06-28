// Navigation functionality
document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    // Mobile menu toggle
    hamburger.addEventListener('click', function() {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // Close mobile menu when clicking on a link
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    // Smooth scrolling for navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Initialize all tools
    initTextToSpeech();
    initQRGenerator();
    initPasswordGenerator();
    initWordCounter();
    initColorPicker();
    initUnitConverter();
    initBMICalculator();
    initJSONFormatter();
    initThemeToggle(); // Initialize theme toggle
    registerServiceWorker(); // Register Service Worker
});

// Service Worker Registration
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('Service Worker registered successfully:', registration);
                })
                .catch(error => {
                    console.error('Service Worker registration failed:', error);
                });
        });
    } else {
        console.log('Service Worker not supported in this browser.');
    }
}

// Theme Toggle Functionality
function initThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle-checkbox');
    const body = document.body;
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');

    function applyTheme(theme) {
        if (theme === 'dark') {
            body.classList.add('dark-mode');
            themeToggle.checked = true;
        } else {
            body.classList.remove('dark-mode');
            themeToggle.checked = false;
        }
    }

    // Check local storage first
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        applyTheme(savedTheme);
    } else if (prefersDarkScheme.matches) { // Then check system preference
        applyTheme('dark');
        localStorage.setItem('theme', 'dark'); // Save system preference if no local storage
    } else {
        applyTheme('light'); // Default to light
    }

    themeToggle.addEventListener('change', function() {
        if (this.checked) {
            applyTheme('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            applyTheme('light');
            localStorage.setItem('theme', 'light');
        }
    });

    // Listen for changes in system preference
    prefersDarkScheme.addEventListener('change', (e) => {
        const currentLocalStorageTheme = localStorage.getItem('theme');
        // Only update if user hasn't manually overridden system preference via toggle
        if (!currentLocalStorageTheme || 
            (currentLocalStorageTheme === 'dark' && !e.matches) || 
            (currentLocalStorageTheme === 'light' && e.matches)) {
            if (e.matches) {
                applyTheme('dark');
                localStorage.setItem('theme', 'dark');
            } else {
                applyTheme('light');
                localStorage.setItem('theme', 'light');
            }
        }
    });
}


// 1. Text to Speech Tool
function initTextToSpeech() {
    const textInput = document.getElementById('tts-text');
    const voiceSelect = document.getElementById('voice-select');
    const rateSlider = document.getElementById('rate-slider');
    const pitchSlider = document.getElementById('pitch-slider');
    const rateValue = document.getElementById('rate-value');
    const pitchValue = document.getElementById('pitch-value');
    const speakBtn = document.getElementById('speak-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const stopBtn = document.getElementById('stop-btn');

    let voices = [];
    let currentUtterance = null;

    // Load voices
    function loadVoices() {
        voices = speechSynthesis.getVoices();
        voiceSelect.innerHTML = '';
        
        voices.forEach((voice, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = `${voice.name} (${voice.lang})`;
            voiceSelect.appendChild(option);
        });
    }

    // Load voices when available
    speechSynthesis.addEventListener('voiceschanged', loadVoices);
    loadVoices();

    // Update slider values
    rateSlider.addEventListener('input', function() {
        rateValue.textContent = this.value;
    });

    pitchSlider.addEventListener('input', function() {
        pitchValue.textContent = this.value;
    });

    // Speak functionality
    speakBtn.addEventListener('click', function() {
        const text = textInput.value.trim();
        if (!text) {
            alert('Please enter some text to speak.');
            return;
        }

        // Stop any current speech
        speechSynthesis.cancel();

        currentUtterance = new SpeechSynthesisUtterance(text);
        
        if (voices[voiceSelect.value]) {
            currentUtterance.voice = voices[voiceSelect.value];
        }
        
        currentUtterance.rate = parseFloat(rateSlider.value);
        currentUtterance.pitch = parseFloat(pitchSlider.value);

        currentUtterance.onstart = function() {
            speakBtn.innerHTML = '<i class="fas fa-play"></i> Speaking...';
            speakBtn.disabled = true;
        };

        currentUtterance.onend = function() {
            speakBtn.innerHTML = '<i class="fas fa-play"></i> Speak';
            speakBtn.disabled = false;
        };

        speechSynthesis.speak(currentUtterance);
    });

    // Pause functionality
    pauseBtn.addEventListener('click', function() {
        if (speechSynthesis.speaking && !speechSynthesis.paused) {
            speechSynthesis.pause();
            pauseBtn.innerHTML = '<i class="fas fa-play"></i> Resume';
        } else if (speechSynthesis.paused) {
            speechSynthesis.resume();
            pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
        }
    });

    // Stop functionality
    stopBtn.addEventListener('click', function() {
        speechSynthesis.cancel();
        speakBtn.innerHTML = '<i class="fas fa-play"></i> Speak';
        speakBtn.disabled = false;
        pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
    });
}

// 2. QR Code Generator
function initQRGenerator() {
    const qrInput = document.getElementById('qr-input');
    const qrSize = document.getElementById('qr-size');
    const generateBtn = document.getElementById('generate-qr-btn');
    const downloadBtn = document.getElementById('download-qr-btn');
    const qrResult = document.getElementById('qr-result');

    generateBtn.addEventListener('click', function() {
        const text = qrInput.value.trim();
        if (!text) {
            alert('Please enter text or URL to generate QR code.');
            return;
        }

        const size = parseInt(qrSize.value);
        
        // Clear previous result
        qrResult.innerHTML = '';

        // Generate QR code using QR Server API
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`;
        
        const img = document.createElement('img');
        img.src = qrUrl;
        img.alt = 'Generated QR Code';
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
        
        qrResult.appendChild(img);
        downloadBtn.style.display = 'inline-flex';
        
        // Download functionality
        downloadBtn.onclick = function() {
            const link = document.createElement('a');
            link.href = qrUrl;
            link.download = 'qrcode.png';
            link.click();
        };
    });
}

// 3. Password Generator
function initPasswordGenerator() {
    const lengthSlider = document.getElementById('password-length');
    const lengthValue = document.getElementById('length-value');
    const uppercaseCheck = document.getElementById('include-uppercase');
    const lowercaseCheck = document.getElementById('include-lowercase');
    const numbersCheck = document.getElementById('include-numbers');
    const symbolsCheck = document.getElementById('include-symbols');
    const generateBtn = document.getElementById('generate-password-btn');
    const copyBtn = document.getElementById('copy-password-btn');
    const passwordOutput = document.getElementById('generated-password');

    // Update length value
    lengthSlider.addEventListener('input', function() {
        lengthValue.textContent = this.value;
    });

    // Generate password
    generateBtn.addEventListener('click', function() {
        const length = parseInt(lengthSlider.value);
        const includeUppercase = uppercaseCheck.checked;
        const includeLowercase = lowercaseCheck.checked;
        const includeNumbers = numbersCheck.checked;
        const includeSymbols = symbolsCheck.checked;

        if (!includeUppercase && !includeLowercase && !includeNumbers && !includeSymbols) {
            alert('Please select at least one character type.');
            return;
        }

        const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const lowercase = 'abcdefghijklmnopqrstuvwxyz';
        const numbers = '0123456789';
        const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

        let charset = '';
        if (includeUppercase) charset += uppercase;
        if (includeLowercase) charset += lowercase;
        if (includeNumbers) charset += numbers;
        if (includeSymbols) charset += symbols;

        let password = '';
        for (let i = 0; i < length; i++) {
            password += charset.charAt(Math.floor(Math.random() * charset.length));
        }

        passwordOutput.value = password;
        copyBtn.style.display = 'inline-flex';
    });

    // Copy password
    copyBtn.addEventListener('click', function() {
        passwordOutput.select();
        document.execCommand('copy');
        
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
        setTimeout(() => {
            copyBtn.innerHTML = originalText;
        }, 2000);
    });
}

// 4. Word Counter
function initWordCounter() {
    const textInput = document.getElementById('word-counter-text');
    const wordCount = document.getElementById('word-count');
    const charCount = document.getElementById('char-count');
    const charCountNoSpaces = document.getElementById('char-count-no-spaces');
    const paragraphCount = document.getElementById('paragraph-count');
    const sentenceCount = document.getElementById('sentence-count');
    const readingTime = document.getElementById('reading-time');

    function updateCounts() {
        const text = textInput.value;
        
        // Word count
        const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
        wordCount.textContent = words;
        
        // Character count
        charCount.textContent = text.length;
        
        // Character count without spaces
        charCountNoSpaces.textContent = text.replace(/\s/g, '').length;
        
        // Paragraph count
        const paragraphs = text.trim() === '' ? 0 : text.split(/\n\s*\n/).filter(p => p.trim() !== '').length;
        paragraphCount.textContent = paragraphs;
        
        // Sentence count
        const sentences = text.trim() === '' ? 0 : text.split(/[.!?]+/).filter(s => s.trim() !== '').length;
        sentenceCount.textContent = sentences;
        
        // Reading time (average 200 words per minute)
        const readingTimeMinutes = Math.ceil(words / 200);
        readingTime.textContent = readingTimeMinutes;
    }

    textInput.addEventListener('input', updateCounts);
    updateCounts(); // Initial count
}

// 5. Color Picker
function initColorPicker() {
    const colorInput = document.getElementById('color-input');
    const colorPreview = document.getElementById('color-preview');
    const hexValue = document.getElementById('hex-value');
    const rgbValue = document.getElementById('rgb-value');
    const hslValue = document.getElementById('hsl-value');
    const copyBtns = document.querySelectorAll('.copy-btn');
    const paletteColors = document.querySelectorAll('.palette-color');

    function updateColorValues(color) {
        colorInput.value = color;
        colorPreview.style.backgroundColor = color;
        
        // Convert hex to RGB
        const r = parseInt(color.substr(1, 2), 16);
        const g = parseInt(color.substr(3, 2), 16);
        const b = parseInt(color.substr(5, 2), 16);
        
        // Convert RGB to HSL
        const hsl = rgbToHsl(r, g, b);
        
        hexValue.value = color.toUpperCase();
        rgbValue.value = `rgb(${r}, ${g}, ${b})`;
        hslValue.value = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
    }

    function rgbToHsl(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;
        
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        
        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        
        return {
            h: Math.round(h * 360),
            s: Math.round(s * 100),
            l: Math.round(l * 100)
        };
    }

    // Initialize with default color
    updateColorValues(colorInput.value);

    // Color input change
    colorInput.addEventListener('input', function() {
        updateColorValues(this.value);
    });

    // Copy functionality
    copyBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const targetInput = document.getElementById(targetId);
            
            targetInput.select();
            document.execCommand('copy');
            
            const originalText = this.innerHTML;
            this.innerHTML = '<i class="fas fa-check"></i>';
            setTimeout(() => {
                this.innerHTML = originalText;
            }, 2000);
        });
    });

    // Palette colors
    paletteColors.forEach(color => {
        const colorValue = color.getAttribute('data-color');
        color.style.backgroundColor = colorValue;
        
        color.addEventListener('click', function() {
            updateColorValues(colorValue);
        });
    });
}

// 6. Unit Converter
function initUnitConverter() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const converterContents = document.querySelectorAll('.converter-content');

    // Tab switching
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            
            // Remove active class from all tabs and contents
            tabBtns.forEach(b => b.classList.remove('active'));
            converterContents.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding content
            this.classList.add('active');
            document.getElementById(`${tabName}-converter`).classList.add('active');
        });
    });

    // Length converter
    const lengthFromValue = document.getElementById('length-from-value');
    const lengthFromUnit = document.getElementById('length-from-unit');
    const lengthToValue = document.getElementById('length-to-value');
    const lengthToUnit = document.getElementById('length-to-unit');

    const lengthUnits = {
        mm: 0.001,
        cm: 0.01,
        m: 1,
        km: 1000,
        in: 0.0254,
        ft: 0.3048,
        yd: 0.9144,
        mi: 1609.344
    };

    function convertLength() {
        const value = parseFloat(lengthFromValue.value);
        if (isNaN(value)) {
            lengthToValue.value = '';
            return;
        }
        
        const fromUnit = lengthFromUnit.value;
        const toUnit = lengthToUnit.value;
        
        const meters = value * lengthUnits[fromUnit];
        const result = meters / lengthUnits[toUnit];
        
        lengthToValue.value = result.toFixed(6).replace(/\.?0+$/, '');
    }

    lengthFromValue.addEventListener('input', convertLength);
    lengthFromUnit.addEventListener('change', convertLength);
    lengthToUnit.addEventListener('change', convertLength);

    // Weight converter
    const weightFromValue = document.getElementById('weight-from-value');
    const weightFromUnit = document.getElementById('weight-from-unit');
    const weightToValue = document.getElementById('weight-to-value');
    const weightToUnit = document.getElementById('weight-to-unit');

    const weightUnits = {
        mg: 0.000001,
        g: 0.001,
        kg: 1,
        oz: 0.0283495,
        lb: 0.453592,
        ton: 1000
    };

    function convertWeight() {
        const value = parseFloat(weightFromValue.value);
        if (isNaN(value)) {
            weightToValue.value = '';
            return;
        }
        
        const fromUnit = weightFromUnit.value;
        const toUnit = weightToUnit.value;
        
        const kg = value * weightUnits[fromUnit];
        const result = kg / weightUnits[toUnit];
        
        weightToValue.value = result.toFixed(6).replace(/\.?0+$/, '');
    }

    weightFromValue.addEventListener('input', convertWeight);
    weightFromUnit.addEventListener('change', convertWeight);
    weightToUnit.addEventListener('change', convertWeight);

    // Temperature converter
    const tempFromValue = document.getElementById('temp-from-value');
    const tempFromUnit = document.getElementById('temp-from-unit');
    const tempToValue = document.getElementById('temp-to-value');
    const tempToUnit = document.getElementById('temp-to-unit');

    function convertTemperature() {
        const value = parseFloat(tempFromValue.value);
        if (isNaN(value)) {
            tempToValue.value = '';
            return;
        }
        
        const fromUnit = tempFromUnit.value;
        const toUnit = tempToUnit.value;
        
        let celsius = value;
        
        // Convert to Celsius first
        if (fromUnit === 'fahrenheit') {
            celsius = (value - 32) * 5/9;
        } else if (fromUnit === 'kelvin') {
            celsius = value - 273.15;
        }
        
        // Convert from Celsius to target unit
        let result = celsius;
        if (toUnit === 'fahrenheit') {
            result = celsius * 9/5 + 32;
        } else if (toUnit === 'kelvin') {
            result = celsius + 273.15;
        }
        
        tempToValue.value = result.toFixed(2);
    }

    tempFromValue.addEventListener('input', convertTemperature);
    tempFromUnit.addEventListener('change', convertTemperature);
    tempToUnit.addEventListener('change', convertTemperature);
}

// 7. BMI Calculator
function initBMICalculator() {
    const heightInput = document.getElementById('height-input');
    const heightUnit = document.getElementById('height-unit');
    const heightInches = document.getElementById('height-inches');
    const heightInchesInput = document.getElementById('height-inches-input');
    const weightInput = document.getElementById('weight-input');
    const weightUnit = document.getElementById('weight-unit');
    const calculateBtn = document.getElementById('calculate-bmi-btn');
    const resetBtn = document.getElementById('reset-bmi-btn');
    const bmiResult = document.getElementById('bmi-result');
    const bmiNumber = document.getElementById('bmi-number');
    const bmiStatus = document.getElementById('bmi-status');
    const bmiRanges = document.querySelectorAll('.bmi-range');

    // Show/hide inches input based on height unit
    heightUnit.addEventListener('change', function() {
        if (this.value === 'ft') {
            heightInches.style.display = 'block';
        } else {
            heightInches.style.display = 'none';
        }
    });

    calculateBtn.addEventListener('click', function() {
        let height = parseFloat(heightInput.value);
        const weight = parseFloat(weightInput.value);

        if (!height || !weight || height <= 0 || weight <= 0) {
            alert('Please enter valid height and weight values.');
            return;
        }

        // Convert height to meters
        if (heightUnit.value === 'ft') {
            const inches = parseFloat(heightInchesInput.value) || 0;
            height = (height * 12 + inches) * 0.0254; // Convert feet + inches to meters
        } else {
            height = height / 100; // Convert cm to meters
        }

        // Convert weight to kg
        let weightKg = weight;
        if (weightUnit.value === 'lb') {
            weightKg = weight * 0.453592;
        }

        // Calculate BMI
        const bmi = weightKg / (height * height);
        
        // Determine BMI category
        let category = '';
        let categoryClass = '';
        
        if (bmi < 18.5) {
            category = 'Underweight';
            categoryClass = 'underweight';
        } else if (bmi < 25) {
            category = 'Normal Weight';
            categoryClass = 'normal';
        } else if (bmi < 30) {
            category = 'Overweight';
            categoryClass = 'overweight';
        } else {
            category = 'Obese';
            categoryClass = 'obese';
        }

        // Display results
        bmiNumber.textContent = bmi.toFixed(1);
        bmiStatus.textContent = category;
        bmiResult.style.display = 'block';

        // Highlight corresponding BMI range
        bmiRanges.forEach(range => {
            range.classList.remove('active');
            if (range.classList.contains(categoryClass)) {
                range.classList.add('active');
            }
        });
    });

    resetBtn.addEventListener('click', function() {
        heightInput.value = '';
        heightInchesInput.value = '';
        weightInput.value = '';
        bmiResult.style.display = 'none';
        bmiRanges.forEach(range => range.classList.remove('active'));
    });
}

// 8. JSON Formatter
function initJSONFormatter() {
    const jsonInput = document.getElementById('json-input');
    const jsonOutput = document.getElementById('json-output');
    const formatBtn = document.getElementById('format-json-btn');
    const minifyBtn = document.getElementById('minify-json-btn');
    const validateBtn = document.getElementById('validate-json-btn');
    const clearBtn = document.getElementById('clear-json-btn');
    const copyBtn = document.getElementById('copy-json-btn');
    const jsonStatus = document.getElementById('json-status');

    function showStatus(message, type) {
        jsonStatus.textContent = message;
        jsonStatus.className = `json-status ${type}`;
        jsonStatus.style.display = 'block';
        
        setTimeout(() => {
            jsonStatus.style.display = 'none';
        }, 3000);
    }

    formatBtn.addEventListener('click', function() {
        try {
            const input = jsonInput.value.trim();
            if (!input) {
                showStatus('Please enter JSON data to format.', 'error');
                return;
            }
            
            const parsed = JSON.parse(input);
            const formatted = JSON.stringify(parsed, null, 2);
            jsonOutput.value = formatted;
            showStatus('JSON formatted successfully!', 'success');
        } catch (error) {
            showStatus(`Invalid JSON: ${error.message}`, 'error');
            jsonOutput.value = '';
        }
    });

    minifyBtn.addEventListener('click', function() {
        try {
            const input = jsonInput.value.trim();
            if (!input) {
                showStatus('Please enter JSON data to minify.', 'error');
                return;
            }
            
            const parsed = JSON.parse(input);
            const minified = JSON.stringify(parsed);
            jsonOutput.value = minified;
            showStatus('JSON minified successfully!', 'success');
        } catch (error) {
            showStatus(`Invalid JSON: ${error.message}`, 'error');
            jsonOutput.value = '';
        }
    });

    validateBtn.addEventListener('click', function() {
        try {
            const input = jsonInput.value.trim();
            if (!input) {
                showStatus('Please enter JSON data to validate.', 'error');
                return;
            }
            
            JSON.parse(input);
            showStatus('Valid JSON!', 'success');
        } catch (error) {
            showStatus(`Invalid JSON: ${error.message}`, 'error');
        }
    });

    clearBtn.addEventListener('click', function() {
        jsonInput.value = '';
        jsonOutput.value = '';
        jsonStatus.style.display = 'none';
    });

    copyBtn.addEventListener('click', function() {
        if (!jsonOutput.value) {
            showStatus('No formatted JSON to copy.', 'error');
            return;
        }
        
        jsonOutput.select();
        document.execCommand('copy');
        
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
        setTimeout(() => {
            copyBtn.innerHTML = originalText;
        }, 2000);
    });
}

// Scroll animations
function generalAnimateOnScroll() {
    // Select all elements intended for scroll animation
    const elementsToAnimate = document.querySelectorAll('.tool-section, .stat-card, .tool-header h2, .tool-header p, .btn, .palette-color, .bmi-range, .input-group, .control-group, .hero-content h1, .hero-content p'); 
    // More specific selectors can be used, or a common class like '.scroll-animate'

    const observer = new IntersectionObserver((entries, observerInstance) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Add 'is-visible' for CSS driven animation
                entry.target.classList.add('is-visible');
                
                // For elements that used the old direct style manipulation for slideInUp:
                // Ensure they don't conflict or double-animate.
                // The new .animate-on-scroll and .is-visible should handle this.
                // If they still have inline styles from old animation, clear them or ensure CSS takes precedence.
                if (entry.target.classList.contains('tool-section')) {
                     // Clear old animation styles if they were directly set and might conflict
                    entry.target.style.animationDelay = '';
                    entry.target.style.animationPlayState = '';
                    // The .tool-section already has slideInUp, we'll add animate-on-scroll to it.
                }
                 // No need to unobserve if animation is one-shot CSS transition/animation
                // observerInstance.unobserve(entry.target); // Optional: unobserve after animation
            }
            // Optional: remove 'is-visible' when element scrolls out of view for re-animation
            // else {
            //     entry.target.classList.remove('is-visible');
            // }
        });
    }, {
        threshold: 0.1, // Adjust threshold as needed (percentage of element visible)
        rootMargin: '0px 0px -30px 0px' // Start animation a bit before it's fully in view
    });

    elementsToAnimate.forEach(el => {
        // Add the base class for animation that CSS targets
        el.classList.add('animate-on-scroll'); 
        observer.observe(el);
    });
}

// Initialize scroll animations
document.addEventListener('DOMContentLoaded', generalAnimateOnScroll);

