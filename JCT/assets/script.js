// JUBILEE COFFEE & TEA - COMPLETELY REBUILT SCRIPT
console.log('Jubilee Coffee & Tea - Clean Rebuild Loading...');

// ===== SHOPIFY CONFIG =====
const SHOPIFY_CONFIG = {
  domain: 'jubileecoffeeandtea.myshopify.com',
  storefrontToken: '5ac9214b0b8fadc731882587fc8d34ad',
  apiVersion: '2023-10'
};

// ===== CART SYSTEM =====
window.jubileeCart = {
  items: [],
  count: 0,
  total: 0
};

// ===== SHOPIFY API =====
async function fetchShopifyProducts() {
  const query = `
    query {
      products(first: 50) {
        edges {
          node {
            id
            handle
            title
            description
            descriptionHtml
            productType
            tags
            images(first: 20) {
              edges {
                node {
                  id
                  url
                  altText
                  width
                  height
                }
              }
            }
            options {
              id
              name
              values
            }
            variants(first: 100) {
              edges {
                node {
                  id
                  title
                  price {
                    amount
                    currencyCode
                  }
                  compareAtPrice {
                    amount
                    currencyCode
                  }
                  availableForSale
                  quantityAvailable
                  selectedOptions {
                    name
                    value
                  }
                  image {
                    id
                    url
                    altText
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(`https://${SHOPIFY_CONFIG.domain}/api/${SHOPIFY_CONFIG.apiVersion}/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': SHOPIFY_CONFIG.storefrontToken
      },
      body: JSON.stringify({ query })
    });

    const data = await response.json();
    if (data.errors) throw new Error(JSON.stringify(data.errors));
    
    return data.data.products.edges;
  } catch (error) {
    console.error('Shopify API Error:', error);
    return [];
  }
}

// ===== IMAGE CAROUSEL =====
function createImageCarousel(images, productHandle) {
  if (!images || images.length === 0) {
    return `
      <div class="product-image placeholder">
        <div class="placeholder-text">No Image Available</div>
      </div>
    `;
  }

  if (images.length === 1) {
    return `
      <div class="product-image">
        <img src="${images[0].node.url}" alt="${images[0].node.altText || 'Product image'}" loading="lazy">
      </div>
    `;
  }

  const carouselId = `carousel-${productHandle}`;
  const imagesHtml = images.map((image, index) => `
    <div class="carousel-slide ${index === 0 ? 'active' : ''}" data-slide="${index}">
      <img src="${image.node.url}" alt="${image.node.altText || `Product image ${index + 1}`}" loading="lazy">
    </div>
  `).join('');

  const thumbnailsHtml = `
    <div class="carousel-thumbnails">
      ${images.map((image, index) => `
        <button class="carousel-thumb ${index === 0 ? 'active' : ''}" 
                onclick="goToSlide('${carouselId}', ${index})"
                data-slide="${index}">
          <img src="${image.node.url}" alt="Thumbnail ${index + 1}" loading="lazy">
        </button>
      `).join('')}
    </div>
  `;

  const navigationHtml = `
    <button class="carousel-prev" onclick="previousSlide('${carouselId}')" aria-label="Previous image">
      <i class="fas fa-chevron-left"></i>
    </button>
    <button class="carousel-next" onclick="nextSlide('${carouselId}')" aria-label="Next image">
      <i class="fas fa-chevron-right"></i>
    </button>
    <div class="carousel-indicators">
      ${images.map((_, index) => `
        <button class="carousel-dot ${index === 0 ? 'active' : ''}" 
                onclick="goToSlide('${carouselId}', ${index})"
                data-slide="${index}"
                aria-label="Go to image ${index + 1}"></button>
      `).join('')}
    </div>
  `;

  return `
    <div class="product-image-carousel" id="${carouselId}" data-current-slide="0">
      <div class="carousel-container">
        <div class="carousel-slides">
          ${imagesHtml}
        </div>
        ${navigationHtml}
      </div>
      ${thumbnailsHtml}
    </div>
  `;
}

// ===== CAROUSEL FUNCTIONS =====
function goToSlide(carouselId, slideIndex) {
  const carousel = document.getElementById(carouselId);
  if (!carousel) return;

  const slides = carousel.querySelectorAll('.carousel-slide');
  const dots = carousel.querySelectorAll('.carousel-dot');
  const thumbs = carousel.querySelectorAll('.carousel-thumb');

  slides.forEach(slide => slide.classList.remove('active'));
  dots.forEach(dot => dot.classList.remove('active'));
  thumbs.forEach(thumb => thumb.classList.remove('active'));

  if (slides[slideIndex]) {
    slides[slideIndex].classList.add('active');
    carousel.setAttribute('data-current-slide', slideIndex);
  }
  if (dots[slideIndex]) dots[slideIndex].classList.add('active');
  if (thumbs[slideIndex]) thumbs[slideIndex].classList.add('active');
}

function nextSlide(carouselId) {
  const carousel = document.getElementById(carouselId);
  if (!carousel) return;

  const currentSlide = parseInt(carousel.getAttribute('data-current-slide')) || 0;
  const totalSlides = carousel.querySelectorAll('.carousel-slide').length;
  const nextSlide = (currentSlide + 1) % totalSlides;
  
  goToSlide(carouselId, nextSlide);
}

function previousSlide(carouselId) {
  const carousel = document.getElementById(carouselId);
  if (!carousel) return;

  const currentSlide = parseInt(carousel.getAttribute('data-current-slide')) || 0;
  const totalSlides = carousel.querySelectorAll('.carousel-slide').length;
  const prevSlide = currentSlide === 0 ? totalSlides - 1 : currentSlide - 1;
  
  goToSlide(carouselId, prevSlide);
}

// ===== PRODUCT RENDERING =====
function renderProducts(products, containerId, category) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (products.length === 0) {
    container.innerHTML = `
      <div class="no-products">
        <i class="fas fa-exclamation-circle"></i>
        <h3>No ${category} products found</h3>
        <p>Please check back later or contact us for availability.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = '';

  products.forEach(({ node: product }) => {
    // Check if this is a print-on-demand product
    const isPrintOnDemand = product.tags.some(tag => {
      const tagLower = tag.toLowerCase();
      return tagLower.includes('printify') || 
             tagLower.includes('print-on-demand') ||
             tagLower.includes('pod');
    });

    const availableVariants = product.variants.edges
      .map(edge => edge.node)
      .filter(variant => variant.availableForSale);

    // Skip if no variants UNLESS print-on-demand
    if (availableVariants.length === 0 && !isPrintOnDemand) return;

    // For POD, use all variants even if stock shows 0
    const variantsToUse = isPrintOnDemand ? 
      product.variants.edges.map(edge => edge.node).filter(v => v.availableForSale !== false) :
      availableVariants;

    if (variantsToUse.length === 0) return;

    // Product category for merch filtering
    let productCategory = 'accessories';
    if (category === 'merch') {
      const tags = product.tags.map(tag => tag.toLowerCase());
      if (tags.some(tag => tag.includes('apparel') || tag.includes('clothing') || tag.includes('shirt') || tag.includes('hoodie'))) {
        productCategory = 'apparel';
      } else if (tags.some(tag => tag.includes('drinkware') || tag.includes('mug') || tag.includes('cup') || tag.includes('bottle'))) {
        productCategory = 'drinkware';
      }
    }

    // Build option selects
    let optionsHtml = '';
    let hasMultipleOptions = false;
    
    if (product.options && product.options.length > 0) {
      product.options.forEach(option => {
        // Skip "Title" option if it only has "Default Title" - common with Printify
        if (option.name === 'Title' && option.values.length === 1 && option.values[0] === 'Default Title') {
          return;
        }
        
        if (option.values && option.values.length > 0) {
          const hasMultipleValues = option.values.length > 1;
          if (hasMultipleValues) hasMultipleOptions = true;
          
          // Helper function to escape HTML attributes
          const escapeHtml = (str) => {
            return String(str)
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#039;');
          };
          
          // If only one value, auto-select it but still show the dropdown (disabled)
          const singleValue = !hasMultipleValues ? option.values[0] : null;
          
          optionsHtml += `
            <div class="option-group">
              <label for="${product.handle}-${option.name}">${option.name}:</label>
              <select class="option-select" 
                      id="${product.handle}-${option.name}"
                      data-option-name="${escapeHtml(option.name)}" 
                      ${!hasMultipleValues ? 'disabled style="opacity: 0.7; cursor: not-allowed;"' : ''}
                      onchange="updateProductPrice('${product.handle}')">
                ${hasMultipleValues ? `<option value="">Choose ${option.name}</option>` : ''}
                ${option.values.map(value => {
                  const escapedValue = escapeHtml(value);
                  return `<option value="${escapedValue}" ${singleValue === value ? 'selected' : ''}>${value}</option>`;
                }).join('')}
              </select>
            </div>
          `;
        }
      });
    }

    // Get price range
    const prices = variantsToUse.map(v => parseFloat(v.price.amount));
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceDisplay = minPrice === maxPrice ? 
      `$${minPrice.toFixed(2)}` : 
      `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`;

    // Create image carousel
    const imageCarousel = createImageCarousel(product.images.edges, product.handle);

    // Stock status - different for POD
    let stockClass = 'stock-good';
    let stockText = 'In Stock';
    
    if (isPrintOnDemand) {
      stockClass = 'stock-good';
      stockText = 'Made to Order';
    } else {
      const totalStock = variantsToUse.reduce((sum, variant) => sum + (variant.quantityAvailable || 0), 0);
      
      if (totalStock < 10 && totalStock > 0) {
        stockClass = 'stock-warning';
        stockText = 'Low Stock';
      } else if (totalStock === 0) {
        stockClass = 'stock-out';
        stockText = 'Out of Stock';
      }
    }

    // Clean description
    const description = product.description ? 
      product.description.substring(0, 200) + (product.description.length > 200 ? '...' : '') : 
      'Premium quality product from Jubilee Coffee & Tea';

    const isOutOfStock = !isPrintOnDemand && stockClass === 'stock-out';

const productHtml = `
      <div class="product-card" 
           id="card-${product.handle}"
           data-handle="${product.handle}"
           data-category="${productCategory}"
           data-product-type="${category}"
           data-print-on-demand="${isPrintOnDemand}"
           data-variants='${JSON.stringify(variantsToUse).replace(/'/g, "&#39;")}'>
        
        <div class="card-inner">
          
          <!-- FRONT SIDE -->
          <div class="card-front">
            ${imageCarousel}
            
            <div class="product-info">
              <h3 class="product-title">${product.title}</h3>
              
              <button class="flip-btn" onclick="flipCard('card-${product.handle}'); event.stopPropagation();">
                <i class="fas fa-info-circle"></i>
                View Details
              </button>
              
              <div class="product-options" id="options-${product.handle}">
                ${optionsHtml}
              </div>
              
              <div class="product-bottom">
                <div class="product-price" id="price-${product.handle}">
                  ${hasMultipleOptions ? 'Select options for pricing' : priceDisplay}
                </div>
                
                <button class="add-to-cart-btn" 
                        data-handle="${product.handle}"
                        data-name="${product.title}"
                        onclick="addToCart(this)"
                        ${hasMultipleOptions ? 'disabled' : ''}
                        ${isOutOfStock ? 'disabled' : ''}
                        data-price="${minPrice}"
                        data-variant-id="${variantsToUse[0].id}">
                  <i class="fas fa-shopping-cart"></i>
                  ${isOutOfStock ? 'Out of Stock' : (hasMultipleOptions ? 'Select Options' : 'Add to Cart')}
                </button>
              </div>
            </div>
          </div>
          
          <!-- BACK SIDE -->
          <div class="card-back">
            <div class="card-back-header">
              <h3 class="card-back-title">${product.title}</h3>
              <div class="card-back-stock">
                <span class="${stockClass}">
                  <i class="fas fa-box"></i>
                  ${stockText}
                </span>
              </div>
            </div>
            
            <div class="card-back-description">
              ${product.descriptionHtml || `<p>${product.description || 'Premium quality product from Jubilee Coffee & Tea.'}</p>`}
            </div>
            
            <button class="back-to-front-btn" onclick="flipCard('card-${product.handle}'); event.stopPropagation();">
              <i class="fas fa-arrow-left"></i>
              Back to Product
            </button>
          </div>
          
        </div>
      </div>
    `;
    
    container.insertAdjacentHTML('beforeend', productHtml);

    // Auto-update price if there are no real choices to make
    // (all options have single values, or no options at all)
    const needsUserChoice = hasMultipleOptions;
    if (!needsUserChoice) {
      setTimeout(() => updateProductPrice(product.handle), 100);
    }
  });
}

// ===== PRODUCT PRICE UPDATES =====
function updateProductPrice(handle) {
  const productCard = document.querySelector(`[data-handle="${handle}"]`);
  if (!productCard) return;

  const variants = JSON.parse(productCard.getAttribute('data-variants'));
  const isPrintOnDemand = productCard.getAttribute('data-print-on-demand') === 'true';
  const selects = productCard.querySelectorAll('.option-select');
  const priceDisplay = productCard.querySelector('.product-price');
  const button = productCard.querySelector('.add-to-cart-btn');
  
  // Helper to unescape HTML entities
  const unescapeHtml = (str) => {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = str;
    return textarea.value;
  };
  
  // Debug logging
  console.log('Updating price for:', handle);
  console.log('Total variants:', variants.length);
  console.log('First variant structure:', variants[0]);
  
  const selectedOptions = {};
  let allSelected = true;
  
  selects.forEach(select => {
    const optionName = unescapeHtml(select.getAttribute('data-option-name'));
    const value = select.value;
    
    // For disabled selects (single-value options), the value should be auto-selected
    if (value) {
      selectedOptions[optionName] = unescapeHtml(value);
    } else if (!select.disabled) {
      // Only count as "not selected" if it's an enabled select with no value
      allSelected = false;
    }
  });
  
  console.log('Selected options:', selectedOptions);
  console.log('All selected:', allSelected);
  
  if (selects.length === 0) {
    const variant = variants[0];
    if (variant) {
      const price = parseFloat(variant.price.amount);
      priceDisplay.textContent = `$${price.toFixed(2)}`;
      priceDisplay.classList.add('price-active');
      
      // POD products are always available
      const isAvailable = isPrintOnDemand ? true : (variant.availableForSale && variant.quantityAvailable > 0);
      button.disabled = !isAvailable;
      button.style.background = button.disabled ? '#6c757d' : '';
      button.style.cursor = button.disabled ? 'not-allowed' : 'pointer';
      button.setAttribute('data-price', price);
      button.setAttribute('data-variant-id', variant.id);
      button.setAttribute('data-full-name', productCard.querySelector('.product-title').textContent);
      
      button.innerHTML = isAvailable ? 
        '<i class="fas fa-shopping-cart"></i> Add to Cart' : 
        '<i class="fas fa-times"></i> Out of Stock';
    }
    return;
  }
  
  if (!allSelected) {
    priceDisplay.textContent = 'Select all options for pricing';
    priceDisplay.classList.remove('price-active');
    button.disabled = true;
    button.style.background = '#6c757d';
    button.style.cursor = 'not-allowed';
    button.innerHTML = '<i class="fas fa-cog"></i> Select Options';
    return;
  }
  
  // Improved variant matching with case-insensitive and trimmed comparison
  const matchingVariant = variants.find(variant => {
    console.log('Checking variant:', variant.title, variant.selectedOptions);
    
    // Check if all selected options match this variant
    const matches = variant.selectedOptions.every(option => {
      const optionName = option.name.trim();
      const optionValue = option.value.trim().toLowerCase();
      const selectedValue = (selectedOptions[optionName] || '').trim().toLowerCase();
      
      console.log(`  Comparing ${optionName}: "${selectedValue}" === "${optionValue}"`, selectedValue === optionValue);
      
      return selectedValue === optionValue;
    });
    
    // Also check that we have the right number of options
    const optionCountMatch = variant.selectedOptions.length === Object.keys(selectedOptions).length;
    
    console.log('  Matches all options:', matches, 'Option count match:', optionCountMatch);
    
    return matches && optionCountMatch;
  });
  
  console.log('Matching variant found:', matchingVariant);
  
  if (matchingVariant) {
    const price = parseFloat(matchingVariant.price.amount);
    const compareAtPrice = matchingVariant.compareAtPrice ? 
      parseFloat(matchingVariant.compareAtPrice.amount) : null;
    
    let priceHtml = `${price.toFixed(2)}`;
    if (compareAtPrice && compareAtPrice > price) {
      priceHtml = `
        <span class="sale-price">${price.toFixed(2)}</span>
        <span class="compare-price">${compareAtPrice.toFixed(2)}</span>
      `;
    }
    
    priceDisplay.innerHTML = priceHtml;
    priceDisplay.classList.add('price-active');
    
    // POD products are always available
    const isAvailable = isPrintOnDemand ? true : (matchingVariant.availableForSale && matchingVariant.quantityAvailable > 0);
    
    button.disabled = !isAvailable;
    button.style.background = button.disabled ? '#6c757d' : '';
    button.style.cursor = button.disabled ? 'not-allowed' : 'pointer';
    button.setAttribute('data-price', price);
    button.setAttribute('data-variant-id', matchingVariant.id);
    
    const baseTitle = productCard.querySelector('.product-title').textContent;
    const optionText = Object.entries(selectedOptions).map(([key, value]) => `${key}: ${value}`).join(', ');
    const fullProductName = optionText ? `${baseTitle} (${optionText})` : baseTitle;
    button.setAttribute('data-full-name', fullProductName);
    
    button.innerHTML = isAvailable ? 
      '<i class="fas fa-shopping-cart"></i> Add to Cart' : 
      '<i class="fas fa-times"></i> Out of Stock';
    
    // Only update stock warning for non-POD items
    if (!isPrintOnDemand && matchingVariant.quantityAvailable < 10 && matchingVariant.quantityAvailable > 0) {
      const stockElement = productCard.querySelector('.product-stock span');
      if (stockElement) {
        stockElement.className = 'stock-warning';
        stockElement.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Low Stock`;
      }
    }
  } else {
    // No matching variant found - try fallback strategies
    console.error('No matching variant found. Trying fallback...');
    
    // If there's only one variant, use it regardless
    if (variants.length === 1) {
      console.log('Only one variant exists, using it as fallback');
      const variant = variants[0];
      const price = parseFloat(variant.price.amount);
      
      priceDisplay.textContent = `${price.toFixed(2)}`;
      priceDisplay.classList.add('price-active');
      
      const isAvailable = isPrintOnDemand ? true : (variant.availableForSale && variant.quantityAvailable > 0);
      
      button.disabled = !isAvailable;
      button.style.background = button.disabled ? '#6c757d' : '';
      button.style.cursor = button.disabled ? 'not-allowed' : 'pointer';
      button.setAttribute('data-price', price);
      button.setAttribute('data-variant-id', variant.id);
      button.setAttribute('data-full-name', productCard.querySelector('.product-title').textContent);
      
      button.innerHTML = isAvailable ? 
        '<i class="fas fa-shopping-cart"></i> Add to Cart' : 
        '<i class="fas fa-times"></i> Out of Stock';
    } else {
      // Multiple variants exist but none match - show helpful error
      priceDisplay.textContent = 'Variant not found';
      priceDisplay.classList.remove('price-active');
      button.disabled = true;
      button.style.background = '#6c757d';
      button.style.cursor = 'not-allowed';
      button.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Variant Not Found';
      
      // Log helpful debug info
      console.error('Selected options:', selectedOptions);
      console.error('Available variants:', variants.map(v => ({
        title: v.title,
        options: v.selectedOptions
      })));
    }
  }
}

// ===== FLIP CARD FUNCTION =====
function flipCard(cardId) {
  const card = document.getElementById(cardId);
  if (card) {
    card.classList.toggle('flipped');
  }
}

// ===== CART FUNCTIONS =====
function addToCart(button) {
  const productCard = button.closest('.product-card');
  const productTitle = productCard.querySelector('.product-title').textContent;
  const fullName = button.getAttribute('data-full-name') || productTitle;
  const price = parseFloat(button.getAttribute('data-price'));
  const variantId = button.getAttribute('data-variant-id');
  
  if (!price || price <= 0) {
    showNotification('Please select all options first', 'warning');
    return;
  }

  if (!variantId) {
    showNotification('Product variant not found', 'error');
    return;
  }

  const item = {
    id: Date.now() + Math.random(),
    name: fullName,
    baseProductName: productTitle,
    price: price,
    quantity: 1,
    variantId: variantId,
    handle: productCard.getAttribute('data-handle')
  };

  const existing = window.jubileeCart.items.find(cartItem => 
    cartItem.name === fullName && cartItem.variantId === variantId
  );

  if (existing) {
    existing.quantity += 1;
    showNotification(`Updated ${fullName} quantity`, 'success');
  } else {
    window.jubileeCart.items.push(item);
    showNotification(`Added ${fullName} to cart`, 'success');
  }

  updateCartDisplay();
  saveCart();
  
  const originalText = button.innerHTML;
  button.innerHTML = '<i class="fas fa-check"></i> Added!';
  button.style.background = 'var(--success)';
  button.disabled = true;
  
  const cartCount = document.getElementById('cart-count');
  if (cartCount) {
    cartCount.style.animation = 'cartPulse 0.6s ease';
    setTimeout(() => {
      if (cartCount) cartCount.style.animation = '';
    }, 600);
  }
  
  setTimeout(() => {
    button.innerHTML = originalText;
    button.style.background = '';
    button.disabled = false;
  }, 1500);
}

function showNotification(message, type) {
  const existing = document.querySelector('.notification');
  if (existing) existing.remove();

  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => notification.classList.add('show'), 100);
  
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 4000);
  
  notification.onclick = () => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  };
}

function updateCartDisplay() {
  const totalItems = window.jubileeCart.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = window.jubileeCart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  window.jubileeCart.count = totalItems;
  window.jubileeCart.total = totalPrice;

  document.querySelectorAll('#cart-count').forEach(el => {
    el.textContent = totalItems;
  });
}

function saveCart() {
  try {
    localStorage.setItem('jubilee_cart', JSON.stringify(window.jubileeCart));
  } catch (e) {
    console.warn('Could not save cart');
  }
}

function loadCart() {
  try {
    const saved = localStorage.getItem('jubilee_cart');
    if (saved) {
      const cartData = JSON.parse(saved);
      window.jubileeCart = cartData;
      updateCartDisplay();
    }
  } catch (e) {
    window.jubileeCart = { items: [], count: 0, total: 0 };
  }
}

// ===== PAGE LOADERS =====
async function loadCoffeePage() {
  const container = document.getElementById('coffee-products');
  if (container) {
    container.innerHTML = `
      <div class="loading-state">
        <i class="fas fa-coffee fa-spin"></i>
        <h3>Loading Fresh Coffee Selection...</h3>
      </div>
    `;
  }

  try {
    const products = await fetchShopifyProducts();
    const coffeeProducts = products.filter(({ node }) => {
      const tags = node.tags.map(tag => tag.toLowerCase());
      const title = node.title.toLowerCase();
      const productType = node.productType.toLowerCase();
      
      return tags.some(tag => tag.includes('coffee')) ||
             title.includes('coffee') ||
             productType.includes('coffee');
    });
    
    renderProducts(coffeeProducts, 'coffee-products', 'coffee');
  } catch (error) {
    if (container) {
      container.innerHTML = `
        <div class="error-state">
          <i class="fas fa-exclamation-triangle"></i>
          <h3>Error Loading Products</h3>
          <button onclick="loadCoffeePage()">Try Again</button>
        </div>
      `;
    }
  }
}

async function loadTeaPage() {
  const container = document.getElementById('tea-products');
  if (container) {
    container.innerHTML = `
      <div class="loading-state">
        <i class="fas fa-leaf fa-spin"></i>
        <h3>Loading Premium Tea Collection...</h3>
      </div>
    `;
  }

  try {
    const products = await fetchShopifyProducts();
    const teaProducts = products.filter(({ node }) => {
      const tags = node.tags.map(tag => tag.toLowerCase());
      const title = node.title.toLowerCase();
      const productType = node.productType.toLowerCase();
      
      return tags.some(tag => tag.includes('tea')) ||
             title.includes('tea') ||
             productType.includes('tea');
    });
    
    renderProducts(teaProducts, 'tea-products', 'tea');
  } catch (error) {
    if (container) {
      container.innerHTML = `
        <div class="error-state">
          <i class="fas fa-exclamation-triangle"></i>
          <h3>Error Loading Products</h3>
          <button onclick="loadTeaPage()">Try Again</button>
        </div>
      `;
    }
  }
}

async function loadMerchPage() {
  const container = document.getElementById('merch-products');
  if (container) {
    container.innerHTML = `
      <div class="loading-state">
        <i class="fas fa-tshirt fa-spin"></i>
        <h3>Loading Jubilee Merchandise...</h3>
      </div>
    `;
  }

  try {
    const products = await fetchShopifyProducts();
    const merchProducts = products.filter(({ node }) => {
      const tags = node.tags.map(tag => tag.toLowerCase());
      const title = node.title.toLowerCase();
      const productType = node.productType.toLowerCase();
      
      const isCoffeeOrTea = tags.some(tag => tag.includes('coffee') || tag.includes('tea')) ||
                           title.includes('coffee') || title.includes('tea') ||
                           productType.includes('coffee') || productType.includes('tea');
      
      if (isCoffeeOrTea) return false;
      
      return tags.some(tag => 
        tag.includes('apparel') || tag.includes('clothing') || tag.includes('shirt') || 
        tag.includes('hoodie') || tag.includes('drinkware') || tag.includes('mug') || 
        tag.includes('cup') || tag.includes('bottle') || tag.includes('accessories') ||
        tag.includes('merch') || tag.includes('merchandise')
      ) || productType.includes('apparel') || productType.includes('accessories');
    });
    
    renderProducts(merchProducts, 'merch-products', 'merch');
    setTimeout(() => setupMerchFilters(), 500);
  } catch (error) {
    if (container) {
      container.innerHTML = `
        <div class="error-state">
          <i class="fas fa-exclamation-triangle"></i>
          <h3>Error Loading Products</h3>
          <button onclick="loadMerchPage()">Try Again</button>
        </div>
      `;
    }
  }
}

function setupMerchFilters() {
  const filterButtons = document.querySelectorAll('.filter-btn');
  if (filterButtons.length === 0) return;

  filterButtons.forEach(button => {
    button.onclick = function() {
      const filter = this.getAttribute('data-filter');
      
      filterButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
      
      const products = document.querySelectorAll('.product-card[data-category]');
      
      products.forEach(product => {
        const category = product.getAttribute('data-category');
        const shouldShow = filter === 'all' || category === filter;
        
        if (shouldShow) {
          product.style.display = 'block';
          product.classList.remove('filtered-out');
        } else {
          product.style.display = 'none';
          product.classList.add('filtered-out');
        }
      });
    };
  });
}

// ===== CART PAGE =====
function populateCartPage() {
  const emptyCart = document.getElementById('empty-cart');
  const cartList = document.getElementById('cart-items-list');
  const cartSummary = document.getElementById('cart-summary');

  if (!emptyCart || !cartList) return;

  if (window.jubileeCart.items.length === 0) {
    emptyCart.style.display = 'block';
    cartList.style.display = 'none';
    if (cartSummary) cartSummary.style.display = 'none';
    return;
  }

  emptyCart.style.display = 'none';
  cartList.style.display = 'block';
  if (cartSummary) cartSummary.style.display = 'block';
  
  cartList.innerHTML = '';

  let totalItems = 0;
  let totalPrice = 0;

  window.jubileeCart.items.forEach((item, index) => {
    const itemTotal = item.price * item.quantity;
    totalItems += item.quantity;
    totalPrice += itemTotal;

    const cartItemHtml = `
      <div class="cart-item" data-item-index="${index}">
        <div class="cart-item-image">
          <i class="fas fa-coffee item-icon"></i>
        </div>
        <div class="cart-item-info">
          <h4>${item.name}</h4>
          <div class="item-details">
            <span class="option">$${item.price.toFixed(2)} each</span>
          </div>
          <div class="quantity-controls">
            <button class="qty-btn" onclick="updateQuantity(${index}, -1)">
              <i class="fas fa-minus"></i>
            </button>
            <div class="quantity-display">${item.quantity}</div>
            <button class="qty-btn" onclick="updateQuantity(${index}, 1)">
              <i class="fas fa-plus"></i>
            </button>
            <button class="qty-btn remove" onclick="removeFromCart(${index})">
              <i class="fas fa-trash"></i> Remove
            </button>
          </div>
        </div>
        <div class="cart-item-total">$${itemTotal.toFixed(2)}</div>
      </div>
    `;

    cartList.insertAdjacentHTML('beforeend', cartItemHtml);
  });

  const elements = {
    'cart-item-count': `${totalItems} item${totalItems !== 1 ? 's' : ''}`,
    'cart-subtotal': `$${totalPrice.toFixed(2)}`
  };

  Object.entries(elements).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  });
}

function removeFromCart(index) {
  if (window.jubileeCart.items[index]) {
    const item = window.jubileeCart.items[index];
    window.jubileeCart.items.splice(index, 1);
    updateCartDisplay();
    saveCart();
    populateCartPage();
    showNotification(`Removed ${item.name} from cart`, 'info');
  }
}

function updateQuantity(index, change) {
  if (window.jubileeCart.items[index]) {
    const item = window.jubileeCart.items[index];
    const newQuantity = item.quantity + change;
    
    if (newQuantity <= 0) {
      removeFromCart(index);
    } else {
      item.quantity = newQuantity;
      updateCartDisplay();
      saveCart();
      populateCartPage();
      showNotification(`Updated ${item.name} quantity to ${newQuantity}`, 'info');
    }
  }
}

function proceedToCheckout() {
  if (window.jubileeCart.items.length === 0) {
    showNotification('Your cart is empty!', 'warning');
    return;
  }
  
  try {
    const cartItems = window.jubileeCart.items.map(item => {
      let variantId = item.variantId;
      if (typeof variantId === 'string' && variantId.includes('gid://shopify/ProductVariant/')) {
        variantId = variantId.replace('gid://shopify/ProductVariant/', '');
      }
      return `${variantId}:${item.quantity}`;
    }).join(',');
    
    const checkoutUrl = `https://${SHOPIFY_CONFIG.domain}/cart/${cartItems}`;
    window.location.href = checkoutUrl;
  } catch (error) {
    showNotification('Checkout error. Please try again or contact us.', 'error');
  }
}

// ===== SUPER SIMPLE MOBILE MENU =====
function initMobileMenu() {
  const toggle = document.getElementById('mobile-toggle');
  const nav = document.getElementById('mobile-nav');
  
  if (toggle && nav) {
    toggle.onclick = function() {
      const isOpen = nav.classList.contains('mobile-open');
      
      if (isOpen) {
        nav.classList.remove('mobile-open');
        this.innerHTML = '<i class="fas fa-bars"></i>';
      } else {
        nav.classList.add('mobile-open');
        this.innerHTML = '<i class="fas fa-times"></i>';
      }
    };
    
    // Close when clicking nav links
    nav.onclick = function(e) {
      if (e.target.tagName === 'A') {
        nav.classList.remove('mobile-open');
        toggle.innerHTML = '<i class="fas fa-bars"></i>';
      }
    };
  }
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
  // Initialize mobile menu immediately
  initMobileMenu();
  
  // Load cart
  loadCart();
  
  // Check page type and initialize accordingly
  const path = window.location.pathname;
  
  if (path.includes('coffee')) {
    loadCoffeePage();
  } else if (path.includes('tea')) {
    loadTeaPage();
  } else if (path.includes('merch')) {
    loadMerchPage();
  } else if (path.includes('cart')) {
    setTimeout(function() {
      populateCartPage();
      const checkoutBtn = document.getElementById('checkout-btn');
      if (checkoutBtn) {
        checkoutBtn.onclick = proceedToCheckout;
      }
    }, 200);
  }
});

// ===== GLOBAL EXPORTS =====
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateQuantity = updateQuantity;
window.updateProductPrice = updateProductPrice;
window.populateCartPage = populateCartPage;
window.goToSlide = goToSlide;
window.nextSlide = nextSlide;
window.previousSlide = previousSlide;
window.showNotification = showNotification;
window.flipCard = flipCard;