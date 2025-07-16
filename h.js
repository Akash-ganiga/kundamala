



let isListening = false;
let nameAsked = false;
let greeted = false;
let contactStep = 0;
let contactData = { name: "", email: "", message: "" };
let isContactMode = false;

let pendingWord = "";
let isAddWordFlow = false;
let isWaitingToAddWordConfirmation = false;

// Toggle icon based on input
function toggleIcon() {
    const input = document.getElementById("searchInput").value.trim();
    const toggleIcon = document.getElementById("toggleIcon");

    if (input.length > 0) {
        toggleIcon.className = "fas fa-arrow-right icon";
        toggleIcon.onclick = sendSearch;
    } else {
        toggleIcon.className = "fas fa-microphone icon";
        toggleIcon.onclick = startVoiceRecognition;
    }
}

// Voice recognition
function startVoiceRecognition() {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = "kn-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.start();

    recognition.onresult = function (event) {
        const transcript = event.results[0][0].transcript;
        document.getElementById("searchInput").value = transcript;
        toggleIcon();
        sendSearch();
    };

    recognition.onerror = function (event) {
        alert("Voice recognition failed: " + event.error);
    };
}

// Main search + add + contact logic
function sendSearch() {
    const inputElement = document.getElementById("searchInput");
    const input = inputElement.value.trim();
    if (!input) return;

    showMessage(input, "user");

    // Handle contact flow
    if (isContactMode) {
        if (contactStep === 1) {
            contactData.name = input;
            showMessage(`Nice to meet you, ${contactData.name}! What’s your email?`, "system");
            contactStep++;
        } else if (contactStep === 2) {
            contactData.email = input;
            showMessage("Got it! Now, please type your message.", "system");
            contactStep++;
        } else if (contactStep === 3) {
            contactData.message = input;
            showMessage(`Thanks, ${contactData.name}! We’ve received your message and will get back to you soon!`, "system");
            isContactMode = false;
            contactStep = 0;
            saveContactData();
        }
        inputElement.value = "";
        return;
    }

    // Handle word addition confirmation step
    if (isWaitingToAddWordConfirmation && pendingWord) {
        const response = input.toLowerCase();
        isWaitingToAddWordConfirmation = false;

        if (response === "yes") {
            showMessage(`Please provide the meaning for the word "${pendingWord}".`, "system");
            isAddWordFlow = true;
        } else {
            showMessage("Okay! Let me know if you'd like to search something else.", "system");
            pendingWord = "";
        }

        inputElement.value = "";
        return;
    }

    // Handle actual word addition after confirmation
    if (isAddWordFlow && pendingWord) {
        const meaning = input;
        addWordToDictionary(pendingWord, meaning);
        showMessage(`Thank you for your contribution! The word "${pendingWord}" has been added.`, "system");
        isAddWordFlow = false;
        pendingWord = "";
        inputElement.value = "";
        return;
    }

    // Regular search
    const toggleIcon = document.getElementById("toggleIcon");
    toggleIcon.className = "fas fa-spinner fa-spin icon";

    fetch("http://127.0.0.1:5000/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: input })
    })
        .then(res => res.json())
        .then(data => {
            if (data.meaning.includes("Similar words:")) {
                const similarWords = data.meaning.split("Similar words: ")[1];
                showMessage(`No exact match found. Here are some similar words: ${similarWords}`, "system");
                showMessage(`Would you like to add the word "${input}" to the dictionary? (Yes/No)`, "system");
                pendingWord = input;
                isWaitingToAddWordConfirmation = true;
            } else if (data.meaning === "No result found.") {
                showMessage(`The word "${input}" is not in the dictionary. Would you like to add it? (Yes/No)`, "system");
                pendingWord = input;
                isWaitingToAddWordConfirmation = true;
            } else {
                showMessage(data.meaning || "No result found.", "system");
            }
        })
        .catch(() => {
            showMessage("Error fetching result.", "system");
        })
        .finally(() => {
            toggleIcon.className = "fas fa-microphone icon";
            toggleIcon.onclick = startVoiceRecognition;
            inputElement.value = "";
        });
}


// Add new word to backend
function addWordToDictionary(word, meaning) {
    fetch("http://127.0.0.1:5000/add_word", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: word, meaning: meaning })
    })
        .then(res => res.json())
        .then(data => {
            console.log("New word added:", data);
        })
        .catch(err => {
            console.error("Error adding word:", err);
        });
}

// Save contact data to backend
function saveContactData() {
    fetch("http://127.0.0.1:5000/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contactData)
    })
        .then(res => res.json())
        .then(data => {
            console.log("Contact form data saved:", data);
        })
        .catch(err => {
            console.error("Error saving contact data:", err);
        });
}

// Show message with typewriter effect
function showMessage(text, type) {
    const container = document.getElementById("resultsList");
    const msgDiv = document.createElement("div");
    msgDiv.className = type === "user" ? "user-message" : "system-message";
    container.appendChild(msgDiv);
    container.scrollTop = container.scrollHeight;

    if (type === "system") {
        let index = 0;
        function typeWriter() {
            if (index < text.length) {
                msgDiv.textContent += text.charAt(index);
                index++;
                setTimeout(typeWriter, 40);
                container.scrollTop = container.scrollHeight;
            }
        }
        typeWriter();
    } else {
        msgDiv.textContent = text;
    }
}

// Enter key logic
document.getElementById("searchInput").addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        event.preventDefault();
        sendSearch();
    }
});

function showAboutInfo() {
    const info = `About Us------
Mission:
Our mission is to make learning Kundapura Kannada easy and accessible for everyone.

Who We Are:
We are a group of students dedicated to preserving and promoting the Kundapura Kannada dialect through this dictionary platform.

What We Do:
We provide simple translations between Kundapura Kannada and Standard Kannada to help users understand and learn the language effectively.

User Involvement:
Users can contribute by adding new words if they are not found in the dictionary, helping us grow and improve the resource.

`
;
    showMessage(info.trim(), "system");
}


// Contact flow start
function startContactFlow() {
    isContactMode = true;
    contactStep = 1;
    contactData = { name: "", email: "", message: "" };
    showMessage("Sure! Let’s get in touch. What’s your name?", "system");
}

function pronounce(text, lang = "kn-IN") {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    speechSynthesis.speak(utterance);
}
