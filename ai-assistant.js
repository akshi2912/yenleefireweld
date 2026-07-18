// Yen Lee Fireweld AI - client-side smart FAQ assistant
// Matches visitor questions to a firefighting/company knowledge base using keyword scoring.

(function () {

    var KB = [
        {
            keywords: ["quotation", "quote", "free quote", "estimate", "price", "cost"],
            answer: "Yes, we provide free quotations for all fire protection projects. Simply share your building type and requirements through our Contact page and our team will get back to you with a no-obligation quote."
        },
        {
            keywords: ["maintenance", "annual maintenance", "servicing", "contract", "service contract"],
            answer: "Yes, we offer annual maintenance contracts for fire alarm systems, fire extinguishers, hydrant systems and fire suppression systems, keeping your equipment compliant and ready at all times."
        },
        {
            keywords: ["install", "installation", "fire alarm", "alarm system", "new system"],
            answer: "Yes, we design, supply and install complete fire alarm systems for commercial, industrial and residential buildings, from detectors and control panels to full system commissioning."
        },
        {
            keywords: ["extinguisher", "fire extinguisher", "co2", "dry powder", "abc powder", "foam extinguisher"],
            answer: "We supply, install and service a full range of fire extinguishers including ABC dry powder, CO2, foam and Monnex\u2122 units, with regular inspection and refill services available."
        },
        {
            keywords: ["hydrant", "fire hydrant", "hydrant system", "hose reel"],
            answer: "We design and install fire hydrant systems and hose reel networks, including pipework, hydrant pillars, pumps and hose cabinets, tailored to your site's layout and hazard level."
        },
        {
            keywords: ["suppression", "fire suppression", "sprinkler", "foam system", "gas suppression"],
            answer: "Our fire suppression solutions include sprinkler systems, foam suppression and gas-based suppression systems, designed to protect high-value assets, warehouses and industrial facilities."
        },
        {
            keywords: ["emergency", "emergency light", "exit light", "evacuation"],
            answer: "Yes, we install and maintain emergency exit lights and evacuation systems to ensure safe, well-lit escape routes during a fire emergency."
        },
        {
            keywords: ["foam", "foam concentrate", "afff", "ar-afff", "fluorine free"],
            answer: "We supply a wide range of foam concentrates including AFFF, AR-AFFF and fluorine-free foam, suited for petrochemical, industrial and aviation fire risks."
        },
        {
            keywords: ["ppe", "firefighter ppe", "protective equipment", "gear", "scba"],
            answer: "We supply firefighter PPE including protective clothing and SCBA (self-contained breathing apparatus) for professional and industrial fire response teams."
        },
        {
            keywords: ["how often", "inspection", "check", "monthly", "yearly", "frequency"],
            answer: "Fire extinguishers should be visually inspected monthly and professionally serviced at least once a year. Fire alarm and suppression systems typically require servicing every 6 to 12 months depending on the system type."
        },
        {
            keywords: ["response time", "urgent", "emergency service", "breakdown", "immediate"],
            answer: "Yes, we provide emergency support for fire protection equipment and systems. Please call us at +65 6290 9890 for urgent breakdowns."
        },
        {
            keywords: ["contact", "call", "phone", "email", "reach", "location", "address", "office"],
            answer: "You can reach us at +65 6290 9890 or yenlee@fireweld.com.sg. Our office is in Singapore and we're open Monday to Saturday, 9:00 AM to 6:00 PM."
        },
        {
            keywords: ["experience", "how long", "history", "since", "founded", "established"],
            answer: "Yen Lee Fireweld was founded in 1982 and has completed over 5000 fire protection projects across commercial, industrial and residential buildings in Singapore."
        },
        {
            keywords: ["project", "portfolio", "previous work", "past project", "reference"],
            answer: "We have completed projects across office buildings, petrochemical plants, hotels, factories and warehouses. You can view examples on our Projects page."
        },
        {
            keywords: ["monnex", "wheeled unit", "mobile extinguisher"],
            answer: "Monnex\u2122 is a high-performance dry chemical powder we supply for rapid knockdown of Class B fires, available in portable, mobile and wheeled unit configurations."
        },
        {
            keywords: ["fire class", "class a", "class b", "class c", "class d", "class k", "types of fire"],
            answer: "Fires are classified as Class A (ordinary combustibles), Class B (flammable liquids), Class C (electrical), Class D (metals) and Class K (cooking oils/fats). We can recommend the right extinguisher or system for each hazard type."
        },
        {
            keywords: ["hello", "hi", "hey", "good morning", "good afternoon"],
            answer: "Hello! I'm the Yen Lee Fireweld AI assistant. Ask me anything about fire alarms, extinguishers, hydrant systems, foam, maintenance or our projects."
        },
        {
            keywords: ["thank", "thanks", "thank you"],
            answer: "You're welcome! If you need a formal quotation or site visit, feel free to reach out through our Contact form or call +65 6290 9890."
        }
    ];

    var FALLBACK = "That's a great question. For a detailed answer specific to your site, please contact our team at +65 6290 9890 or yenlee@fireweld.com.sg \u2014 we're happy to help with any fire safety requirement.";

    function normalize(text) {
        return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
    }

    function findAnswer(question) {
        var q = normalize(question);
        if (!q) return null;

        var bestScore = 0;
        var bestAnswer = null;

        KB.forEach(function (entry) {
            var score = 0;
            entry.keywords.forEach(function (kw) {
                if (q.indexOf(kw) !== -1) {
                    score += kw.split(" ").length; // longer phrase matches score higher
                }
            });
            if (score > bestScore) {
                bestScore = score;
                bestAnswer = entry.answer;
            }
        });

        return bestScore > 0 ? bestAnswer : FALLBACK;
    }

    function scrollChatToBottom(chatEl) {
        chatEl.scrollTop = chatEl.scrollHeight;
    }

    function appendMessage(chatEl, text, sender) {
        var msg = document.createElement("div");
        msg.className = "ai-msg ai-msg-" + sender;

        if (sender === "bot") {
            var avatar = document.createElement("div");
            avatar.className = "ai-avatar";
            avatar.textContent = "🔥";
            msg.appendChild(avatar);
        }

        var bubble = document.createElement("div");
        bubble.className = "ai-bubble";
        bubble.textContent = text;
        msg.appendChild(bubble);

        chatEl.appendChild(msg);
        scrollChatToBottom(chatEl);
    }

    function appendTyping(chatEl) {
        var msg = document.createElement("div");
        msg.className = "ai-msg ai-msg-bot ai-typing-msg";

        var avatar = document.createElement("div");
        avatar.className = "ai-avatar";
        avatar.textContent = "🔥";
        msg.appendChild(avatar);

        var bubble = document.createElement("div");
        bubble.className = "ai-bubble ai-typing";
        bubble.innerHTML = "<span></span><span></span><span></span>";
        msg.appendChild(bubble);

        chatEl.appendChild(msg);
        scrollChatToBottom(chatEl);
        return msg;
    }

    function initAssistant() {
        var form = document.getElementById("aiAskForm");
        var input = document.getElementById("aiAskInput");
        var chat = document.getElementById("aiChatWindow");
        var chips = document.querySelectorAll(".ai-chip");

        if (!form || !input || !chat) return;

        function handleAsk(question) {
            question = question.trim();
            if (!question) return;

            appendMessage(chat, question, "user");
            input.value = "";

            var typingEl = appendTyping(chat);

            setTimeout(function () {
                typingEl.remove();
                var answer = findAnswer(question);
                appendMessage(chat, answer, "bot");
            }, 500 + Math.random() * 400);
        }

        form.addEventListener("submit", function (e) {
            e.preventDefault();
            handleAsk(input.value);
        });

        chips.forEach(function (chip) {
            chip.addEventListener("click", function () {
                handleAsk(chip.textContent);
            });
        });
    }

    document.addEventListener("DOMContentLoaded", initAssistant);
})();
