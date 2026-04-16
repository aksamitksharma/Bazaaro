const router = require('express').Router();
const { getProducts, getNearbyProducts, compareProducts, getProduct, createProduct, updateProduct, deleteProduct, bulkUpload, getMyProducts } = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');
const { uploadImage, uploadCSV } = require('../middleware/upload');

router.get('/', getProducts);
router.get('/nearby', getNearbyProducts);
router.get('/compare/:productName', compareProducts);
router.get('/vendor/my', protect, authorize('vendor'), getMyProducts);
router.get('/:id', getProduct);
router.post('/', protect, authorize('vendor'), uploadImage.array('images', 5), createProduct);
router.put('/:id', protect, authorize('vendor'), updateProduct);
router.delete('/:id', protect, authorize('vendor'), deleteProduct);
router.post('/bulk-upload', protect, authorize('vendor'), uploadCSV.single('file'), bulkUpload);

module.exports = router;
