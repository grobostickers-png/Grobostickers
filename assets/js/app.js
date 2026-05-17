
// === GLOBAL STATE ===
let finalTotal = 0;
let discountPercent = 0;
let activeCoupon = null;

// === CART & PRODUCT LOGIC ===

async function loadProducts() {
    const grid = document.getElementById('product-grid');
    if (!grid) return;

    const { data, error } = await supa.from('products').select('*');
    if (error) return console.error(error);

   // Replace the old onclick='openModal(...)' with a link to the new page
    grid.innerHTML = data.map(p => {
        return `
        <div class="product-card p-6 flex flex-col justify-between h-full relative overflow-hidden">
            <div onclick="window.location.href='product.html?id=${p.id}'" 
                 class="cursor-pointer bg-[#fffbfb] rounded-[30px] p-8 mb-6 flex items-center justify-center group border border-[#fff0f3]">
                <img src="${p.image_url}" class="sticker-img">
            </div>
            <div class="product-info">
                <h3 class="font-bold text-lg text-[#5c4b51]">${p.name}</h3>
                <p class="text-[#ffafcc] font-bold text-lg mb-4">₹${p.price}</p>
                
                <button onclick='window.addToCart(${p.id}, ${JSON.stringify(p.name)}, ${p.price})' class="btn-primary w-full">
                    Add To Bag 🛍️
                </button>
            </div>
        </div>
        `;
    }).join('');
}

// --- REVIEW SYSTEM LOGIC ---

document.getElementById('review-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('submit-review-btn');
    const name = document.getElementById('rev-name').value;
    const comment = document.getElementById('rev-comment').value;
    const imageFile = document.getElementById('rev-image').files[0];
    const container = document.getElementById('reviews-container');

    btn.disabled = true;
    btn.innerText = "Uploading...";

    let photoUrl = null;

    try {
        // 1. Upload Photo
        if (imageFile) {
            const fileExt = imageFile.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supa.storage.from('review-photos').upload(fileName, imageFile);
            if (uploadError) throw uploadError;
            const { data } = supa.storage.from('review-photos').getPublicUrl(fileName);
            photoUrl = data.publicUrl;
        }

        // 2. Save to Database
        const { error: dbError } = await supa.from('reviews').insert([{
            customer_name: name,
            comment: comment,
            photo_url: photoUrl,
            is_approved: false
        }]);

        if (dbError) throw dbError;

        // 3. SHOW IMMEDIATE PREVIEW (The "Magic" part)
        const previewHTML = `
            <div class="bg-blue-50 p-4 rounded-2xl border-2 border-blue-200 flex flex-col relative">
                <span class="absolute -top-3 -right-2 bg-blue-600 text-white text-[10px] font-black px-2 py-1 rounded-lg uppercase shadow-sm">
                    Pending Approval
                </span>
                ${photoUrl ? `<img src="${photoUrl}" class="w-full h-48 object-cover rounded-xl mb-4 grayscale-[50%]">` : ''}
                <div class="flex-grow">
                    <p class="font-black text-gray-900">${name}</p>
                    <p class="text-sm text-gray-600 mt-2 italic">"${comment}"</p>
                </div>
            </div>
        `;
        
        // Add to the top of the list
        container.insertAdjacentHTML('afterbegin', previewHTML);
        
        alert("Success! Your review is visible to you now and will be public once approved.");
        document.getElementById('review-form').reset();

    } catch (err) {
        console.error("Review Error:", err);
        alert("Error submitting review: " + err.message);
    } finally {
        btn.disabled = false;
        btn.innerText = "Post Review";
    }
});

// 2. Load Approved Reviews on the page
async function loadReviews() {
    const container = document.getElementById('reviews-container');
    if (!container) return;

    const { data, error } = await supa
        .from('reviews')
        .select('*')
        .eq('is_approved', true)
        .order('id', { ascending: false });

    if (error) return console.error(error);

    if (data.length === 0) {
        container.innerHTML = `<p class="text-gray-500 italic">No reviews yet. Be the first!</p>`;
        return;
    }

    container.innerHTML = data.map(rev => `
        <div class="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
            ${rev.photo_url ? `<img src="${rev.photo_url}" class="w-full h-48 object-cover rounded-xl mb-4 border border-gray-100">` : ''}
            <div class="flex-grow">
                <p class="font-black text-gray-900">${rev.customer_name}</p>
                <p class="text-sm text-gray-600 mt-2 leading-relaxed">"${rev.comment}"</p>
            </div>
        </div>
    `).join('');
}

// Make sure to call loadReviews() when the page loads!
// === INITIALIZATION ===
// Runs automatically when the webpage loads
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    loadReviews();
});

// --- PRODUCT MODAL LOGIC ---

function openModal(product) {
    const modal = document.getElementById('product-modal');
    
    // Fill the modal with product data from Supabase
    document.getElementById('modal-img').src = product.image_url;
    document.getElementById('modal-name').innerText = product.name;
    document.getElementById('modal-desc').innerText = product.description || "Premium vinyl sticker, waterproof and sun-proof. Perfect for any surface.";
    document.getElementById('modal-size').innerText = `Size: ${product.size || "Standard 3x3"}`;
    document.getElementById('modal-price').innerText = `₹${Math.round(product.price)}`;
    
    // Set up the "Add to Deck" button inside the modal
    const addBtn = document.getElementById('modal-add-btn');
    addBtn.onclick = () => {
        addToCart(product.id, product.name, product.price);
        closeModal();
    };

    // Show the modal and stop background scrolling
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; 
}

function closeModal() {
    const modal = document.getElementById('product-modal');
    modal.classList.add('hidden');
    document.body.style.overflow = 'auto'; // Re-enable scrolling
}

// Close modal if user clicks the dark background
window.onclick = function(event) {
    const modal = document.getElementById('product-modal');
    if (event.target == modal) {
        closeModal();
    }
};