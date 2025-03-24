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
    getDoc,
    updateDoc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";
import { 
    getStorage, 
    ref, 
    uploadBytes, 
    getDownloadURL 
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-storage.js";

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
const storage = getStorage(app);

// Event Listener for DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
    // Initialize functions based on the current page
    if (document.getElementById("registerForm")) setupRegister();
    if (document.getElementById("loginForm")) setupLogin();
    if (document.getElementById("listingForm")) setupListing();
    if (document.getElementById("exploreListings")) displayListings();
    if (document.getElementById("ownerListings")) displayOwnerListings();
    if (document.querySelector(".search-btn")) setupSearch();
    if (document.querySelector(".slideshow")) startSlideshow();
    if (document.querySelector(".owner-options")) toggleOwnerOptions();
    if (document.querySelector(".dashboard")) initializeDashboard();
});

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
            
            // Toggle visibility of owner links
            toggleOwnerOptions(userType);

            // Redirect based on user type
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
            setTimeout(() => window.location.href = "index.html", 2000);
        } catch (error) {
            alert("❌ Registration failed: " + error.message);
            registerBtn.disabled = false;
            registerBtn.innerText = "Sign Up";
        }
    });
}

// import { signOut } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";

function logout() {
    signOut(auth)
        .then(() => {
            sessionStorage.clear(); // Clear any session data
            window.location.href = "index.html"; // Redirect to login page or homepage
        })
        .catch((error) => {
            console.error("❌ Logout failed: " + error.message);
            alert("❌ Logout failed: " + error.message);
        });
}

document.addEventListener("DOMContentLoaded", () => {
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", (event) => {
            event.preventDefault(); // Prevent default link behavior
            logout(); // Call the logout function
        });
    }
});

// ✅ Display Listings Function
async function displayListings() {
    const listingsContainer = document.getElementById("exploreListings");
    if (!listingsContainer) return;

    listingsContainer.innerHTML = `<p class="alert">Loading listings...</p>`;

    try {
        const querySnapshot = await getDocs(collection(db, "listings"));
        listingsContainer.innerHTML = "";

        if (querySnapshot.empty) {
            listingsContainer.innerHTML = `<p class="alert">No listings found.</p>`;
            return;
        }

        querySnapshot.forEach((doc) => {
            const listing = doc.data();
            const imageUrl ="https://st4.depositphotos.com/14953852/24787/v/450/depositphotos_247872612-stock-illustration-no-image-available-icon-vector.jpg" || listing.imageUrl;

            const listingCard = document.createElement("div");
            listingCard.classList.add("listing-card");

            listingCard.innerHTML = `
                <img src="${imageUrl}" alt="Property Image">
                <h3>${listing.propertyType}</h3>
                <p><strong>Location:</strong> ${listing.location}</p>
                <p class="price">₹${listing.rent}/month</p>
                <p class="owner-listing-margin-bottom"><strong>Owner:</strong> ${listing.ownerName || "Unknown"}</p>
                <button class="view-details-btn" data-id="${doc.id}">View Details</button>
            `;

            listingsContainer.appendChild(listingCard);
        });

        // Add event listeners for "View Details" buttons
        document.querySelectorAll(".view-details-btn").forEach(button => {
            button.addEventListener("click", async function () {
                const listingId = this.getAttribute("data-id");
                showListingDetails(listingId);
            });
        });

    } catch (error) {
        listingsContainer.innerHTML = "<p>Error loading listings.</p>";
    }
}

// ✅ Display Owner Listings Function
async function displayOwnerListings() {
    const ownerListingsContainer = document.getElementById("ownerListings");
    if (!ownerListingsContainer) return;

    const userId = sessionStorage.getItem("userId");
    if (!userId) {
        alert("❌ You must be logged in to view your listings.");
        window.location.href = "index.html";
        return;
    }

    ownerListingsContainer.innerHTML = "<p>Loading your listings...</p>";

    try {
        const querySnapshot = await getDocs(collection(db, "listings"));
        ownerListingsContainer.innerHTML = "";

        querySnapshot.forEach((doc) => {
            const listing = doc.data();
            if (listing.ownerId === userId) {
                const listingCard = document.createElement("div");
                listingCard.classList.add("listing-card");

                listingCard.innerHTML = `
                    <h3>${listing.propertyType}</h3>
                    <p><strong>Location:</strong> ${listing.location}</p>
                    <p class="price">₹${listing.rent}/month</p>
                    <button class="edit-btn" data-id="${doc.id}">Edit</button>
                    <button class="delete-btn" data-id="${doc.id}">Delete</button>
                `;

                ownerListingsContainer.appendChild(listingCard);
            }
        });

        // Add event listeners for "Edit" and "Delete" buttons
        document.querySelectorAll(".edit-btn").forEach(button => {
            button.addEventListener("click", function () {
                const listingId = this.getAttribute("data-id");
                editListing(listingId);
            });
        });

        document.querySelectorAll(".delete-btn").forEach(button => {
            button.addEventListener("click", function () {
                const listingId = this.getAttribute("data-id");
                deleteListing(listingId);
            });
        });

    } catch (error) {
        ownerListingsContainer.innerHTML = "<p>Error loading your listings.</p>";
    }
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
                ownerId: userId,
                imageUrl: "images/default.jpg"
            });

            alert("✅ Listing added successfully!");
            window.location.href = "explore.html";
        } catch (error) {
            alert("❌ Error adding listing: " + error.message);
        }
    });
}

// ✅ Edit Listing Function
async function editListing(listingId) {
    const listingDoc = await getDoc(doc(db, "listings", listingId));
    if (!listingDoc.exists()) {
        alert("❌ Listing not found.");
        return;
    }

    const listing = listingDoc.data();
    const editForm = document.getElementById("editForm");
    if (!editForm) return;

    // Populate the edit form with listing data
    document.getElementById("editPropertyType").value = listing.propertyType;
    document.getElementById("editDescription").value = listing.description;
    document.getElementById("editRent").value = listing.rent;
    document.getElementById("editLocation").value = listing.location;
    document.getElementById("editContact").value = listing.contact;

    editForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const updatedData = {
            propertyType: document.getElementById("editPropertyType").value,
            description: document.getElementById("editDescription").value,
            rent: document.getElementById("editRent").value,
            location: document.getElementById("editLocation").value,
            contact: document.getElementById("editContact").value
        };

        try {
            await updateDoc(doc(db, "listings", listingId), updatedData);
            alert("✅ Listing updated successfully!");
            window.location.href = "owner.html";
        } catch (error) {
            alert("❌ Error updating listing: " + error.message);
        }
    });
}

// ✅ Delete Listing Function
async function deleteListing(listingId) {
    if (!confirm("Are you sure you want to delete this listing?")) return;

    try {
        await deleteDoc(doc(db, "listings", listingId));
        alert("✅ Listing deleted successfully!");
        window.location.href = "owner.html";
    } catch (error) {
        alert("❌ Error deleting listing: " + error.message);
    }
}

function setupSearch() {
    const searchBtn = document.querySelector(".search-btn");
    const clearBtn = document.querySelector(".clear-filters-btn");
    const searchInput = document.querySelector(".input-field");
    const propertyTypeFilter = document.querySelector(".property-type-filter");
    const listingsContainer = document.getElementById("exploreListings");

    if (!searchBtn || !clearBtn || !searchInput || !propertyTypeFilter || !listingsContainer) {
        console.error("⚠️ Required elements not found.");
        return;
    }

    searchBtn.addEventListener("click", async () => {
        const searchQuery = searchInput.value.trim().toLowerCase();
        const selectedPropertyType = propertyTypeFilter.value;

        listingsContainer.innerHTML = `<p class="alert">Loading listings...</p>`;

        try {
            const querySnapshot = await getDocs(collection(db, "listings"));
            listingsContainer.innerHTML = "";
            let foundResults = false;

            querySnapshot.forEach((doc) => {
                const listing = doc.data();
                const matchesLocation = searchQuery ? listing.location.toLowerCase().includes(searchQuery) : true;
                const matchesPropertyType = selectedPropertyType ? listing.propertyType === selectedPropertyType : true;

                if (matchesLocation && matchesPropertyType) { 
                    foundResults = true;

                    const listingCard = document.createElement("div");
                    listingCard.classList.add("listing-card");
                    listingCard.setAttribute("data-id", doc.id);

                    listingCard.innerHTML = `
                        <img src="${  'https://st4.depositphotos.com/14953852/24787/v/450/depositphotos_247872612-stock-illustration-no-image-available-icon-vector.jpg' || listing.imageUrl}" alt="Property Image">
                        <h3>${listing.propertyType}</h3>
                        <p><strong>Location:</strong> ${listing.location}</p>
                        <p class="price">₹${listing.rent}/month</p>
                        <p class="owner-listing-margin-bottom"><strong>Owner:</strong> ${listing.ownerName || "Unknown"}</p>
                        <button class="view-details-btn" data-id="${doc.id}">View Details</button>
                    `;

                    listingsContainer.appendChild(listingCard);
                }
            });

            if (!foundResults) {
                listingsContainer.innerHTML = `<p class="alert">No listings found.</p>`;
            }
        } catch (error) {
            console.error("❌ Error retrieving listings:", error);
            listingsContainer.innerHTML = `<p class="alert">Error retrieving listings.</p>`;
        }
    });

    // 🔹 Clear filters functionality
    clearBtn.addEventListener("click", () => {
        searchInput.value = "";
        propertyTypeFilter.value = "";
        listingsContainer.innerHTML = "";
    });
}

    // 🔹 Search Function
    searchBtn.addEventListener("click", function () {
        const searchQuery = searchInput.value.trim().toLowerCase();
        const selectedPropertyType = propertyTypeFilter.value;
        fetchListings(searchQuery, selectedPropertyType);
    });

    // 🔹 Clear Filters Function (Shows all listings)
    clearBtn.addEventListener("click", function () {
        searchInput.value = "";
        propertyTypeFilter.value = "";
        fetchListings(); // 🔥 Fetch all listings when cleared
    });

    // ✅ Fix "View Details" Issue - Use Event Delegation
    listingsContainer.addEventListener("click", function (event) {
        if (event.target.classList.contains("view-details-btn")) {
            const listingId = event.target.getAttribute("data-id");
            if (listingId) {
                showListingDetails(listingId);
            }
        }
    });

    // ✅ Load all listings on page load
    fetchListings();


// ✅ Initialize Search on Page Load
document.addEventListener("DOMContentLoaded", setupSearch);
// ✅ Show Listing Details Function
async function showListingDetails(listingId) {
    const listingDoc = await getDoc(doc(db, "listings", listingId));
    if (!listingDoc.exists()) {
        alert("❌ Listing not found.");
        return;
    }

    const listing = listingDoc.data();
    const modal = document.getElementById("listingDetailsModal");
    if (!modal) return;

    document.getElementById("modalImage").src =  
        "https://st4.depositphotos.com/14953852/24787/v/450/depositphotos_247872612-stock-illustration-no-image-available-icon-vector.jpg" ||  listing.imageUrl;
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

// ✅ Slideshow Function
function startSlideshow() {
    const slides = document.querySelectorAll(".slideshow-container .slide");
    if (!slides.length) {
        console.error("No slides found.");
        return;
    }

    let currentIndex = 0; // Track the current slide index

    // Function to show a specific slide
    function showSlide(index) {
        // Hide all slides
        slides.forEach((slide) => {
            slide.classList.remove("active");
        });

        // Show the current slide
        slides[index].classList.add("active");
    }

    // Function to move to the next slide
    function nextSlide() {
        currentIndex = (currentIndex + 1) % slides.length; // Loop back to the first slide
        showSlide(currentIndex);
    }

    // Start the slideshow
    showSlide(currentIndex); // Show the first slide
    setInterval(nextSlide, 2500);
}

// Initialize the slideshow when the page loads
document.addEventListener("DOMContentLoaded", () => {
    startSlideshow();
});

function toggleOwnerOptions(userType) {
    const ownerLinks = document.querySelectorAll(".owner-only"); // Select all owner-specific links

    if (userType === "owner") {
        ownerLinks.forEach(link => link.style.display = "block"); // Show links for owners
    } else {
        ownerLinks.forEach(link => link.style.display = "none"); // Hide links for users
    }
}

// Call this function when the page loads to ensure correct visibility
document.addEventListener("DOMContentLoaded", () => {
    const storedUserType = sessionStorage.getItem("userType");
    if (storedUserType) toggleOwnerOptions(storedUserType);
});

// ✅ Initialize Dashboard Function
function initializeDashboard() {
    const dashboard = document.querySelector(".dashboard");
    if (!dashboard) return;

    const userId = sessionStorage.getItem("userId");
    if (!userId) {
        alert("❌ You must be logged in to access the dashboard.");
        window.location.href = "index.html";
        return;
    }

    // Load owner's listings
    displayOwnerListings();
}

document.addEventListener("DOMContentLoaded", function () {
    const navToggle = document.querySelector(".nav-toggle");
    const navLinks = document.querySelector(".nav-links");

    navToggle.addEventListener("click", function () {
        navLinks.classList.toggle("nav-active");
    });
});

document.addEventListener("DOMContentLoaded", function () {
    const backToTop = document.getElementById("backToTop");

    window.addEventListener("scroll", function () {
        if (window.scrollY > 300) {
            backToTop.style.display = "block";
        } else {
            backToTop.style.display = "none";
        }
    });

    backToTop.addEventListener("click", function () {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });
});