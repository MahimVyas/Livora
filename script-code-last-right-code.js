// Import Firebase Services
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    signOut 
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    doc, 
    getDoc 
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCck7mSMcRRHL6df3Z-i-l_afxPG6VJgLg",
    authDomain: "rentalhub-b34e1.firebaseapp.com",
    projectId: "rentalhub-b34e1",
    storageBucket: "rentalhub-b34e1.appspot.com",
    messagingSenderId: "1051651104094",
    appId: "1:1051651104094:web:3d18b1bf33c854282b83cf",
    measurementId: "G-Z8GJFGC1SB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Event Listener for DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
    // Initialize functions based on the current page
    if (document.getElementById("registerForm")) setupRegister();
    if (document.getElementById("loginForm")) setupLogin();
    if (document.getElementById("listingForm")) setupListing();
    if (document.getElementById("exploreListings")) displayListings();
    if (document.querySelector(".search-btn")) setupSearch();
    if (document.querySelector(".slideshow")) startSlideshow();
});

// ✅ Login Function
function setupLogin() {
    const loginForm = document.getElementById("loginForm");
    if (!loginForm) return;

    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();
        const userType = document.querySelector('input[name="userType"]:checked')?.value;
        const loginBtn = document.querySelector(".login-btn");

        if (!email || !password || !userType) {
            alert("⚠️ Please fill all fields.");
            return;
        }

        loginBtn.disabled = true;
        loginBtn.innerText = "Logging in...";

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            sessionStorage.setItem("userType", userType);
            sessionStorage.setItem("userId", userCredential.user.uid);
            window.location.href = userType === "owner" ? "owner.html" : "user.html";
        } catch (error) {
            alert("❌ Login failed: " + error.message);
            loginBtn.disabled = false;
            loginBtn.innerText = "Login";
        }
    });
}

// ✅ Registration Function
function setupRegister() {
    const registerForm = document.getElementById("registerForm");
    if (!registerForm) return;

    registerForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const username = document.getElementById("username").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();
        const userType = document.querySelector('input[name="userType"]:checked')?.value;
        const registerBtn = document.querySelector(".register-btn");

        if (!username || !email || !password || !userType) {
            alert("⚠️ Please fill all fields.");
            return;
        }

        registerBtn.disabled = true;
        registerBtn.innerText = "Registering...";

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await addDoc(collection(db, "users"), { 
                uid: userCredential.user.uid, 
                username, 
                email, 
                userType 
            });
            alert("✅ Account created successfully! Redirecting to login...");
            setTimeout(() => window.location.href = "login.html", 2000);
        } catch (error) {
            alert("❌ Registration failed: " + error.message);
            registerBtn.disabled = false;
            registerBtn.innerText = "Sign Up";
        }
    });
}

// ✅ Logout Function
function logout() {
    signOut(auth).then(() => {
        sessionStorage.clear();
        alert("✅ Logged out successfully!");
        window.location.href = "login.html";
    }).catch((error) => {
        alert("❌ Logout failed: " + error.message);
    });
}

// ✅ Display Listings Function
async function displayListings() {
    const listingsContainer = document.getElementById("exploreListings");
    if (!listingsContainer) return;

    listingsContainer.innerHTML = "<p>Loading listings...</p>";

    try {
        const querySnapshot = await getDocs(collection(db, "listings"));
        listingsContainer.innerHTML = "";

        if (querySnapshot.empty) {
            listingsContainer.innerHTML = "<p>No listings found.</p>";
            return;
        }

        querySnapshot.forEach((doc) => {
            const listing = doc.data();
            const imageUrl = listing.imageUrl || 
                "https://st4.depositphotos.com/14953852/24787/v/450/depositphotos_247872612-stock-illustration-no-image-available-icon-vector.jpg";

            const listingCard = document.createElement("div");
            listingCard.classList.add("listing-card");

            listingCard.innerHTML = `
                <img src="${imageUrl}" alt="Property Image">
                <h3>${listing.propertyType}</h3>
                <p><strong>Location:</strong> ${listing.location}</p>
                <p class="price">₹${listing.rent}/month</p>
                <p><strong>Owner:</strong> ${listing.ownerName || "Unknown"}</p>
                <button class="view-details-btn" data-id="${doc.id}">View Details</button>
            `;

            listingsContainer.appendChild(listingCard);
        });

        // Add event listeners for "View Details" buttons
        document.querySelectorAll(".view-details-btn").forEach(button => {
            button.addEventListener("click", async function () {
                const listingId = this.getAttribute("data-id");
                const listingDoc = await getDoc(doc(db, "listings", listingId));

                if (listingDoc.exists()) {
                    showListingDetails(listingDoc.data());
                }
            });
        });

    } catch (error) {
        listingsContainer.innerHTML = "<p>Error loading listings.</p>";
    }
}

// ✅ Show Listing Details in Modal
function showListingDetails(listing) {
    const modal = document.getElementById("listingDetailsModal");
    if (!modal) return;

    document.getElementById("modalImage").src = listing.imageUrl || 
        "https://st4.depositphotos.com/14953852/24787/v/450/depositphotos_247872612-stock-illustration-no-image-available-icon-vector.jpg";
    document.getElementById("modalPropertyType").innerText = listing.propertyType;
    document.getElementById("modalLocation").innerText = listing.location;
    document.getElementById("modalRent").innerText = `₹${listing.rent}/month`;
    document.getElementById("modalOwner").innerText = listing.ownerName || "Unknown";
    document.getElementById("modalDescription").innerText = listing.description;
    document.getElementById("modalContact").innerText = listing.contact;

    modal.style.display = "block";

    // Close modal when the close button is clicked
    document.querySelector(".close-btn").addEventListener("click", () => {
        modal.style.display = "none";
    });
}

// ✅ Setup Listing Form
function setupListing() {
    const listingForm = document.getElementById("listingForm");
    if (!listingForm) return;

    listingForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const userId = sessionStorage.getItem("userId");
        if (!userId) {
            alert("❌ You must be logged in to add a listing.");
            return;
        }

        const propertyType = document.getElementById("propertyType").value;
        const description = document.getElementById("description").value;
        const rent = document.getElementById("rent").value;
        const location = document.getElementById("location").value;
        const contact = document.getElementById("contact").value;

        if (!propertyType || !description || !rent || !location || !contact) {
            alert("❌ Please fill all fields.");
            return;
        }

        try {
            const userDoc = await getDoc(doc(db, "users", userId));
            const ownerName = userDoc.exists() ? userDoc.data().username : "Unknown";

            await addDoc(collection(db, "listings"), {
                propertyType,
                description,
                rent,
                location,
                contact,
                ownerName,
                imageUrl: "images/default.jpg"
            });

            alert("✅ Listing added successfully!");
            window.location.href = "explore.html";
        } catch (error) {
            alert("❌ Error adding listing: " + error.message);
        }
    });
}

// ✅ Setup Search Functionality
function setupSearch() {
    const searchBtn = document.querySelector(".search-btn");
    if (!searchBtn) return;

    searchBtn.addEventListener("click", async function () {
        const searchQuery = document.querySelector(".input-field").value.trim().toLowerCase();
        const listingsContainer = document.getElementById("exploreListings");
        if (!listingsContainer) return;

        if (!searchQuery) {
            alert("⚠️ Please enter a search query.");
            return;
        }

        listingsContainer.innerHTML = "<p>Searching...</p>";

        try {
            const querySnapshot = await getDocs(collection(db, "listings"));
            listingsContainer.innerHTML = "";

            querySnapshot.forEach((doc) => {
                const listing = doc.data();
                if (listing.location.toLowerCase().includes(searchQuery)) {
                    listingsContainer.innerHTML += `
                        <div class="listing-card">
                            <h3>${listing.propertyType}</h3>
                            <p><strong>Location:</strong> ${listing.location}</p>
                            <p class="price">₹${listing.rent}/month</p>
                        </div>
                    `;
                }
            });

        } catch (error) {
            listingsContainer.innerHTML = "<p>Error retrieving search results.</p>";
        }
    });
}

// ✅ Slideshow Function
function startSlideshow() {
    const slides = document.querySelectorAll(".slide");
    if (!slides.length) return;

    let currentIndex = 0;

    function showSlide(index) {
        slides.forEach((slide, i) => {
            slide.classList.toggle("active", i === index);
        });
    }

    function nextSlide() {
        currentIndex = (currentIndex + 1) % slides.length;
        showSlide(currentIndex);
    }

    setInterval(nextSlide, 3000);
    showSlide(currentIndex);
}










function setupSearch() {
    const searchBtn = document.querySelector(".search-btn");
    if (!searchBtn) {
        console.error("Search button not found.");
        return;
    }

    searchBtn.addEventListener("click", async function () {
        const searchQuery = document.querySelector(".input-field").value.trim().toLowerCase();
        const listingsContainer = document.getElementById("exploreListings");
        if (!listingsContainer) {
            console.error("Listings container not found.");
            return;
        }

        if (!searchQuery) {
            alert("⚠️ Please enter a search query.");
            return;
        }

        listingsContainer.innerHTML = "<p>Searching...</p>";

        try {
            const querySnapshot = await getDocs(collection(db, "listings"));
            listingsContainer.innerHTML = "";

            let foundResults = false;

            querySnapshot.forEach((doc) => {
                const listing = doc.data();
                if (listing.location.toLowerCase().includes(searchQuery)) {
                    foundResults = true;
                    const listingCard = document.createElement("div");
                    listingCard.classList.add("listing-card");

                    listingCard.innerHTML = `
                        <img src="${"https://st4.depositphotos.com/14953852/24787/v/450/depositphotos_247872612-stock-illustration-no-image-available-icon-vector.jpg" || listing.imageUrl}" alt="Property Image">
                        <h3>${listing.propertyType}</h3>
                        <p><strong>Location:</strong> ${listing.location}</p>
                        <p class="price">₹${listing.rent}/month</p>
                        <p><strong>Owner:</strong> ${listing.ownerName || "Unknown"}</p>
                        <button class="view-details-btn" data-id="${doc.id}">View Details</button>
                    `;

                    listingsContainer.appendChild(listingCard);
                }
            });

            if (!foundResults) {
                listingsContainer.innerHTML = "<p>No listings found for your search.</p>";
            }

        } catch (error) {
            console.error("Error retrieving search results:", error);
            listingsContainer.innerHTML = "<p>Error retrieving search results.</p>";
        }
    });
}