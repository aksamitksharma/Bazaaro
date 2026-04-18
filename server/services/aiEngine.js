const Product = require('../models/Product');
const Vendor = require('../models/Vendor');
const Order = require('../models/Order');

// Simulate basic AI logic using heuristics

/**
 * AI Smart Combo Splitting (Game Changer Feature)
 * Suggests splitting the cart across multiple vendors to achieve total lowest cost.
 */
exports.getCheapestCombo = async (requestedItems, userCoords) => {
  try {
    const itemNames = requestedItems.map(i => i.name.toLowerCase());
    
    // Find all products matching the requested names
    const matchingProducts = await Product.find({
      name: { $in: itemNames.map(n => new RegExp(n, 'i')) },
      isAvailable: true, stock: { $gt: 0 }
    }).populate('vendorId', 'shopName address');

    // 1. Calculate Single-Vendor Options
    const vendorMap = {};
    for(const prod of matchingProducts) {
      const vId = prod.vendorId._id.toString();
      if(!vendorMap[vId]) {
        vendorMap[vId] = {
          vendorId: vId, shopName: prod.vendorId.shopName,
          totalPrice: 0, matchedItemsCount: 0, matchedProducts: []
        };
      }
      
      requestedItems.forEach(req => {
        if(prod.name.toLowerCase().includes(req.name.toLowerCase())) {
          vendorMap[vId].totalPrice += prod.price * req.quantity;
          vendorMap[vId].matchedItemsCount++;
          vendorMap[vId].matchedProducts.push({...prod.toObject(), quantity: req.quantity});
        }
      });
    }

    const singleVendorOptions = Object.values(vendorMap)
      .filter(v => v.matchedItemsCount === requestedItems.length) // Fully fulfills
      .map(v => ({ ...v, type: 'single', finalEstimatedCost: v.totalPrice + 30 }));

    // 2. Calculate Muli-Vendor Optimal Split
    let splitTotalPrice = 0;
    const splitVendorsMap = new Map();
    const splitProducts = [];
    const fulfilledItems = new Set();

    requestedItems.forEach(req => {
      // Find cheapest product match for this requested item
      const optionsForThisItem = matchingProducts.filter(p => p.name.toLowerCase().includes(req.name.toLowerCase()));
      if (optionsForThisItem.length > 0) {
        optionsForThisItem.sort((a,b) => a.price - b.price);
        const bestProd = optionsForThisItem[0];
        
        splitTotalPrice += bestProd.price * req.quantity;
        const vIdStr = bestProd.vendorId._id.toString();
        if(!splitVendorsMap.has(vIdStr)) {
           splitVendorsMap.set(vIdStr, {
              vendorId: vIdStr,
              shopName: bestProd.vendorId.shopName
           });
        }
        splitProducts.push({...bestProd.toObject(), quantity: req.quantity});
        fulfilledItems.add(req.name);
      }
    });

    const multiVendorOption = [];
    if (fulfilledItems.size === requestedItems.length && splitVendorsMap.size > 1) {
      // Calculate total delivery combining unique vendors
      const uniqueVendorsArr = Array.from(splitVendorsMap.values());
      const deliveryFee = uniqueVendorsArr.length * 30;
      
      multiVendorOption.push({
        type: 'split',
        vendors: uniqueVendorsArr,
        totalPrice: splitTotalPrice,
        matchedItemsCount: requestedItems.length,
        matchedProducts: splitProducts,
        finalEstimatedCost: splitTotalPrice + deliveryFee
      });
    }

    // Combine and sort
    const allOptions = [...singleVendorOptions, ...multiVendorOption].sort((a,b) => a.finalEstimatedCost - b.finalEstimatedCost);
    return allOptions.slice(0, 3);
  } catch(error) {
    console.error('Combo engine error:', error);
    return [];
  }
};

/**
 * AI Demand Prediction
 * Predicts what products vendor needs to restock based on
 * velocity of sales vs current stock.
 */
exports.getDemandPrediction = async (vendorId) => {
  try {
    const products = await Product.find({ vendorId });
    const warnings = [];
    
    products.forEach(p => {
      // Very basic heuristic: if sold rapidly compared to existing stock
      // OR stock is critically low (< 10) but historically sells well
      const sellVelocity = p.totalSold || 1; 
      
      if(p.stock < 10) {
        warnings.push({
          productId: p._id,
          name: p.name,
          currentStock: p.stock,
          urgency: p.stock === 0 ? 'CRITICAL' : 'HIGH',
          message: `Stock is ${p.stock}! Consider ordering ${(sellVelocity * 0.5).toFixed(0)} more to meet demand.`
        });
      } else if (p.stock < (sellVelocity * 0.2)) {
        warnings.push({
          productId: p._id,
          name: p.name,
          currentStock: p.stock,
          urgency: 'MEDIUM',
          message: `Selling fast. Restock soon to prevent outage.`
        });
      }
    });

    return warnings.sort((a, b) => a.urgency === 'CRITICAL' ? -1 : 1);
  } catch (error) {
    console.error('Demand prediction error:', error);
    return [];
  }
};

/**
 * AI Price Optimization
 * Recommends pricing adjustments to beat local competition
 */
exports.getPriceSuggestions = async (vendorId) => {
  try {
    const myProducts = await Product.find({ vendorId });
    // Find all products by other vendors
    const otherProducts = await Product.find({ vendorId: { $ne: vendorId } });

    const suggestions = [];

    myProducts.forEach(myProd => {
      // Find competitors selling exactly identical item (mock global search via name matching)
      const competitors = otherProducts.filter(op => 
        op.name.toLowerCase().includes(myProd.name.toLowerCase()) || 
        myProd.name.toLowerCase().includes(op.name.toLowerCase())
      );

      if (competitors.length > 0) {
        // Average competitor price
        const avgPrice = competitors.reduce((sum, c) => sum + c.price, 0) / competitors.length;
        const lowestPrice = Math.min(...competitors.map(c => c.price));

        if (myProd.price > lowestPrice) {
          const dropAmount = myProd.price - lowestPrice + 1; // Beat them by 1 rupee
          suggestions.push({
            productId: myProd._id,
            name: myProd.name,
            currentPrice: myProd.price,
            lowestCompetitorPrice: lowestPrice,
            suggestion: `Drop price by ₹${dropAmount.toFixed(0)} to become cheapest nearby.`
          });
        } else if (myProd.price < (avgPrice * 0.8)) { // Pricing way too low!
          suggestions.push({
            productId: myProd._id,
            name: myProd.name,
            currentPrice: myProd.price,
            avgMarketPrice: avgPrice.toFixed(0),
            suggestion: `You are pricing 20%+ below market avg (₹${avgPrice.toFixed(0)}). Consider a small increase for margin.`
          });
        }
      }
    });

    return suggestions;
  } catch (error) {
    console.error('Price suggestion error:', error);
    return [];
  }
};
