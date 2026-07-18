// Sticky Header

window.addEventListener("scroll",function(){

    const header=document.getElementById("header");

    if(window.scrollY>80){

        header.style.height="75px";

    }

    else{

        header.style.height="90px";

    }

});
/*==============================
FAQ
==============================*/

const faq=document.querySelectorAll(".faq-item");

faq.forEach(item=>{

    const question=item.querySelector(".faq-question");

    const answer=item.querySelector(".faq-answer");

    question.addEventListener("click",()=>{

        if(answer.style.maxHeight){

            answer.style.maxHeight=null;

            question.querySelector("span").innerHTML="+";

        }

        else{

            answer.style.maxHeight=answer.scrollHeight+"px";

            question.querySelector("span").innerHTML="−";

        }

    });

});
window.addEventListener("load", function () {

    const loader = document.getElementById("preloader");

    if(loader){

        loader.style.opacity = "0";

        setTimeout(function(){

            loader.style.display = "none";

        }, 600);

    }

});


const menu = document.querySelector("nav ul");
const toggle = document.querySelector(".menu-toggle");

if (menu && toggle) {

    toggle.addEventListener("click", () => {
        menu.classList.toggle("active");
        toggle.textContent = menu.classList.contains("active") ? "✕" : "☰";
    });

    // Close the mobile menu automatically after a link is tapped
    // (skip the "Products" dropdown toggle itself, which just expands/collapses)
    menu.querySelectorAll("a").forEach(link => {
        const isDropdownToggle = link.parentElement && link.parentElement.classList.contains("has-dropdown");
        if (isDropdownToggle) return;
        link.addEventListener("click", () => {
            menu.classList.remove("active");
            toggle.textContent = "☰";
        });
    });

}

/*==============================
PRODUCTS DROPDOWN (animated submenu)
==============================*/

document.querySelectorAll(".has-dropdown > a").forEach(toggleLink => {

    toggleLink.addEventListener("click", (e) => {

        // On mobile/tablet, tapping "Products" opens the submenu accordion
        // instead of navigating straight to the products page.
        if (window.innerWidth <= 768) {

            e.preventDefault();

            const parentItem = toggleLink.parentElement;
            const isOpen = parentItem.classList.contains("open");

            document.querySelectorAll(".has-dropdown.open").forEach(item => {
                item.classList.remove("open");
            });

            if (!isOpen) {
                parentItem.classList.add("open");
            }

        }

    });

});

/*==============================
CONTACT FORM SUBMISSION
==============================*/

// Point this at your real backend once one is deployed.
// Until then (e.g. no server running at this address), the form
// automatically falls back to a mailto: submission below, so visitors
// never see a "could not reach server" error.
const CONTACT_API_URL = "http://localhost:5000/api/contact";
const CONTACT_FALLBACK_EMAIL = "yenlee@fireweld.com.sg";

const contactForm = document.getElementById("contactForm");

if (contactForm) {

    const formMsg = document.getElementById("formMsg");
    const submitBtn = contactForm.querySelector("button[type='submit'], button");

    const showMsg = (text, type) => {

        if (!formMsg) return;

        formMsg.textContent = text;
        formMsg.className = "form-msg show " + type;

    };

    const sendViaMailto = (data) => {
        const subject = encodeURIComponent(`Website enquiry from ${data.name || "website visitor"}`);
        const bodyLines = [
            `Name: ${data.name || "-"}`,
            `Email: ${data.email || "-"}`,
            `Phone: ${data.phone || "-"}`,
            `Company: ${data.company || "-"}`,
            "",
            data.message || ""
        ];
        const body = encodeURIComponent(bodyLines.join("\n"));
        window.location.href = `mailto:${CONTACT_FALLBACK_EMAIL}?subject=${subject}&body=${body}`;
    };

    contactForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        const data = Object.fromEntries(new FormData(contactForm).entries());

        if (!data.name || !data.email || !data.message) {
            showMsg("Please fill in your name, email and message.", "error");
            return;
        }

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.dataset.originalText = submitBtn.textContent;
            submitBtn.textContent = "Sending...";
        }

        let apiReachable = true;

        try {

            const res = await fetch(CONTACT_API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });

            const result = await res.json().catch(() => ({}));

            if (res.ok) {
                showMsg("Thanks! Your message has been sent — we'll get back to you shortly.", "success");
                contactForm.reset();
            } else {
                showMsg(result.error || "Something went wrong. Please try again or call us directly.", "error");
            }

        } catch (err) {

            // No backend is deployed at CONTACT_API_URL (e.g. running only on
            // someone's local machine) — fall back to opening the visitor's
            // email client with the message pre-filled, instead of showing an error.
            apiReachable = false;
            sendViaMailto(data);
            showMsg("Opening your email app to send this message to us — please hit send there.", "success");
            contactForm.reset();

        } finally {

            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = submitBtn.dataset.originalText || "Send Message";
            }

        }

    });

}