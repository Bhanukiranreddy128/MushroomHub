export const products = [
  {
    id: "oyster",
    name: "Blue Oyster Mushrooms",
    type: "Oyster",
    farm: "Himalayan Forest Spores Farm",
    place: "Dehradun, Uttarakhand",
    price: 350,
    unit: "kg",
    tag: "Just harvested",
    color: "sage",
    imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80",
    note: "Tender, savory, and ready for the skillet. Harvested this morning."
  },
  {
    id: "shiitake",
    name: "Oak Forest Shiitake",
    type: "Shiitake",
    farm: "Nilgiri Mycelium Growers",
    place: "Ooty, Tamil Nadu",
    price: 550,
    unit: "kg",
    tag: "Organic",
    color: "rust",
    imageUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop&q=80",
    note: "Deep umami caps grown on sustainably sourced broadleaf oak logs."
  },
  {
    id: "lion-mane",
    name: "Lion’s Mane Pom-Poms",
    type: "Specialty",
    farm: "Himalayan Forest Spores Farm",
    place: "Dehradun, Uttarakhand",
    price: 650,
    unit: "kg",
    tag: "Small batch",
    color: "cream",
    imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80",
    note: "Hand-picked clusters with a delicate, scallop-like texture rich in nootropic hericenones."
  },
  {
    id: "cremini",
    name: "Cremini & Button Mushrooms",
    type: "Cremini",
    farm: "Valley Cap Farm",
    place: "Pune, Maharashtra",
    price: 240,
    unit: "kg",
    tag: "Local favorite",
    color: "gold",
    imageUrl: "https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?w=600&auto=format&fit=crop&q=80",
    note: "A versatile kitchen staple from our climate-controlled family facility."
  },
  {
    id: "king-oyster",
    name: "Royal King Trumpet Oysters",
    type: "Oyster",
    farm: "Himalayan Forest Spores Farm",
    place: "Dehradun, Uttarakhand",
    price: 450,
    unit: "kg",
    tag: "Chef’s pick",
    color: "sage",
    imageUrl: "https://images.unsplash.com/photo-1588879462719-7517c5b65ef3?w=600&auto=format&fit=crop&q=80",
    note: "Thick, meaty cylindrical stems that shine grilled or roasted as vegetarian scallops."
  },
  {
    id: "golden-oyster",
    name: "Sunshine Golden Oysters",
    type: "Oyster",
    farm: "Nilgiri Mycelium Growers",
    place: "Ooty, Tamil Nadu",
    price: 380,
    unit: "kg",
    tag: "Limited harvest",
    color: "gold",
    imageUrl: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80",
    note: "Bright yellow frilly clusters with delicate nutty aroma when lightly pan-crisped."
  }
];

export function isCustomerAuthenticated() {
  const saved = localStorage.getItem("mushroomhub_auth_user");
  if (!saved) return false;
  try {
    const user = JSON.parse(saved);
    return Boolean(user && user.isLoggedIn && user.role === "customer");
  } catch {
    return false;
  }
}

export function addToCart(product) {
  const cart = JSON.parse(localStorage.getItem("mushroom-cart") || "[]");
  const item = cart.find((entry) => entry.id === product.id);
  if (item) item.quantity += 1;
  else cart.push({ ...product, quantity: 1 });
  localStorage.setItem("mushroom-cart", JSON.stringify(cart));
  window.dispatchEvent(new Event("cart-updated"));
  return true;
}

export function getCart() {
  return JSON.parse(localStorage.getItem("mushroom-cart") || "[]");
}

export { addDealToCart } from "./data/store";

