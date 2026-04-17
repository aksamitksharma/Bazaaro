const { validationResult, body } = require('express-validator');

// Handle validation errors
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
      errors: errors.array().map(e => ({ field: e.path, message: e.msg }))
    });
  }
  next();
};

// Common validation rules
const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('phone').trim().notEmpty().withMessage('Phone is required')
    .matches(/^[6-9]\d{9}$/).withMessage('Invalid Indian phone number'),
  body('role').optional().isIn(['customer', 'vendor', 'delivery']).withMessage('Invalid role')
];

const loginRules = [
  body('phone').trim().notEmpty().withMessage('Phone is required'),
  body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

const productRules = [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer')
];

const orderRules = [
  body('vendorId').notEmpty().withMessage('Vendor ID is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.productId').notEmpty().withMessage('Product ID is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('deliveryAddress').notEmpty().withMessage('Delivery address is required')
];

module.exports = { validate, registerRules, loginRules, productRules, orderRules };
