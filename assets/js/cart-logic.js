// ==========================================
// THE SINGLE SOURCE OF TRUTH FOR THE CART
// ==========================================

// 1. Update the red number on the cart icon
window.updateCartCount = function() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // Count actual quantity, not just unique items
    let totalItems = 0;
    cart.forEach(item => {
        totalItems += (item.quantity || 1);
    });
    
    const badge = document.getElementById('cart-count');
    if (badge) {
        badge.innerText = totalItems;
    }
};

// 2. Add an item to the Bag
window.addToCart = function(id, name, price) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    const existingProduct = cart.find(item => item.id === id);
    
    if (existingProduct) {
        existingProduct.quantity += 1;
    } else {
        cart.push({ id, name, price, quantity: 1 });
    }
    
    // Save to the universal 'cart' memory slot
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Update the red bubble instantly
    window.updateCartCount();
    
    alert(`🛍️ ${name} added to your bag!`);
};

// 3. Run the count update as soon as ANY page loads
document.addEventListener('DOMContentLoaded', window.updateCartCount);

// 4. Listen for changes (keeps tabs synced if user opens shop in two windows)
window.addEventListener('storage', (event) => {
    if (event.key === 'cart') {
        window.updateCartCount();
    }
});