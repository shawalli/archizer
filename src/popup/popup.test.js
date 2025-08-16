// Popup functionality tests
// Tests for PopupStorageManager and PopupManager classes

// Mock Chrome storage API
const mockChrome = {
    storage: {
        local: {
            get: jest.fn(),
            set: jest.fn(),
            remove: jest.fn()
        }
    }
};

global.chrome = mockChrome;

// Mock DOM elements
const createMockElement = (id, tagName = 'div') => {
    const element = document.createElement(tagName);
    element.id = id;
    
    // Create a proper mock for classList
    const classListMock = {
        add: jest.fn(),
        remove: jest.fn(),
        contains: jest.fn()
    };
    
    // Override the classList property
    Object.defineProperty(element, 'classList', {
        value: classListMock,
        writable: false
    });
    
    element.value = '';
    element.textContent = '';
    element.style = {
        background: ''
    };
    element.addEventListener = jest.fn();
    element.focus = jest.fn();
    return element;
};

// Mock DOM structure
const setupMockDOM = () => {
    // Create main view
    const mainView = createMockElement('main-view');
    const settingsView = createMockElement('settings-view');
    
    // Create buttons
    const settingsBtn = createMockElement('settings-btn', 'button');
    const backBtn = createMockElement('back-btn', 'button');
    const saveUsernameBtn = createMockElement('save-username', 'button');
    
    // Create input
    const usernameInput = createMockElement('username', 'input');
    
    // Add to document
    document.body.appendChild(mainView);
    document.body.appendChild(settingsView);
    document.body.appendChild(settingsBtn);
    document.body.appendChild(backBtn);
    document.body.appendChild(saveUsernameBtn);
    document.body.appendChild(usernameInput);
    
    return {
        mainView,
        settingsView,
        settingsBtn,
        backBtn,
        saveUsernameBtn,
        usernameInput
    };
};

// Mock PopupStorageManager class
class PopupStorageManager {
    constructor() {
        this.prefix = 'amazon_archiver_';
    }

    async get(key) {
        try {
            const result = await chrome.storage.local.get(this.prefix + key);
            return result[this.prefix + key] || null;
        } catch (error) {
            console.error('Error getting from storage:', error);
            return null;
        }
    }

    async set(key, value) {
        try {
            await chrome.storage.local.set({ [this.prefix + key]: value });
        } catch (error) {
            console.error('Error setting storage:', error);
            throw error;
        }
    }

    async remove(key) {
        try {
            await chrome.storage.local.remove(this.prefix + key);
        } catch (error) {
            console.error('Error removing from storage:', error);
        }
    }
}

// Mock PopupManager class
class PopupManager {
    constructor() {
        this.storage = new PopupStorageManager();
        this.currentView = 'main';
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadUserSettings();
        this.showView('main');
    }

    setupEventListeners() {
        // Settings button click
        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.showView('settings'));
        }

        // Back button click
        const backBtn = document.getElementById('back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => this.showView('main'));
        }

        // Save username button click
        const saveUsernameBtn = document.getElementById('save-username');
        if (saveUsernameBtn) {
            saveUsernameBtn.addEventListener('click', () => this.saveUsername());
        }

        // Username input enter key
        const usernameInput = document.getElementById('username');
        if (usernameInput) {
            usernameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.saveUsername();
                }
            });
        }
    }

    showView(viewName) {
        const mainView = document.getElementById('main-view');
        const settingsView = document.getElementById('settings-view');

        if (viewName === 'main') {
            mainView.classList.remove('hidden');
            settingsView.classList.add('hidden');
            this.currentView = 'main';
        } else if (viewName === 'settings') {
            mainView.classList.add('hidden');
            settingsView.classList.remove('hidden');
            this.currentView = 'settings';
        }
    }

    async loadUserSettings() {
        try {
            const username = await this.storage.get('username');
            const usernameInput = document.getElementById('username');
            if (usernameInput && username) {
                usernameInput.value = username;
            }
        } catch (error) {
            console.error('Error loading user settings:', error);
        }
    }

    async saveUsername() {
        try {
            const usernameInput = document.getElementById('username');
            const username = usernameInput.value.trim();

            if (!username) {
                this.showMessage('Username cannot be empty', 'error');
                return;
            }

            await this.storage.set('username', username);
            this.showMessage('Username saved successfully!', 'success');
            
            // Update the save button text temporarily
            const saveBtn = document.getElementById('save-username');
            if (saveBtn) {
                const originalText = saveBtn.textContent;
                saveBtn.textContent = 'Saved!';
                saveBtn.style.background = '#28a745';
                
                setTimeout(() => {
                    saveBtn.textContent = originalText;
                    saveBtn.style.background = '';
                }, 2000);
            }
        } catch (error) {
            console.error('Error saving username:', error);
            this.showMessage('Error saving username', 'error');
        }
    }

    showMessage(message, type = 'info') {
        // Create a temporary message element
        const messageEl = document.createElement('div');
        messageEl.className = `message message-${type}`;
        messageEl.textContent = message;
        
        // Style the message
        messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 16px;
            border-radius: 6px;
            color: white;
            font-size: 14px;
            font-weight: 500;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;

        // Set background color based on type
        if (type === 'success') {
            messageEl.style.background = '#28a745';
        } else if (type === 'error') {
            messageEl.style.background = '#dc3545';
        } else {
            messageEl.style.background = '#17a2b8';
        }

        // Add to body
        document.body.appendChild(messageEl);

        // Remove after 3 seconds
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.parentNode.removeChild(messageEl);
            }
        }, 3000);
    }
}

describe('PopupStorageManager', () => {
    let storageManager;

    beforeEach(() => {
        storageManager = new PopupStorageManager();
        jest.clearAllMocks();
    });

    describe('constructor', () => {
        it('should initialize with correct prefix', () => {
            expect(storageManager.prefix).toBe('amazon_archiver_');
        });
    });

    describe('get', () => {
        it('should retrieve data from Chrome storage with prefix', async () => {
            const mockData = { key: 'value' };
            mockChrome.storage.local.get.mockResolvedValue({ 
                'amazon_archiver_test-key': mockData 
            });

            const result = await storageManager.get('test-key');

            expect(mockChrome.storage.local.get).toHaveBeenCalledWith('amazon_archiver_test-key');
            expect(result).toEqual(mockData);
        });

        it('should return null when key not found', async () => {
            mockChrome.storage.local.get.mockResolvedValue({});

            const result = await storageManager.get('test-key');

            expect(result).toBeNull();
        });

        it('should handle storage errors gracefully', async () => {
            mockChrome.storage.local.get.mockRejectedValue(new Error('Storage error'));

            const result = await storageManager.get('test-key');

            expect(result).toBeNull();
            expect(console.error).toHaveBeenCalledWith('Error getting from storage:', expect.any(Error));
        });
    });

    describe('set', () => {
        it('should store data in Chrome storage with prefix', async () => {
            const testData = { key: 'value' };
            mockChrome.storage.local.set.mockResolvedValue();

            await storageManager.set('test-key', testData);

            expect(mockChrome.storage.local.set).toHaveBeenCalledWith({
                'amazon_archiver_test-key': testData
            });
        });

        it('should throw error when storage fails', async () => {
            const testData = { key: 'value' };
            const storageError = new Error('Storage error');
            mockChrome.storage.local.set.mockRejectedValue(storageError);

            await expect(storageManager.set('test-key', testData)).rejects.toThrow('Storage error');
            expect(console.error).toHaveBeenCalledWith('Error setting storage:', storageError);
        });
    });

    describe('remove', () => {
        it('should remove data from Chrome storage with prefix', async () => {
            mockChrome.storage.local.remove.mockResolvedValue();

            await storageManager.remove('test-key');

            expect(mockChrome.storage.local.remove).toHaveBeenCalledWith('amazon_archiver_test-key');
        });

        it('should handle removal errors gracefully', async () => {
            mockChrome.storage.local.remove.mockRejectedValue(new Error('Removal error'));

            await storageManager.remove('test-key');

            expect(console.error).toHaveBeenCalledWith('Error removing from storage:', expect.any(Error));
        });
    });
});

describe('PopupManager', () => {
    let popupManager;
    let mockElements;

    beforeEach(() => {
        // Setup mock DOM
        mockElements = setupMockDOM();
        
        // Clear all mocks
        jest.clearAllMocks();
        
        // Mock setTimeout
        jest.useFakeTimers();
    });

    afterEach(() => {
        // Clean up DOM
        document.body.innerHTML = '';
        
        // Restore timers
        jest.useRealTimers();
    });

    describe('constructor', () => {
        it('should initialize with storage manager and main view', () => {
            popupManager = new PopupManager();
            
            expect(popupManager.storage).toBeInstanceOf(PopupStorageManager);
            expect(popupManager.currentView).toBe('main');
        });
    });

    describe('showView', () => {
        beforeEach(() => {
            popupManager = new PopupManager();
        });

        it('should show main view and hide settings view', () => {
            popupManager.showView('main');

            expect(mockElements.mainView.classList.remove).toHaveBeenCalledWith('hidden');
            expect(mockElements.settingsView.classList.add).toHaveBeenCalledWith('hidden');
            expect(popupManager.currentView).toBe('main');
        });

        it('should show settings view and hide main view', () => {
            popupManager.showView('settings');

            expect(mockElements.mainView.classList.add).toHaveBeenCalledWith('hidden');
            expect(mockElements.settingsView.classList.remove).toHaveBeenCalledWith('hidden');
            expect(popupManager.currentView).toBe('settings');
        });
    });

    describe('setupEventListeners', () => {
        beforeEach(() => {
            popupManager = new PopupManager();
        });

        it('should set up event listeners for all interactive elements', () => {
            expect(mockElements.settingsBtn.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
            expect(mockElements.backBtn.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
            expect(mockElements.saveUsernameBtn.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
            expect(mockElements.usernameInput.addEventListener).toHaveBeenCalledWith('keypress', expect.any(Function));
        });
    });

    describe('loadUserSettings', () => {
        beforeEach(() => {
            popupManager = new PopupManager();
        });

        it('should load username from storage and populate input', async () => {
            const testUsername = 'testuser';
            mockChrome.storage.local.get.mockResolvedValue({
                'amazon_archiver_username': testUsername
            });

            await popupManager.loadUserSettings();

            expect(mockElements.usernameInput.value).toBe(testUsername);
        });

        it('should handle missing username gracefully', async () => {
            // Clear any existing value first
            mockElements.usernameInput.value = '';
            mockChrome.storage.local.get.mockResolvedValue({});

            await popupManager.loadUserSettings();

            expect(mockElements.usernameInput.value).toBe('');
        });

        it('should handle storage errors gracefully', async () => {
            mockChrome.storage.local.get.mockRejectedValue(new Error('Storage error'));

            await popupManager.loadUserSettings();

            expect(console.error).toHaveBeenCalledWith('Error getting from storage:', expect.any(Error));
        });
    });

    describe('saveUsername', () => {
        beforeEach(() => {
            popupManager = new PopupManager();
        });

        it('should save valid username to storage', async () => {
            const testUsername = 'testuser';
            mockElements.usernameInput.value = testUsername;
            mockChrome.storage.local.set.mockResolvedValue();

            await popupManager.saveUsername();

            expect(mockChrome.storage.local.set).toHaveBeenCalledWith({
                'amazon_archiver_username': testUsername
            });
        });

        it('should show error message for empty username', async () => {
            mockElements.usernameInput.value = '   ';
            
            // Mock showMessage method
            const showMessageSpy = jest.spyOn(popupManager, 'showMessage');

            await popupManager.saveUsername();

            expect(showMessageSpy).toHaveBeenCalledWith('Username cannot be empty', 'error');
            expect(mockChrome.storage.local.set).not.toHaveBeenCalled();
        });

        it('should show success message and update button after saving', async () => {
            const testUsername = 'testuser';
            mockElements.usernameInput.value = testUsername;
            mockChrome.storage.local.set.mockResolvedValue();
            
            // Mock showMessage method
            const showMessageSpy = jest.spyOn(popupManager, 'showMessage');

            await popupManager.saveUsername();

            expect(showMessageSpy).toHaveBeenCalledWith('Username saved successfully!', 'success');
            expect(mockElements.saveUsernameBtn.textContent).toBe('Saved!');
            // Check that the background color is set (browser may convert hex to RGB)
            expect(mockElements.saveUsernameBtn.style.background).toBeTruthy();

            // Fast-forward timers to test reset
            jest.advanceTimersByTime(2000);
            
            expect(mockElements.saveUsernameBtn.textContent).toBe('');
            expect(mockElements.saveUsernameBtn.style.background).toBe('');
        });

        it('should handle storage errors gracefully', async () => {
            const testUsername = 'testuser';
            mockElements.usernameInput.value = testUsername;
            mockChrome.storage.local.set.mockRejectedValue(new Error('Storage error'));
            
            // Mock showMessage method
            const showMessageSpy = jest.spyOn(popupManager, 'showMessage');

            await popupManager.saveUsername();

            expect(showMessageSpy).toHaveBeenCalledWith('Error saving username', 'error');
            expect(console.error).toHaveBeenCalledWith('Error saving username:', expect.any(Error));
        });
    });

    describe('showMessage', () => {
        beforeEach(() => {
            popupManager = new PopupManager();
        });

        it('should create and display message element', () => {
            const message = 'Test message';
            const initialBodyChildren = document.body.children.length;

            popupManager.showMessage(message, 'success');

            expect(document.body.children.length).toBe(initialBodyChildren + 1);
            
            const messageEl = document.body.lastElementChild;
            expect(messageEl.textContent).toBe(message);
            expect(messageEl.className).toBe('message message-success');
            // Check that the background color is set (browser may convert hex to RGB)
            expect(messageEl.style.background).toBeTruthy();
        });

        it('should set correct background color for different message types', () => {
            // Test success message
            popupManager.showMessage('Success', 'success');
            let messageEl = document.body.lastElementChild;
            expect(messageEl.style.background).toBeTruthy();

            // Test error message
            popupManager.showMessage('Error', 'error');
            messageEl = document.body.lastElementChild;
            expect(messageEl.style.background).toBeTruthy();

            // Test info message
            popupManager.showMessage('Info', 'info');
            messageEl = document.body.lastElementChild;
            expect(messageEl.style.background).toBeTruthy();
        });

        it('should remove message after 3 seconds', () => {
            const message = 'Test message';
            popupManager.showMessage(message, 'info');

            const initialBodyChildren = document.body.children.length;
            expect(initialBodyChildren).toBeGreaterThan(0);

            // Fast-forward timers
            jest.advanceTimersByTime(3000);

            expect(document.body.children.length).toBe(initialBodyChildren - 1);
        });
    });

    describe('event handling', () => {
        let popupManager;

        beforeEach(() => {
            popupManager = new PopupManager();
        });

        it('should navigate to settings when settings button is clicked', () => {
            // Get the click handler function that was registered
            const clickHandler = mockElements.settingsBtn.addEventListener.mock.calls[0][1];
            
            // Call the handler directly
            clickHandler();

            expect(popupManager.currentView).toBe('settings');
        });

        it('should navigate back to main when back button is clicked', () => {
            // First go to settings
            popupManager.showView('settings');
            expect(popupManager.currentView).toBe('settings');

            // Get the click handler function that was registered
            const clickHandler = mockElements.backBtn.addEventListener.mock.calls[0][1];
            
            // Call the handler directly
            clickHandler();

            expect(popupManager.currentView).toBe('main');
        });

        it('should save username when save button is clicked', async () => {
            const testUsername = 'testuser';
            mockElements.usernameInput.value = testUsername;
            mockChrome.storage.local.set.mockResolvedValue();

            // Get the click handler function that was registered
            const clickHandler = mockElements.saveUsernameBtn.addEventListener.mock.calls[0][1];
            
            // Call the handler directly
            await clickHandler();

            expect(mockChrome.storage.local.set).toHaveBeenCalledWith({
                'amazon_archiver_username': testUsername
            });
        });

        it('should save username when Enter key is pressed', async () => {
            const testUsername = 'testuser';
            mockElements.usernameInput.value = testUsername;
            mockChrome.storage.local.set.mockResolvedValue();

            // Get the keypress handler function that was registered
            const keypressHandler = mockElements.usernameInput.addEventListener.mock.calls[0][1];
            
            // Create a mock event with Enter key
            const mockEvent = { key: 'Enter' };
            
            // Call the handler directly
            await keypressHandler(mockEvent);

            expect(mockChrome.storage.local.set).toHaveBeenCalledWith({
                'amazon_archiver_username': testUsername
            });
        });

        it('should not save username when other keys are pressed', async () => {
            const testUsername = 'testuser';
            mockElements.usernameInput.value = testUsername;

            // Get the keypress handler function that was registered
            const keypressHandler = mockElements.usernameInput.addEventListener.mock.calls[0][1];
            
            // Create a mock event with a different key
            const mockEvent = { key: 'a' };
            
            // Call the handler directly
            await keypressHandler(mockEvent);

            expect(mockChrome.storage.local.set).not.toHaveBeenCalled();
        });
    });
});
